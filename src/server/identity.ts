import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { accessLog, calls, cases, people, type TOOLS, type VERDICTS } from "../db/schema";
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
type Verdict = (typeof VERDICTS)[number];
type Call = typeof calls.$inferSelect;

export const MAX_FAILED_VERIFICATIONS = 3;
/** Simulated Mobile ID round trip. Tests set it to 0. */
const mobileIdDelayMs = () => Number(process.env.MOBILE_ID_DELAY_MS ?? 1000);

/** One row per tool call, in plain words: it is shown on the Screening screen as is. */
export async function logAccess(callId: string, tool: Tool, verdict: Verdict, detail: string) {
  await db.insert(accessLog).values({ callId, tool, allowed: verdict !== "refused", verdict, detail });
}

export async function refuse(callId: string, tool: Tool, detail: string, message: string, status: ActionError["status"]) {
  await logAccess(callId, tool, "refused", detail);
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
      "Caller not identified. Nothing released.",
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
  if (call.personId && call.person) {
    // The phone drops a tool's answer when the caller talks over it, and the agent asks
    // again. The same code gets the same answer; any other code gets nothing.
    const again = parseHetu(spokenHetu);
    if (again.ok && again.hetu.code === call.person.hetu) return confirmed(call.person);
    throw await refuse(callId, tool, "Already identified", "The caller is already identified. Continue.", 409);
  }
  if (call.status === "verifying") {
    throw await refuse(callId, tool, "Identification already in progress", "Identification is already in progress. Wait for it.", 409);
  }
  if (call.failedVerifications >= MAX_FAILED_VERIFICATIONS) {
    throw await refuse(
      callId,
      tool,
      `Locked after ${MAX_FAILED_VERIFICATIONS} wrong codes`,
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
      "Not a valid identity code",
      "That is not a valid personal identity code. Ask the caller to say it again slowly, character by character.",
    );
  }
  const [person] = await db.select().from(people).where(eq(people.hetu, parsed.hetu.code));
  if (!person) {
    throw await fail(
      `${maskHetu(parsed.hetu.code)} is not in the register`,
      "Identification failed. Ask the caller to check the code and say it again.",
    );
  }

  // A callback is for one person: anyone else who answers gets nothing.
  if (call.purpose === "callback" && call.caseId) {
    const [target] = await db.select({ personId: cases.personId }).from(cases).where(eq(cases.id, call.caseId));
    if (target?.personId !== person.id) {
      throw await fail(
        "Not the person this call is for",
        "This code is not the person this call is for. Share nothing. Ask to speak to the person the call is for.",
      );
    }
  }

  // The screen shows "waiting for Mobile ID" from this status; the log gets one row when it resolves.
  await db.update(calls).set({ status: "verifying" }).where(eq(calls.id, callId));
  publishChange();
  await new Promise((r) => setTimeout(r, mobileIdDelayMs()));

  await db
    .update(calls)
    .set({ status: "verified", personId: person.id, person, verifiedAt: new Date() })
    .where(eq(calls.id, callId));
  await logAccess(callId, tool, "allowed", `${maskHetu(person.hetu)} confirmed by Mobile ID (simulated)`);
  publishChange();

  return confirmed(person);
}

/** Only what the conversation needs. Never the identity code, never the full name. */
function confirmed(person: Person) {
  const firstName = person.name.split(" ")[0];
  return {
    sayThis: `Identity confirmed with Mobile ID. The caller is ${firstName}, ${ageOf(person)} years old, from ${person.county}. Greet them by first name and do not ask their age.`,
  };
}
