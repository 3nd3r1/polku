import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { accessLog, calls, people, type TOOLS } from "../db/schema";
import { maskHetu, parseHetu } from "../ontology/hetu";
import { ageOf, type Person } from "../sim/people";
import { publishChange } from "./bus";
import { ActionError } from "./errors";

/**
 * The access gate. Every agent tool goes through here, so what the agent can
 * read is decided by the server, not by the prompt:
 * - Before strong identification no tool returns anything about any person.
 * - After it, tools only reach the identified caller. No tool takes a name,
 *   identity code or person id as a lookup key, so there is nothing to inject.
 * - Every decision is written to access_log and shown on the Screening screen.
 */

type Tool = (typeof TOOLS)[number];
type Call = typeof calls.$inferSelect;

export const MAX_FAILED_VERIFICATIONS = 3;
/** Simulated Mobile ID round trip. Tests set it to 0. */
const mobileIdDelayMs = () => Number(process.env.MOBILE_ID_DELAY_MS ?? 2500);

export async function logAccess(callId: string, tool: Tool, allowed: boolean, detail: string) {
  await db.insert(accessLog).values({ callId, tool, allowed, detail });
}

export async function refuse(callId: string, tool: Tool, detail: string, message: string, status: ActionError["status"]) {
  await logAccess(callId, tool, false, detail);
  publishChange();
  return new ActionError(message, status);
}

async function getCall(callId: string): Promise<Call> {
  const [call] = await db.select().from(calls).where(eq(calls.id, callId));
  if (!call) throw new ActionError("Call not found", 404);
  return call;
}

/** The only way a tool reaches personal data: through the call's verified identity. */
export async function requireIdentified(callId: string, tool: Tool): Promise<{ call: Call; person: Person }> {
  const call = await getCall(callId);
  if (!call.personId || !call.person) {
    throw await refuse(
      callId,
      tool,
      "Refused: caller not identified",
      "Refused. The caller is not identified, so no information is available. Ask for their personal identity code and call verify_identity.",
      403,
    );
  }
  return { call, person: call.person };
}

/**
 * Strong identification, SIMULATED. The caller says their identity code; the
 * register lookup is real (synthetic people), the Mobile ID confirmation sent
 * to the number registered for that code is simulated and always approves.
 */
export async function verifyIdentity(callId: string, spokenHetu: string) {
  const call = await getCall(callId);
  const tool = "verify_identity";
  if (call.personId) {
    throw await refuse(callId, tool, "Refused: already identified", "The caller is already identified. Continue.", 409);
  }
  if (call.status === "verifying") {
    throw await refuse(callId, tool, "Refused: identification in progress", "Identification is already in progress. Wait for it.", 409);
  }
  if (call.failedVerifications >= MAX_FAILED_VERIFICATIONS) {
    throw await refuse(
      callId,
      tool,
      `Refused: locked after ${MAX_FAILED_VERIFICATIONS} failed attempts`,
      "Identification is locked for this call. Tell the caller you cannot identify them on this call and that they should contact their health centre. If symptoms are severe, tell them to call 112.",
      429,
    );
  }

  const fail = async (detail: string, message: string) => {
    await db
      .update(calls)
      .set({ failedVerifications: sql`${calls.failedVerifications} + 1` })
      .where(eq(calls.id, callId));
    return refuse(callId, tool, detail, message, 422);
  };

  const parsed = parseHetu(spokenHetu);
  if (!parsed.ok) {
    throw await fail(
      `Refused: invalid identity code (${parsed.reason})`,
      "That is not a valid personal identity code. Ask the caller to say it again slowly, character by character.",
    );
  }
  const [person] = await db.select().from(people).where(eq(people.hetu, parsed.hetu.code));
  if (!person) {
    throw await fail(
      `Refused: ${maskHetu(parsed.hetu.code)} not in the register`,
      "Identification failed. Ask the caller to check the code and say it again.",
    );
  }

  await db.update(calls).set({ status: "verifying" }).where(eq(calls.id, callId));
  await logAccess(callId, tool, true, `Mobile ID request sent to ${person.phone} (simulated)`);
  publishChange();
  await new Promise((r) => setTimeout(r, mobileIdDelayMs()));

  await db
    .update(calls)
    .set({ status: "verified", personId: person.id, person, verifiedAt: new Date() })
    .where(eq(calls.id, callId));
  await logAccess(callId, tool, true, `Identified ${maskHetu(person.hetu)} with Mobile ID (simulated)`);
  publishChange();

  const firstName = person.name.split(" ")[0];
  return {
    // Only what the conversation needs. Never the identity code, never the full name.
    sayThis: `Identity confirmed with Mobile ID. The caller is ${firstName}, ${ageOf(person)} years old, from ${person.county}. Greet them by first name and do not ask their age. Then call get_case.`,
  };
}
