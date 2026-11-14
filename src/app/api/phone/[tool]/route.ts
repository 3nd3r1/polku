import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { Intake } from "@/ontology/schema";
import { getCase, identify, submitIntake } from "@/server/cases";
import { ActionError } from "@/server/errors";
import { callForConversation, syncHistory } from "@/server/phone";
import { bookTime } from "@/server/schedule";

/**
 * The phone agent's tools, as ElevenLabs webhooks. Same server functions as
 * the browser's client tools; the call is found by the conversation id
 * ElevenLabs fills in. Only ElevenLabs knows PHONE_WEBHOOK_SECRET.
 */
export async function POST(request: Request, ctx: { params: Promise<{ tool: string }> }) {
  const secret = process.env.PHONE_WEBHOOK_SECRET;
  const given = Buffer.from(request.headers.get("x-polku-phone") ?? "");
  if (!secret || given.length !== secret.length || !timingSafeEqual(given, Buffer.from(secret))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { tool } = await ctx.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const conversationId = z.string().min(1).max(200).safeParse(body?.conversation_id);
  if (!body || !conversationId.success) return Response.json({ error: "Missing conversation_id" }, { status: 400 });
  const { conversation_id: _, conversation_history: history, ...params } = body;

  try {
    const callId = await callForConversation(conversationId.data);
    await syncHistory(callId, history);
    const r = await run(tool, callId, params);
    return Response.json({ result: r.sayThis ?? r.error ?? r });
  } catch (e) {
    // The agent says the error, as with the browser's client tools.
    if (e instanceof ActionError) return Response.json({ result: e.message });
    throw e;
  }
}

async function run(tool: string, callId: string, p: Record<string, unknown>): Promise<{ sayThis?: string; error?: string }> {
  switch (tool) {
    case "verify_identity":
      return identify(callId, String(p.hetu ?? ""));
    case "get_case":
      return getCase(callId);
    case "record_intake": {
      // Webhook bodies carry null for every optional field the LLM left out; the browser's client tools omit them.
      const parsed = Intake.safeParse(dropNulls(p));
      if (!parsed.success) {
        return {
          error: `Not recorded, the arguments were invalid. Fix them and call record_intake again; do not mention this to the caller. ${z.prettifyError(parsed.error)}`,
        };
      }
      return submitIntake(parsed.data, "phone", callId);
    }
    case "book_time":
      return bookTime(callId, Number(p.option ?? 0));
    default:
      return { error: `Unknown tool ${tool}` };
  }
}

/** Removes null object fields, recursively. */
function dropNulls(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(dropNulls);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v).filter(([, x]) => x !== null).map(([k, x]) => [k, dropNulls(x)]));
  }
  return v;
}
