import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { audit, calls, type CASE_STATUSES, cases, clocks, type CHANNELS } from "../db/schema";
import { missingQuestions } from "../ontology/clarity";
import { evaluate, sayThis, type Outcome } from "../ontology/engine";
import type { Intake } from "../ontology/schema";
import { lung } from "../pathways/lung";
import { slotsFor } from "../sim/capacity";
import { ageOf, type Person } from "../sim/people";
import { publishChange } from "./bus";

const DAY_MS = 24 * 60 * 60 * 1000;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type StepId = (typeof lung.steps)[number]["id"];

export class ActionError extends Error {
  constructor(
    message: string,
    readonly status: 404 | 409 | 422,
  ) {
    super(message);
  }
}

async function startClock(tx: Tx, caseId: string, stepId: StepId, now: Date) {
  const step = lung.steps.find((s) => s.id === stepId)!;
  const dueAt = new Date(now.getTime() + step.maxDays * DAY_MS);
  await tx.insert(clocks).values({ caseId, stepId, startedAt: now, dueAt });
  return dueAt;
}

/**
 * SubmitIntake, plus OpenFastTrackCase when a suspicion criterion matches.
 * With a verified call, age comes from the identity, never from the LLM.
 */
export async function submitIntake(raw: Intake, channel: (typeof CHANNELS)[number], callId: string) {
  const [call] = await db.select().from(calls).where(eq(calls.id, callId));
  if (!call) throw new ActionError("Call not found", 404);
  // Gate 1: nothing is recorded for an unidentified caller.
  if (call.status !== "verified" || !call.person) {
    throw new ActionError("Identity not verified. Call verify_identity first, then record the intake.", 409);
  }
  const person = call.person;
  const intake: Intake = { ...raw, age: ageOf(person) };

  // Gate 2: the intake must be clear enough to evaluate. The agent asks, then calls again.
  const questions = missingQuestions(intake);
  if (questions.length > 0) {
    throw new ActionError(`Not recorded yet. ${questions.join(" ")} Then call record_intake again with everything.`, 422);
  }

  const evaluation = evaluate(intake, lung);
  const fastTrack = evaluation.outcome === "fast_track";
  const now = new Date();

  let callbackDueAt: Date | null = null;
  const caseId = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(cases)
      .values({
        createdAt: now,
        channel,
        callId: call.id,
        person,
        county: person.county,
        pathwayId: lung.id,
        pathwayVersion: lung.version,
        intake,
        outcome: evaluation.outcome,
        matches: evaluation.matches.map((m) => ({
          criterionId: m.criterion.id,
          observationIndex: intake.observations.indexOf(m.observation),
        })),
        status: fastTrack ? "pending_review" : "advised",
      })
      .returning({ id: cases.id });
    await tx.insert(audit).values({ caseId: row.id, action: "SubmitIntake", actor: "system", data: { channel } });
    if (fastTrack) {
      callbackDueAt = await startClock(tx, row.id, "callback", now);
      await tx.insert(audit).values({
        caseId: row.id,
        action: "OpenFastTrackCase",
        actor: "system",
        data: { criterionId: evaluation.matches[0].criterion.id },
      });
    }
    await tx.update(calls).set({ status: "screened" }).where(eq(calls.id, call.id));
    return row.id;
  });

  publishChange();
  return {
    caseId,
    outcome: evaluation.outcome,
    sayThis: sayThis(evaluation, lung),
    callbackDueAt: (callbackDueAt as Date | null)?.toISOString() ?? null,
  };
}

export const CaseAction = z.enum(["confirm", "advance", "dismiss"]);
export type CaseAction = z.infer<typeof CaseAction>;

const ACTION_RULES = {
  confirm: { from: "pending_review", audit: "ConfirmCase" },
  advance: { from: "active", audit: "AdvanceStep" },
  dismiss: { from: "pending_review", audit: "DismissCase" },
} as const;

