import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../db";
import { accessLog, audit, calls, cases, clocks } from "../db/schema";
import { shortDayTime, spokenDayTime, STAFF_ONLY_STEPS, STEP_LABEL, STEP_SPOKEN } from "../ontology/labels";
import { lung } from "../pathways/lung";
import { ontologyPath, resourceCalendar, resourcesFor } from "../sim/capacity";
import { publishChange } from "./bus";
import { type CaseView, toCaseViews } from "./cases";
import { ActionError } from "./errors";
import { logAccess, refuse, requireIdentified } from "./identity";
import { logRecord } from "./record";

/**
 * The nurse's scheduling: which patient to book first, the calendar of the
 * resource that can do their next step, and the times proposed to them.
 * Ranking and proposals are rules over the ontology, never the model.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const PROPOSE = 3;
const step = (id: string) => lung.steps.find((s) => s.id === id)!;

export type SessionState = "past" | "taken" | "free" | "offered" | "booked";
export type CalendarView = {
  stepId: string;
  /** When the step's time limit runs out. Projected from now if the case is not confirmed yet. */
  dueAt: string;
  maxDays: number;
  source: { name: string; url: string };
  path: ReturnType<typeof ontologyPath> | null;
  days: { date: string; sessions: { at: string; state: SessionState }[] }[];
  /** Free sessions the rules propose: the earliest before the time limit, else the earliest at all. */
  suggested: string[];
};

/** The step a case needs booked next, and its time limit. Null if nothing is the nurse's to book. */
function nextBooking(c: CaseView, now: Date) {
  if (c.status === "pending_review") {
    const s = lung.steps[1];
    return { stepId: s.id, dueAt: new Date(now.getTime() + s.maxDays * DAY_MS), clock: null };
  }
  const k = c.clocks.find((x) => !x.stoppedAt);
  if (c.status !== "active" || !k || k.scheduledAt || STAFF_ONLY_STEPS.includes(k.stepId)) return null;
  return { stepId: k.stepId, dueAt: new Date(k.dueAt), clock: k };
}

/** Real bookings and held offers on every resource, keyed by facility and time. */
async function liveBookings() {
  const rows = await db.select().from(clocks).where(isNull(clocks.stoppedAt));
  const out = new Map<string, { caseId: string; state: "booked" | "offered" }>();
  for (const k of rows) {
    if (k.scheduledAt && k.unit) out.set(`${k.unit}@${k.scheduledAt.toISOString()}`, { caseId: k.caseId, state: "booked" });
    for (const s of k.offeredSlots ?? []) out.set(`${s.unit}@${s.at}`, { caseId: k.caseId, state: "offered" });
  }
  return out;
}

function calendar(c: CaseView, stepId: string, dueAt: Date, booked: Awaited<ReturnType<typeof liveBookings>>, now: Date): CalendarView {
  const s = step(stepId);
  const src = lung.sources.find((x) => x.id === s.sourceId)!;
  const [r] = resourcesFor(c.county, stepId);
  const days = r
    ? resourceCalendar(r, now).map((d) => ({
        date: d.date,
        sessions: d.sessions.map((x) => {
          const live = booked.get(`${ontologyPath(r).facility}@${x.at}`);
          const state: SessionState =
            live?.caseId === c.id
              ? live.state
              : new Date(x.at) <= now
                ? "past"
                : live || x.taken
                  ? "taken"
                  : "free";
          return { at: x.at, state };
        }),
      }))
    : [];
  const free = days.flatMap((d) => d.sessions).filter((x) => x.state === "free");
  const onTime = free.filter((x) => new Date(x.at) <= dueAt);
  return {
    stepId,
    dueAt: dueAt.toISOString(),
    maxDays: s.maxDays,
    source: { name: src.spokenName.replace(/^the /, ""), url: src.url },
    path: r ? ontologyPath(r) : null,
    days,
    suggested: (onTime.length ? onTime : free).slice(0, PROPOSE).map((x) => x.at),
  };
}

export type Priority = "risk" | "high" | "routine";
export type WorkItem = {
  case: CaseView;
  priority: Priority;
  reason: string;
  calendar: CalendarView;
};

const PRIORITY_ORDER: Record<Priority, number> = { risk: 0, high: 1, routine: 2 };

/**
 * Patients whose next step the nurse has to book, most urgent first:
 * 1. at risk: no free time before the step's limit, 2. a well-founded
 * suspicion (the strongest criterion level), 3. the rest. Then by time limit.
 */
