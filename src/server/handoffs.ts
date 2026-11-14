import { and, desc, eq, inArray, isNotNull, isNull, ne } from "drizzle-orm";
import { db } from "../db";
import { calls, cases, recordAccess } from "../db/schema";
import { type Holder, HOLDERS, holderOf, RECORD_PARTS, type RecordPart } from "../ontology/record";
import { publishChange } from "./bus";
import { toCaseViews } from "./cases";
import { ActionError } from "./errors";
import { logRecord } from "./record";

export type HandoffCell = {
  holder: Holder;
  state: "done" | "now" | "later";
  /** The step shown in this cell. Specialist covers several. */
  stepId: string | null;
  dueAt: string | null;
  stoppedAt: string | null;
  scheduledAt: string | null;
  /** Times offered to the patient, waiting for their answer. */
  offered: boolean;
  /** Done cells: every step of this holder finished within its limit. */
  kept: boolean | null;
  /** Parts of the record this holder has opened or written, in record order. */
  opened: RecordPart[];
  accesses: number;
};

export type HandoffLine = {
  key: string;
  caseId: string | null;
  name: string;
  county: string;
  startedAt: string;
  holder: Holder | null;
  cells: HandoffCell[];
  /** Every open and write of this record, oldest first. */
  log: { at: string; holder: Holder; actor: string; mode: "read" | "write"; parts: RecordPart[] }[];
};

const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : null);

/** One line per patient: who has them now, the deadline for that handoff, what each step has opened. */
export async function listHandoffs(): Promise<HandoffLine[]> {
  const rows = await db
    .select()
    .from(cases)
    .where(and(eq(cases.outcome, "fast_track"), inArray(cases.status, ["pending_review", "active", "completed"])))
    .orderBy(desc(cases.createdAt))
    .limit(40);
  const views = await toCaseViews(rows);
  const access = views.length
    ? await db
        .select()
        .from(recordAccess)
        .where(
          inArray(
            recordAccess.caseId,
            views.map((v) => v.id),
          ),
        )
    : [];

  const lines: HandoffLine[] = views.map((c) => {
    const cells = HOLDERS.map((holder): HandoffCell => {
      const mine = access.filter((a) => a.caseId === c.id && a.holder === holder);
      const opened = RECORD_PARTS.filter((p) => mine.some((a) => a.parts.includes(p)));
      const base = { holder, opened, accesses: mine.length, offered: false };
      if (holder === "call") {
        return { ...base, state: "done", stepId: null, dueAt: null, stoppedAt: c.createdAt, scheduledAt: null, kept: null };
      }
      const clocks = c.clocks.filter((k) => holderOf(k.stepId) === holder);
      const running = clocks.find((k) => !k.stoppedAt);
      const last = running ?? clocks.at(-1);
      if (!last) {
        return { ...base, state: "later", stepId: null, dueAt: null, stoppedAt: null, scheduledAt: null, kept: null };
      }
      return {
        ...base,
        state: running ? "now" : "done",
        stepId: last.stepId,
        dueAt: last.dueAt,
        stoppedAt: last.stoppedAt,
        scheduledAt: last.scheduledAt,
        offered: Boolean(running?.offeredSlots?.length),
        kept: running ? null : clocks.every((k) => k.stoppedAt! <= k.dueAt),
      };
    });
    return {
      key: c.id,
      caseId: c.id,
      name: c.person?.name ?? "Unknown",
      county: c.county ?? "",
      startedAt: c.createdAt,
      holder: cells.find((x) => x.state === "now")?.holder ?? null,
      cells,
      log: access
        .filter((a) => a.caseId === c.id)
        .sort((a, b) => a.at.getTime() - b.at.getTime())
        .map((a) => ({ at: a.at.toISOString(), holder: a.holder, actor: a.actor, mode: a.mode, parts: a.parts })),
    };
  });

  // A caller identified on the line right now, before the packet is handed on.
  const live = await db
    .select()
    .from(calls)
    .where(and(eq(calls.purpose, "inbound"), isNotNull(calls.personId), isNull(calls.caseId), ne(calls.status, "ended")));
  const onCall: HandoffLine[] = live.map((call) => ({
    key: call.id,
    caseId: null,
    name: call.person?.name ?? "Unknown",
    county: call.person?.county ?? "",
    startedAt: iso(call.startedAt)!,
    holder: "call",
    cells: HOLDERS.map((holder) => ({
      holder,
      state: holder === "call" ? "now" : "later",
      stepId: null,
      dueAt: null,
      stoppedAt: null,
      scheduledAt: null,
      offered: false,
      kept: null,
      opened: holder === "call" ? (call.draft ? ["identity", "symptoms"] : ["identity"]) : [],
      accesses: 0,
    })),
    log: [],
  }));

  return [...onCall, ...lines];
}

/** The nurse opens a task: logged as a read of what the nurse needs to decide. */
export async function openTask(caseId: string) {
  const [c] = await db.select({ id: cases.id }).from(cases).where(eq(cases.id, caseId));
  if (!c) throw new ActionError("Case not found", 404);
  await logRecord(caseId, "nurse", "read", ["identity", "contact", "symptoms", "match"], "Nurse");
  publishChange();
}