/** Nurse actions. Each stops the open clock; confirm and advance start the next step's clock. */
export async function applyCaseAction(caseId: string, action: CaseAction, notes?: string) {
  const rule = ACTION_RULES[action];
  await db.transaction(async (tx) => {
    const [c] = await tx.select().from(cases).where(eq(cases.id, caseId)).for("update");
    if (!c) throw new ActionError("Case not found", 404);
    if (c.status !== rule.from) throw new ActionError(`Cannot ${action} a case that is ${c.status}`, 409);

    const [open] = await tx
      .select()
      .from(clocks)
      .where(and(eq(clocks.caseId, caseId), isNull(clocks.stoppedAt)));
    if (!open) throw new ActionError("Case has no running clock", 409);

    const now = new Date();
    await tx.update(clocks).set({ stoppedAt: now }).where(eq(clocks.id, open.id));

    let status: (typeof CASE_STATUSES)[number] = "dismissed";
    let next: StepId | undefined;
    if (action !== "dismiss") {
      const i = lung.steps.findIndex((s) => s.id === open.stepId);
      next = lung.steps[i + 1]?.id;
      if (next) await startClock(tx, caseId, next, now);
      status = next ? "active" : "completed";
    }
    await tx
      .update(cases)
      .set({ status, ...(notes !== undefined && { notes }) })
      .where(eq(cases.id, caseId));
    await tx.insert(audit).values({
      caseId,
      action: rule.audit,
      actor: "nurse",
      data: { stoppedStep: open.stepId, startedStep: next ?? null },
    });
  });
  publishChange();
}

/** BookAppointment: attach one of the county's free slots to the running step. */
export async function bookSlot(caseId: string, slotId: string) {
  await db.transaction(async (tx) => {
    const [c] = await tx.select().from(cases).where(eq(cases.id, caseId)).for("update");
    if (!c) throw new ActionError("Case not found", 404);
    const [open] = await tx
      .select()
      .from(clocks)
      .where(and(eq(clocks.caseId, caseId), isNull(clocks.stoppedAt)));
    if (!open || c.status !== "active") throw new ActionError("No step to book", 409);
    const slot = slotsFor(c.county, open.stepId).find((s) => s.id === slotId);
    if (!slot) throw new ActionError("Slot is no longer available", 409);

    await tx.update(clocks).set({ scheduledAt: new Date(slot.at), unit: slot.unit }).where(eq(clocks.id, open.id));
    await tx.insert(audit).values({
      caseId,
      action: "BookAppointment",
      actor: "nurse",
      data: { stepId: open.stepId, at: slot.at, unit: slot.unit },
    });
  });
  publishChange();
}

export type ClockView = {
  stepId: string;
  startedAt: string;
  dueAt: string;
  stoppedAt: string | null;
  scheduledAt: string | null;
  unit: string | null;
};
export type CaseView = {
  id: string;
  callId: string | null;
  person: Person | null;
  county: string | null;
  notes: string | null;
  createdAt: string;
  channel: (typeof CHANNELS)[number];
  outcome: Outcome;
  status: (typeof cases.$inferSelect)["status"];
  intake: Intake;
  matches: { criterionId: string; observationIndex: number }[];
  clocks: ClockView[];
};

export async function listCases(limit = 50): Promise<CaseView[]> {
  return toCaseViews(await db.select().from(cases).orderBy(desc(cases.createdAt)).limit(limit));
}

export async function toCaseViews(rows: (typeof cases.$inferSelect)[]): Promise<CaseView[]> {
  if (rows.length === 0) return [];
  const clockRows = await db
    .select()
    .from(clocks)
    .where(
      inArray(
        clocks.caseId,
        rows.map((r) => r.id),
      ),
    )
    .orderBy(clocks.startedAt);

  return rows.map((r) => ({
    id: r.id,
    callId: r.callId,
    person: r.person,
    county: r.county,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    channel: r.channel,
    outcome: r.outcome,
    status: r.status,
    intake: r.intake,
    matches: r.matches,
    clocks: clockRows
      .filter((k) => k.caseId === r.id)
      .map((k) => ({
        stepId: k.stepId,
        startedAt: k.startedAt.toISOString(),
        dueAt: k.dueAt.toISOString(),
        stoppedAt: k.stoppedAt?.toISOString() ?? null,
        scheduledAt: k.scheduledAt?.toISOString() ?? null,
        unit: k.unit,
      })),
  }));
}