export async function worklist(now = new Date()): Promise<WorkItem[]> {
  const open = await db
    .select()
    .from(cases)
    .where(and(eq(cases.outcome, "fast_track"), inArray(cases.status, ["pending_review", "active"])));
  const views = await toCaseViews(open);
  const booked = await liveBookings();
  const items: WorkItem[] = [];
  for (const c of views) {
    const next = nextBooking(c, now);
    if (!next) continue;
    const cal = calendar(c, next.stepId, next.dueAt, booked, now);
    const firstFree = cal.days.flatMap((d) => d.sessions).find((x) => x.state === "free");
    const levels = c.matches.map((m) => lung.criteria.find((x) => x.id === m.criterionId)?.level);
    const label = STEP_LABEL[next.stepId];
    let priority: Priority = "routine";
    let reason = c.matches.length ? lung.criteria.find((x) => x.id === c.matches[0].criterionId)!.gloss : "";
    if (!firstFree || new Date(firstFree.at) > next.dueAt) {
      priority = "risk";
      reason = `No free ${label} time before ${shortDayTime(next.dueAt).slice(0, -6)}`;
    } else if (levels.includes("well_founded")) priority = "high";
    items.push({ case: c, priority, reason, calendar: cal });
  }
  return items.sort(
    (a, b) =>
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.calendar.dueAt.localeCompare(b.calendar.dueAt),
  );
}

