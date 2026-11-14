import { timingSafeEqual } from "node:crypto";
import { liveTurn, upstream } from "@/server/llm-proxy";

/**
 * The phone agent's LLM, as an OpenAI-compatible endpoint (ElevenLabs "custom
 * LLM"). Every turn passes through here on its way to the model on Verda, so
 * the server writes the transcript live: the caller's words as soon as they
 * are transcribed, the agent's as soon as they are generated. Nothing here
 * changes what the model says.
 */
export async function POST(request: Request) {
  const secret = process.env.PHONE_WEBHOOK_SECRET;
  const given = Buffer.from((request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, ""));
  if (!secret || given.length !== secret.length || !timingSafeEqual(given, Buffer.from(secret))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || !Array.isArray(body.messages)) return Response.json({ error: "Expected a chat completion request" }, { status: 400 });

  const turn = await liveTurn(request.headers.get("x-polku-conversation"), body.messages);
  const up = upstream();
  const { elevenlabs_extra_body: _, ...rest } = body;
  const res = await fetch(up.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${up.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ...rest, model: up.model }),
  });
  if (!res.ok || !res.body) {
    console.error("[llm] upstream", res.status);
    return new Response(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
  }
  if (body.stream !== true) return new Response(res.body, { headers: { "Content-Type": "application/json" } });

  // Pass every chunk straight through; collect the agent's words on the side.
  let said = "";
  let buffer = "";
  const decoder = new TextDecoder();
  const tee = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(chunk);
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:") || line.includes("[DONE]")) continue;
        try {
          said += JSON.parse(line.slice(5)).choices?.[0]?.delta?.content ?? "";
        } catch {}
      }
    },
    async flush() {
      await turn.agentSaid(said);
    },
  });
  return new Response(res.body.pipeThrough(tee), {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" },
  });
}
