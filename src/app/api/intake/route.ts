import { z } from "zod";
import { CHANNELS } from "@/db/schema";
import { Intake } from "@/ontology/schema";
import { ActionError, submitIntake } from "@/server/cases";

/** Tool definitions for the ElevenLabs agent, generated from the same zod schema we validate with. */
export function GET() {
  return Response.json([
    {
      name: "verify_identity",
      description:
        "Strongly identify the caller with Mobile ID. Call this first, before asking about symptoms. Returns who the caller is.",
      parameters: { type: "object", properties: {} },
    },
    {
      name: "record_intake",
      description:
        "Record the caller's symptoms and smoking status once you have them. Returns the exact sentence to say back to the caller.",
      parameters: z.toJSONSchema(Intake),
    },
  ]);
}

/**
 * The record_intake tool. Called by the browser (ElevenLabs client tool) or by
 * the agent as a webhook (phone). Body is the tool payload, channel is a query param.
 */
export async function POST(request: Request) {
  const params = new URL(request.url).searchParams;
  const channel = z.enum(CHANNELS).catch("phone").parse(params.get("channel"));
  const callId = z.uuid().optional().catch(undefined).parse(params.get("call") ?? undefined);
  const parsed = Intake.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
  }
  try {
    return Response.json(await submitIntake(parsed.data, channel, callId));
  } catch (e) {
    if (e instanceof ActionError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
