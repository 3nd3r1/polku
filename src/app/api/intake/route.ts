import { z } from "zod";
import { CHANNELS } from "@/db/schema";
import { Intake } from "@/ontology/schema";
import { AGENT_TOOLS } from "@/server/agent-tools";
import { ActionError, submitIntake } from "@/server/cases";

/** Tool definitions for the voice agent. Same source as `npm run agent:push`. */
export function GET() {
  return Response.json(AGENT_TOOLS);
}

/**
 * The record_intake tool. Called by the browser (ElevenLabs client tool) or by
 * the agent as a webhook (phone). Body is the tool payload, channel is a query param.
 */
export async function POST(request: Request) {
  const params = new URL(request.url).searchParams;
  const channel = z.enum(CHANNELS).catch("phone").parse(params.get("channel"));
  const callId = z.uuid().safeParse(params.get("call"));
  if (!callId.success) return Response.json({ error: "Missing ?call=<call id>" }, { status: 400 });
  const parsed = Intake.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
  }
  try {
    return Response.json(await submitIntake(parsed.data, channel, callId.data));
  } catch (e) {
    if (e instanceof ActionError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
