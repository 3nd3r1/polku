import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { audit, calls, type CASE_STATUSES, cases, clocks, type CHANNELS } from "../db/schema";
import { evaluate, sayThis, type Outcome } from "../ontology/engine";
import type { Intake } from "../ontology/schema";
import { lung } from "../pathways/lung";
import { ageOf, type Person } from "../sim/people";
import { publishChange } from "./bus";

const DAY_MS = 24 * 60 * 60 * 1000;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type StepId = (typeof lung.steps)[number]["id"];

export class ActionError extends Error {
  constructor(
    message: string,
    readonly status: 404 | 409,
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
export async function submitIntake(raw: Intake, channel: (typeof CHANNELS)[number], callId?: string) {
  const [call] = callId ? await db.select().from(calls).where(eq(calls.id, callId)) : [];
  if (callId && !call) throw new ActionError("Call not found", 404);
  const person = call?.person ?? null;
  const intake: Intake = person ? { ...raw, age: ageOf(person) } : raw;

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
        callId: call?.id ?? null,
        person,
        county: person?.county ?? null,
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
    if (call) await tx.update(calls).set({ status: "screened" }).where(eq(calls.id, call.id));
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
export async function applyCaseAction(caseId: string, action: CaseAction) {
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
    await tx.update(cases).set({ status }).where(eq(cases.id, caseId));
    await tx.insert(audit).values({
      caseId,
      action: rule.audit,
      actor: "nurse",
      data: { stoppedStep: open.stepId, startedStep: next ?? null },
    });
  });
  publishChange();
}

export type ClockView = { stepId: string; startedAt: string; dueAt: string; stoppedAt: string | null };
export type CaseView = {
  id: string;
  callId: string | null;
  person: Person | null;
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
      })),
  }));
}
