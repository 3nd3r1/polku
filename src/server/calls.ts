import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { accessLog, calls, cases, type TranscriptLine } from "../db/schema";
import type { Outcome } from "../ontology/engine";
import type { Person } from "../sim/people";
import { publishChange } from "./bus";
import { type CaseView, toCaseViews } from "./cases";
import { ActionError } from "./errors";

export async function startCall() {
  const [row] = await db.insert(calls).values({ status: "ringing" }).returning({ id: calls.id });
  publishChange();
  return row.id;
}

/** Hang-up. A call that never got past identification stays unidentified. */
export async function endCall(callId: string) {
  const updated = await db.update(calls).set({ status: "ended" }).where(eq(calls.id, callId)).returning({ id: calls.id });
  if (updated.length === 0) throw new ActionError("Call not found", 404);
  publishChange();
}

/** One line of the call transcript. Live calls and simulations both write here. */
export async function appendTranscript(callId: string, role: TranscriptLine["role"], text: string) {
  const line: TranscriptLine = { role, text, at: new Date().toISOString() };
  const updated = await db
    .update(calls)
    .set({ transcript: sql`${calls.transcript} || ${JSON.stringify([line])}::jsonb` })
    .where(eq(calls.id, callId))
    .returning({ id: calls.id });
  if (updated.length === 0) throw new ActionError("Call not found", 404);
  publishChange();
}

export type AccessEntry = { at: string; tool: string; verdict: "allowed" | "refused" | "ask"; detail: string };

export type CallView = {
  id: string;
  startedAt: string;
  status: (typeof calls.$inferSelect)["status"];
  person: Person | null;
  verifiedAt: string | null;
  outcome: Outcome | null;
  transcript: TranscriptLine[];
  access: AccessEntry[];
  case: CaseView | null;
};

export async function listCalls(limit = 30): Promise<CallView[]> {
  const rows = await db.select().from(calls).orderBy(desc(calls.startedAt)).limit(limit);
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const caseIds = rows.flatMap((r) => (r.caseId ? [r.caseId] : []));
  const [caseViews, log] = await Promise.all([
    caseIds.length ? toCaseViews(await db.select().from(cases).where(inArray(cases.id, caseIds))) : [],
    db.select().from(accessLog).where(inArray(accessLog.callId, ids)).orderBy(asc(accessLog.id)),
  ]);
  return rows.map((r) => ({
    id: r.id,
    startedAt: r.startedAt.toISOString(),
    status: r.status,
    person: r.person,
    verifiedAt: r.verifiedAt?.toISOString() ?? null,
    outcome: r.outcome,
    transcript: r.transcript,
    access: log
      .filter((l) => l.callId === r.id)
      .map((l) => ({ at: l.at.toISOString(), tool: l.tool, verdict: l.verdict ?? (l.allowed ? "allowed" : "refused"), detail: l.detail })),
    case: caseViews.find((c) => c.id === r.caseId) ?? null,
  }));
}
