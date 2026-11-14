import { and, desc, gt, isNotNull, ne } from "drizzle-orm";
import { db } from "../db";
import { calls } from "../db/schema";
import { setTranscript } from "./calls";
import { callForConversation } from "./phone";

/** Where the phone agent's turns go: Qwen3 on Verda unless overridden. */
export function upstream() {
  return {
    url: process.env.LLM_UPSTREAM_URL ?? "https://containers.datacrunch.io/polku-qwen3/v1/chat/completions",
    key: process.env.LLM_UPSTREAM_KEY ?? process.env.VERDA_INFERENCE_KEY ?? "",
    model: process.env.LLM_UPSTREAM_MODEL ?? "qwen3",
  };
}

type Message = { role: string; content?: unknown };

const text = (content: unknown) =>
  typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content.map((p) => (typeof p?.text === "string" ? p.text : "")).join("")
      : "";

/** The conversation so far as transcript lines: what the caller and the agent said, nothing else. */
function lines(messages: Message[]) {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role === "user" ? ("caller" as const) : ("agent" as const), text: text(m.content).trim() }))
    .filter((l) => l.text);
}

/**
 * Writes the transcript up to the caller's latest words now, and returns a
 * hook that adds the agent's reply once it has streamed. The call is found by
 * the conversation id ElevenLabs sends as a header; without it, the latest
 * live phone call (one call at a time in the demo).
 */
export async function liveTurn(conversationId: string | null, messages: Message[]) {
  const callId = await findCall(conversationId).catch((e) => {
    console.error("[llm] call lookup", e);
    return null;
  });
  const sofar = lines(messages);
  if (callId) await setTranscript(callId, sofar).catch(() => {});
  return {
    async agentSaid(said: string) {
      if (callId && said.trim()) await setTranscript(callId, [...sofar, { role: "agent", text: said.trim() }]).catch(() => {});
    },
  };
}

async function findCall(conversationId: string | null) {
  if (conversationId && conversationId.startsWith("conv_")) return callForConversation(conversationId);
  const [latest] = await db
    .select({ id: calls.id })
    .from(calls)
    .where(and(isNotNull(calls.conversationId), ne(calls.status, "ended"), gt(calls.startedAt, new Date(Date.now() - 15 * 60_000))))
    .orderBy(desc(calls.startedAt))
    .limit(1);
  return latest?.id ?? null;
}

