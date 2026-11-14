import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { audit, calls, type CASE_STATUSES, cases, clocks, type CHANNELS } from "../db/schema";
import { gapQuestion, gaps } from "../ontology/clarity";
import { evaluate, sayThis, type Outcome } from "../ontology/engine";
import { shortDayTime, spokenDayTime, STEP_LABEL, STEP_SPOKEN } from "../ontology/labels";
import type { Intake } from "../ontology/schema";
import { lung } from "../pathways/lung";
import { ageOf, type Person } from "../sim/people";
import { publishChange } from "./bus";
import { ActionError } from "./errors";
import { logAccess, refuse, requireIdentified, verifyIdentity } from "./identity";
import { logRecord } from "./record";

export { ActionError };

const DAY_MS = 24 * 60 * 60 * 1000;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type StepId = (typeof lung.steps)[number]["id"];
type Clock = typeof clocks.$inferSelect;

async function startClock(tx: Tx, caseId: string, stepId: StepId, now: Date) {
  const step = lung.steps.find((s) => s.id === stepId)!;
  const dueAt = new Date(now.getTime() + step.maxDays * DAY_MS);
  await tx.insert(clocks).values({ caseId, stepId, startedAt: now, dueAt });
  return dueAt;
}

const OPEN: (typeof CASE_STATUSES)[number][] = ["pending_review", "active"];

const OUTCOME_LOG: Record<Outcome, string> = {
  fast_track: "Rules: fast track, nurse callback set",
  call_112: "Emergency rule: call 112",
  see_gp: "Rules: no fast track, see a GP",
  no_match: "Rules: no criterion matched",
};

async function openCaseOf(personId: string) {
  const [c] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.personId, personId), inArray(cases.status, OPEN)))
    .orderBy(desc(cases.createdAt))
    .limit(1);
  return c ?? null;
}

async function runningClock(caseId: string): Promise<Clock | null> {
  const [k] = await db
    .select()
    .from(clocks)
    .where(and(eq(clocks.caseId, caseId), isNull(clocks.stoppedAt)));
  return k ?? null;
}

/** What the caller hears about their case. Fixed text from the clock, never generated. */
export function caseStatusSentence(k: Clock, now = new Date()) {
  const step = STEP_SPOKEN[k.stepId] ?? "the next step";
  if (k.scheduledAt) {
    return `Your next step is ${step}. It is booked for ${spokenDayTime(k.scheduledAt)}${k.unit ? ` at ${k.unit}` : ""}.`;
  }
  if (k.dueAt < now) {
    return `Your next step is ${step}. It was promised by ${spokenDayTime(k.dueAt)} and is late. I have noted that you called, and the care team will see it.`;
  }
  return `Your next step is ${step}. It is promised by ${spokenDayTime(k.dueAt)}.`;
}

/**
 * GetCase: the identified caller's own open case, nothing else. Takes no
 * lookup key, so the agent cannot ask for anyone else's.
 */
export async function getCase(callId: string) {
  const { person } = await requireIdentified(callId, "get_case");
  const open = await openCaseOf(person.id);
  if (!open) {
    await logAccess(callId, "get_case", "allowed", "Own record only: no open case");
    publishChange();
    return { summary: null, sayThis: "The caller has no open case. Ask what symptoms they have been having." };
  }
  const clock = await runningClock(open.id);
  if (clock?.offeredSlots?.length && !clock.scheduledAt) return offerTimes(callId, open.id, clock, clock.offeredSlots);
  const summary = clock ? caseStatusSentence(clock) : "Your case is open with the care team.";
  await db.update(calls).set({ caseId: open.id }).where(eq(calls.id, callId));
  await logRecord(open.id, "call", "read", ["identity", "booking"], "Polku agent");
  await db.insert(audit).values({ caseId: open.id, action: "CallerCheckedStatus", actor: "system", data: { callId } });
  const where = clock
    ? `${STEP_LABEL[clock.stepId]}, ${clock.scheduledAt ? `booked ${shortDayTime(clock.scheduledAt)}` : `due ${shortDayTime(clock.dueAt)}`}`
    : "open";
  await logAccess(callId, "get_case", "allowed", `Own record only: ${where}`);
  publishChange();
  return {
    summary,
    sayThis: `The caller has an open case. Tell them: "${summary}" Then ask whether anything is new or worse. If so, collect it and call record_intake.`,
  };
}

/**
 * The verify_identity tool: identification, then the caller's own case in the
 * same reply. One tool call instead of two in a row, which small open models
 * get wrong (they answer from imagination instead of calling get_case).
 */
export async function identify(callId: string, spokenHetu: string) {
  const who = await verifyIdentity(callId, spokenHetu);
  const theirCase = await getCase(callId);
  return { sayThis: `${who.sayThis} Their case is already looked up, so do not call get_case now. ${theirCase.sayThis}` };
}