/** The calendar for one case, for after it has been booked and left the worklist. */
export async function calendarFor(caseId: string, now = new Date()) {
  const [row] = await db.select().from(cases).where(eq(cases.id, caseId));
  if (!row) throw new ActionError("Case not found", 404);
  const [c] = await toCaseViews([row]);
  const k = c.clocks.find((x) => !x.stoppedAt);
  const next = nextBooking(c, now) ?? (k ? { stepId: k.stepId, dueAt: new Date(k.dueAt) } : null);
  if (!next) return null;
  return calendar(c, next.stepId, next.dueAt, await liveBookings(), now);
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Checks the times are free and returns the calendar they are on. */
async function checkFree(caseId: string, times: string[], now: Date) {
  const cal = await calendarFor(caseId, now);
  if (!cal?.path) throw new ActionError("Nothing to book for this case", 409);
  const free = new Set(cal.days.flatMap((d) => d.sessions).filter((x) => x.state === "free" || x.state === "offered").map((x) => x.at));
  if (!times.every((t) => free.has(t))) throw new ActionError("A proposed time is no longer free", 409);
  return { cal, unit: cal.path.facility };
}

/**
 * The nurse's decision on a new case stops the callback step and starts the
 * next step's clock. Returns the running clock to book on.
 */
async function takeCase(tx: Tx, caseId: string, stepId: string, now: Date) {
  const [c] = await tx.select().from(cases).where(eq(cases.id, caseId)).for("update");
  if (!c) throw new ActionError("Case not found", 404);
  const [open] = await tx
    .select()
    .from(clocks)
    .where(and(eq(clocks.caseId, caseId), isNull(clocks.stoppedAt)));
  if (!open) throw new ActionError("Case has no running step", 409);
  if (c.status !== "pending_review") {
    if (open.scheduledAt) throw new ActionError("Already booked", 409);
    return open.id;
  }
  await tx.update(clocks).set({ stoppedAt: now }).where(eq(clocks.id, open.id));
  const s = step(stepId);
  const [k] = await tx
    .insert(clocks)
    .values({ caseId, stepId: s.id, startedAt: now, dueAt: new Date(now.getTime() + s.maxDays * DAY_MS) })
    .returning({ id: clocks.id });
  await tx.update(cases).set({ status: "active" }).where(eq(cases.id, caseId));
  await tx.insert(audit).values({ caseId, action: "ConfirmCase", actor: "nurse", data: { stoppedStep: open.stepId, startedStep: s.id } });
  return k.id;
}

/**
 * ProposeTimes: the nurse accepts the proposed times. Polku then calls the
 * patient, identifies them and lets them pick one. Returns the id of that call.
 */
export async function proposeTimes(caseId: string, times: string[], now = new Date()) {
  if (times.length < 1 || times.length > 3) throw new ActionError("Propose one to three times", 422);
  const { cal, unit } = await checkFree(caseId, times, now);
  const slots = [...times].sort().map((at) => ({ at, unit }));

  const callId = await db.transaction(async (tx) => {
    const clockId = await takeCase(tx, caseId, cal.stepId, now);
    await tx.update(clocks).set({ offeredAt: now, offeredSlots: slots }).where(eq(clocks.id, clockId));
    await tx.insert(audit).values({ caseId, action: "ProposeTimes", actor: "nurse", data: { stepId: cal.stepId, slots } });
    await logRecord(caseId, "nurse", "write", ["booking"], "Nurse", tx);
    const [call] = await tx.insert(calls).values({ status: "ringing", purpose: "callback", caseId }).returning({ id: calls.id });
    return call.id;
  });
  publishChange();
  return callId;
}

/** BookByNurse: the nurse called the patient themselves and books the time they agreed. */
export async function bookByNurse(caseId: string, at: string, now = new Date()) {
  const { cal, unit } = await checkFree(caseId, [at], now);
  await db.transaction(async (tx) => {
    const clockId = await takeCase(tx, caseId, cal.stepId, now);
    await tx.update(clocks).set({ scheduledAt: new Date(at), unit, offeredSlots: null }).where(eq(clocks.id, clockId));
    await tx.insert(audit).values({ caseId, action: "NurseBooked", actor: "nurse", data: { stepId: cal.stepId, at, unit } });
    await logRecord(caseId, "nurse", "write", ["booking"], "Nurse", tx);
  });
  publishChange();
}

/**
 * BookTime, the agent's tool on a call: the identified patient picks one of
 * the proposed times (1..n), or none (0). Only their own case, only the
 * times the nurse proposed.
 */
export async function bookTime(callId: string, option: number) {
  const tool = "book_time";
  const { call, person } = await requireIdentified(callId, tool);
  const [c] = call.caseId ? await db.select().from(cases).where(eq(cases.id, call.caseId)) : [];
  const [k] = c
    ? await db
        .select()
        .from(clocks)
        .where(and(eq(clocks.caseId, c.id), isNull(clocks.stoppedAt)))
    : [];
  // Already booked on this call (the caller talked over the answer and the agent asked again): same answer.
  if (c && c.personId === person.id && k?.scheduledAt && k.unit && !k.offeredSlots?.length) {
    const [earlier] = await db
      .select({ id: accessLog.id })
      .from(accessLog)
      .where(and(eq(accessLog.callId, callId), eq(accessLog.tool, tool), eq(accessLog.verdict, "allowed")));
    if (earlier) return booked(k.stepId, k.scheduledAt, k.unit);
  }
  if (!c || c.personId !== person.id || !k?.offeredSlots?.length) {
    throw await refuse(callId, tool, "No times proposed to this caller", "There are no times to book for this caller. Call get_case to check their case.", 409);
  }
  const slots = k.offeredSlots;
  if (!Number.isInteger(option) || option < 0 || option > slots.length) {
    throw await refuse(callId, tool, `No option ${option}`, `Option must be a number from 0 to ${slots.length}.`, 422);
  }

  if (option === 0) {
    await db.update(clocks).set({ offeredSlots: null }).where(eq(clocks.id, k.id));
    await db.insert(audit).values({ caseId: c.id, action: "DeclineTimes", actor: "patient", data: { callId } });
    await logAccess(callId, tool, "allowed", "None of the times suited. Back to the nurse.");
    publishChange();
    const summary = "No problem. A nurse will call you to find another time.";
    return { summary, sayThis: `Tell them: "${summary}" Then say goodbye and end the call.` };
  }

  const slot = slots[option - 1];
  const at = new Date(slot.at);
  await db.update(clocks).set({ scheduledAt: at, unit: slot.unit, offeredSlots: null }).where(eq(clocks.id, k.id));
  await db.insert(audit).values({ caseId: c.id, action: "ConfirmSlot", actor: "patient", data: { callId, ...slot } });
  await logRecord(c.id, "call", "write", ["booking"], "Polku agent");
  await logAccess(callId, tool, "allowed", `Booked ${STEP_LABEL[k.stepId]} ${shortDayTime(at)}`);
  publishChange();
  return booked(k.stepId, at, slot.unit);
}

function booked(stepId: string, at: Date, unit: string) {
  const summary = `You are booked for ${STEP_SPOKEN[stepId] ?? "your appointment"} on ${spokenDayTime(at)} at ${unit}.`;
  return { summary, sayThis: `Tell them: "${summary}" Then say goodbye and end the call.` };
}
