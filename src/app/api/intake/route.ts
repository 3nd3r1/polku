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
        "Strongly identify the caller. Call this first, with the personal identity code (henkilötunnus) the caller says. The server confirms it with Mobile ID. Nothing about the caller is available before this succeeds.",
      parameters: {
        type: "object",
        properties: {
          hetu: {
            type: "string",
            description: "The caller's personal identity code exactly as they said it, format DDMMYY-NNNX, e.g. 131052-308T.",
          },
        },
        required: ["hetu"],
      },
    },
    {
      name: "get_case",
      description:
        "After identification: returns the caller's own open case and the sentence to tell them, or says they have none. Takes no parameters.",
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