/** The caller has times waiting to be picked: read them as numbered options. */
async function offerTimes(callId: string, caseId: string, clock: Clock, slots: { at: string; unit: string }[]) {
  const step = STEP_SPOKEN[clock.stepId] ?? "your next appointment";
  const options = slots.map((s, i) => `option ${i + 1}, ${spokenDayTime(new Date(s.at))}`).join("; ");
  const summary = `The nurse has reviewed your case, and we have times for ${step} at ${slots[0].unit}: ${options}. Which one suits you?`;
  await db.update(calls).set({ caseId }).where(eq(calls.id, callId));
  await logRecord(caseId, "call", "read", ["identity", "booking"], "Polku agent");
  await db.insert(audit).values({ caseId, action: "CallerHeardTimes", actor: "system", data: { callId } });
  await logAccess(callId, "get_case", "allowed", `Own record only: ${slots.length} ${STEP_LABEL[clock.stepId]} times to choose from`);
  publishChange();
  return {
    summary,
    sayThis: `Tell them: "${summary}" When they choose, call book_time with the option number. If none suits, call book_time with option 0.`,
  };
}

/**
 * SubmitIntake. A new caller gets a case (OpenFastTrackCase when a suspicion
 * criterion matches). A caller with an open case gets the symptoms added to it.
 * Age comes from the verified identity, never from the LLM.
 */
export async function submitIntake(raw: Intake, channel: (typeof CHANNELS)[number], callId: string) {
  const { call, person } = await requireIdentified(callId, "record_intake");
  if (call.outcome) {
    throw await refuse(callId, "record_intake", "Already recorded on this call", "Already recorded on this call. Say goodbye.", 409);
  }
  const intake: Intake = { ...raw, age: ageOf(person) };

  // The packet fills on screen with every attempt, gaps included.
  const missing = gaps(intake);
  await db.update(calls).set({ draft: { intake, gaps: missing } }).where(eq(calls.id, callId));

  // The intake must be clear enough to evaluate. The agent asks, then calls again.
  const questions = missing.map(gapQuestion);
  if (questions.length > 0) {
    await logAccess(callId, "record_intake", "ask", `Not clear yet. ${questions.join(" ")}`);
    publishChange();
    throw new ActionError(`Not recorded yet. ${questions.join(" ")} Then call record_intake again with everything.`, 422);
  }

  const evaluation = evaluate(intake, lung);
  const open = await openCaseOf(person.id);
  if (open) return addToOpenCase(open, intake, evaluation, call.id);
  return openNewCase(person, intake, evaluation, channel, call.id);
}

async function addToOpenCase(
  open: typeof cases.$inferSelect,
  intake: Intake,
  evaluation: ReturnType<typeof evaluate>,
  callId: string,
) {
  await db.transaction(async (tx) => {
    await tx
      .update(cases)
      .set({
        intake: { ...open.intake, smoking: intake.smoking, observations: [...open.intake.observations, ...intake.observations] },
      })
      .where(eq(cases.id, open.id));
    await tx.insert(audit).values({
      caseId: open.id,
      action: "CallerUpdate",
      actor: "system",
      data: { callId, observations: intake.observations, outcome: evaluation.outcome },
    });
    await logRecord(open.id, "call", "write", ["symptoms"], "Polku agent", tx);
    await tx.update(calls).set({ status: "screened", caseId: open.id, outcome: evaluation.outcome }).where(eq(calls.id, callId));
  });
  await logAccess(callId, "record_intake", "allowed", "Added to own open case");
  publishChange();
  return {
    caseId: open.id,
    outcome: evaluation.outcome,
    sayThis:
      evaluation.outcome === "call_112"
        ? sayThis(evaluation, lung)
        : "Thank you. I have added this to your case, and the nurse will see it.",
    callbackDueAt: null,
  };
}

async function openNewCase(
  person: Person,
  intake: Intake,
  evaluation: ReturnType<typeof evaluate>,
  channel: (typeof CHANNELS)[number],
  callId: string,
) {
  const fastTrack = evaluation.outcome === "fast_track";
  const now = new Date();

  let callbackDueAt: Date | null = null;
  const caseId = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(cases)
      .values({
        createdAt: now,
        channel,
        callId,
        personId: person.id,
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
    await logRecord(row.id, "call", "write", ["identity", "symptoms"], "Polku agent", tx);
    if (fastTrack) {
      callbackDueAt = await startClock(tx, row.id, "callback", now);
      await tx.insert(audit).values({
        caseId: row.id,
        action: "OpenFastTrackCase",
        actor: "system",
        data: { criterionId: evaluation.matches[0].criterion.id },
      });
    }
    await tx.update(calls).set({ status: "screened", caseId: row.id, outcome: evaluation.outcome }).where(eq(calls.id, callId));
    return row.id;
  });
  await logAccess(callId, "record_intake", "allowed", OUTCOME_LOG[evaluation.outcome]);

  publishChange();
  return {
    caseId,
    outcome: evaluation.outcome satisfies Outcome,
    sayThis: sayThis(evaluation, lung, (callbackDueAt as Date | null) ?? undefined),
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

export type ClockView = {
  stepId: string;
  startedAt: string;
  dueAt: string;
  stoppedAt: string | null;
  offeredAt: string | null;
  offeredSlots: { at: string; unit: string }[] | null;
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
        offeredAt: k.offeredAt?.toISOString() ?? null,
        offeredSlots: k.offeredSlots,
        scheduledAt: k.scheduledAt?.toISOString() ?? null,
        unit: k.unit,
      })),
  }));
}
