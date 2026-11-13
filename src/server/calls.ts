import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { calls, cases, type TranscriptLine } from "../db/schema";
import { ageOf, PEOPLE, type Person } from "../sim/people";
import { publishChange } from "./bus";
import { ActionError, type CaseView, toCaseViews } from "./cases";

/** How long the simulated Mobile ID confirmation takes. */
const MOBILE_ID_DELAY_MS = 2500;

export async function startCall() {
  const [row] = await db.insert(calls).values({ status: "ringing" }).returning({ id: calls.id });
  publishChange();
  return row.id;
}

/**
 * Strong identification, SIMULATED: stands in for a Mobile ID (mobiilivarmenne)
 * request. Resolves to a synthetic person. See docs/18-phone-first.md.
 */
export async function verifyIdentity(callId: string, personId?: string) {
  const [call] = await db.select().from(calls).where(eq(calls.id, callId));
  if (!call) throw new ActionError("Call not found", 404);
  if (call.status !== "ringing") throw new ActionError("The caller is already identified. Continue with the symptoms.", 409);

  await db.update(calls).set({ status: "verifying" }).where(eq(calls.id, callId));
  publishChange();
  await new Promise((r) => setTimeout(r, MOBILE_ID_DELAY_MS));

  const person: Person =
    PEOPLE.find((p) => p.id === personId) ?? PEOPLE[Math.floor(Math.random() * PEOPLE.length)];
  await db.update(calls).set({ status: "verified", person, verifiedAt: new Date() }).where(eq(calls.id, callId));
  publishChange();

  const firstName = person.name.split(" ")[0];
  return {
    person,
    sayThis: `Identity verified. The caller is ${firstName}, ${ageOf(person)} years old, from ${person.county}. Greet them by first name. Do not ask their age.`,
  };
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

export type CallView = {
  id: string;
  startedAt: string;
  status: (typeof calls.$inferSelect)["status"];
  person: Person | null;
  verifiedAt: string | null;
  transcript: TranscriptLine[];
  case: CaseView | null;
};

export async function listCalls(limit = 30): Promise<CallView[]> {
  const rows = await db.select().from(calls).orderBy(desc(calls.startedAt)).limit(limit);
  if (rows.length === 0) return [];
  const caseViews = await toCaseViews(
    await db
      .select()
      .from(cases)
      .where(
        inArray(
          cases.callId,
          rows.map((r) => r.id),
        ),
      ),
  );
  return rows.map((r) => ({
    id: r.id,
    startedAt: r.startedAt.toISOString(),
    status: r.status,
    person: r.person,
    verifiedAt: r.verifiedAt?.toISOString() ?? null,
    transcript: r.transcript,
    case: caseViews.find((c) => c.callId === r.id) ?? null,
  }));
}
