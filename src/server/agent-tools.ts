import { z } from "zod";
import { Intake } from "../ontology/schema";

/**
 * The voice agent's tools, defined once. Served by GET /api/intake and pushed
 * to ElevenLabs by `npm run agent:push`, so the agent can never drift from
 * the validator. The agent never sends age: the server takes it from the
 * verified identity.
 */

export const FIRST_MESSAGE =
  "Hi, this is Polku, the lung symptom line. I'm an AI assistant. To identify you, please tell me your personal identity code.";

type JsonSchema = Record<string, unknown>;
export type AgentTool = { name: string; description: string; parameters: JsonSchema };

export const AGENT_TOOLS: AgentTool[] = [
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
      "Record the caller's symptoms and smoking status once you have them. Returns the exact sentence to say back to the caller, or the questions still to ask.",
    parameters: z.toJSONSchema(Intake.omit({ age: true })) as JsonSchema,
  },
];

const KEEP = new Set(["type", "description", "properties", "required", "items", "enum"]);

/** JSON Schema → the subset ElevenLabs tool parameters accept. Drops bounds; the server validates those. */
export function toElevenLabs(schema: JsonSchema): JsonSchema {
  const out: JsonSchema = {};
  for (const [k, v] of Object.entries(schema)) {
    if (!KEEP.has(k)) continue;
    if (k === "properties") {
      out.properties = Object.fromEntries(
        Object.entries(v as Record<string, JsonSchema>).map(([name, p]) => [name, toElevenLabs(p)]),
      );
    } else if (k === "items") out.items = toElevenLabs(v as JsonSchema);
    else out[k] = v;
  }
  return out;
}
