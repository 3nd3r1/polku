import { eq } from "drizzle-orm";
import { db } from "../db";
import { calls } from "../db/schema";
import { CALLBACK_FIRST_MESSAGE } from "./agent-tools";
import { appendTranscript, endCall } from "./calls";
import { publishChange } from "./bus";

/**
 * The real phone line: a Twilio number on ElevenLabs, answered by the
 * "Polku Phone" agent, whose tools are webhooks to /api/phone/[tool].
 * The server keys each phone call by its ElevenLabs conversation id and
 * copies the transcript in by polling, since no browser is on the call.
 */

const API = "https://api.elevenlabs.io/v1/convai";
const apiKey = () => process.env.ELEVENLABS_API_KEY ?? process.env.ELEVEN_LABS_API_KEY;

/** Set when the phone line is set up (`npm run agent:phone`) and this deployment may ring a phone. */
export function phoneConfig() {
  const key = apiKey();
  const agentId = process.env.PHONE_AGENT_ID;
  const numberId = process.env.PHONE_NUMBER_ID;
  const to = process.env.DEMO_CALLBACK_NUMBER;
  return key && agentId && numberId && to ? { key, agentId, numberId, to } : null;
}

/** The call a webhook belongs to. An inbound phone call is created on its first tool call. */
export async function callForConversation(conversationId: string) {
  const [found] = await db.select({ id: calls.id }).from(calls).where(eq(calls.conversationId, conversationId));
  if (found) return found.id;
  const [row] = await db
    .insert(calls)
    .values({ status: "ringing", purpose: "inbound", conversationId })
    .onConflictDoNothing()
    .returning({ id: calls.id });
  if (!row) return callForConversation(conversationId);
  publishChange();
  watch(conversationId, row.id);
  return row.id;
}

/**
 * Polku rings the patient back with the times the nurse proposed. In the demo
 * every callback goes to DEMO_CALLBACK_NUMBER: the register is synthetic.
 */
export async function ringBack(callId: string) {
  return ring(callId, CALLBACK_FIRST_MESSAGE);
}

/**
 * "Ring my phone" on /demo: Polku calls DEMO_CALLBACK_NUMBER and the call runs
 * exactly like an inbound one (identify, symptoms). Saves calling the US
 * number from Finland. Returns the call id, or null without a phone line.
 */
export async function ringInbound() {
  if (!phoneConfig()) return null;
  const [row] = await db.insert(calls).values({ status: "ringing", purpose: "inbound" }).returning({ id: calls.id });
  publishChange();
  if (await ring(row.id)) return row.id;
  await endCall(row.id);
  return null;
}

async function ring(callId: string, firstMessage?: string) {
  const cfg = phoneConfig();
  if (!cfg) return false;
  const res = await fetch(`${API}/twilio/outbound-call`, {
    method: "POST",
    headers: { "xi-api-key": cfg.key, "Content-Type": "application/json" },
    body: JSON.stringify({
      agent_id: cfg.agentId,
      agent_phone_number_id: cfg.numberId,
      to_number: cfg.to,
      ...(firstMessage && {
        conversation_initiation_client_data: {
          conversation_config_override: { agent: { first_message: firstMessage } },
        },
      }),
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { success?: boolean; conversation_id?: string; message?: string };
  if (!res.ok || !body.conversation_id) {
    console.error("[phone] outbound call failed", res.status, body.message ?? "");
    return false;
  }
  await db.update(calls).set({ conversationId: body.conversation_id }).where(eq(calls.id, callId));
  watch(body.conversation_id, callId);
  return true;
}

const watching = new Set<string>();

/** Copies the conversation's transcript into the call every 2 s until ElevenLabs says it ended. */
function watch(conversationId: string, callId: string) {
  if (watching.has(conversationId)) return;
  watching.add(conversationId);
  let copied = 0;
  const started = Date.now();
  const tick = async () => {
    try {
      const res = await fetch(`${API}/conversations/${conversationId}`, { headers: { "xi-api-key": apiKey() ?? "" } });
      if (res.ok) {
        const c = (await res.json()) as { status: string; transcript?: { role: string; message: string | null }[] };
        const lines = (c.transcript ?? []).filter((l) => l.message?.trim());
        for (const l of lines.slice(copied)) {
          await appendTranscript(callId, l.role === "user" ? "caller" : "agent", l.message!.slice(0, 2000));
        }
        copied = lines.length;
        if (c.status === "done" || c.status === "failed") {
          await endCall(callId).catch(() => {});
          watching.delete(conversationId);
          return;
        }
      }
    } catch (e) {
      console.error("[phone] watch", e);
    }
    if (Date.now() - started > 15 * 60_000) {
      watching.delete(conversationId);
      return;
    }
    setTimeout(tick, 2000);
  };
  setTimeout(tick, 1000);
}
