import { z } from "zod";
import { CHANNELS } from "@/db/schema";
import { Intake } from "@/ontology/schema";
import { submitIntake } from "@/server/cases";

/** Tool definition for the ElevenLabs agent, generated from the same zod schema we validate with. */
export function GET() {
  return Response.json({
    name: "record_intake",
    description:
      "Record the caller's symptoms, age and smoking status once you have them. Returns the exact sentence to say back to the caller.",
    parameters: z.toJSONSchema(Intake),
  });
}

/**
 * The record_intake tool. Called by the browser (ElevenLabs client tool) or by
 * the agent as a webhook (phone). Body is the tool payload, channel is a query param.
 */
export async function POST(request: Request) {
  const channel = z.enum(CHANNELS).catch("phone").parse(new URL(request.url).searchParams.get("channel"));
  const parsed = Intake.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
  }
  return Response.json(await submitIntake(parsed.data, channel));
}
