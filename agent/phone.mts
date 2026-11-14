/**
 * Sets up the real phone line: "Polku Phone", a copy of the web agent whose
 * tools are webhooks to production instead of client tools in a browser, and
 * the Twilio number pointed at it. Run after `npm run agent:push` so the copy
 * has the latest prompt and workflow: `npm run agent:phone`.
 *
 * Needs ELEVEN_LABS_API_KEY (or ELEVENLABS_API_KEY) and PHONE_WEBHOOK_SECRET.
 * Writes the ids it made to agent/phone.json; PHONE_AGENT_ID and
 * PHONE_NUMBER_ID from there go into the app's environment.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AGENT_TOOLS, toElevenLabs } from "../src/server/agent-tools";

const API = "https://api.elevenlabs.io/v1/convai";
const BASE = process.env.PHONE_BASE_URL ?? "https://prod-polku.eros.ender.fi";
const key = process.env.ELEVENLABS_API_KEY ?? process.env.ELEVEN_LABS_API_KEY;
const secret = process.env.PHONE_WEBHOOK_SECRET;
if (!key || !secret) throw new Error("Set ELEVEN_LABS_API_KEY and PHONE_WEBHOOK_SECRET");

const dir = import.meta.dirname;
const file = join(dir, "phone.json");
type Ids = { agentId?: string; phoneNumberId?: string; tools: Record<string, string> };
const ids: Ids = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { tools: {} };
const webAgentId: string = JSON.parse(readFileSync(join(dir, "agents.json"), "utf8")).agents[0].id;

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "xi-api-key": key!, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${text.slice(0, 800)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

const save = () => writeFileSync(file, `${JSON.stringify(ids, null, 2)}\n`);

// Reuse phone tools made earlier (e.g. by a run that failed before saving).
type ToolRow = { id: string; tool_config: { name: string; type: string; api_schema?: { url: string } } };
const listed = await api<{ tools: ToolRow[] }>("GET", "/tools");
for (const t of listed.tools) {
  if (t.tool_config.type === "webhook" && t.tool_config.api_schema?.url.includes("/api/phone/")) ids.tools[t.tool_config.name] ??= t.id;
}

// Tools: one webhook per definition. ElevenLabs fills in the conversation id.
for (const tool of AGENT_TOOLS) {
  const params = toElevenLabs(tool.parameters) as { properties?: Record<string, unknown>; required?: string[] };
  const tool_config = {
    type: "webhook",
    name: tool.name,
    description: tool.description,
    response_timeout_secs: 30,
    api_schema: {
      url: `${BASE}/api/phone/${tool.name}`,
      method: "POST",
      request_headers: { "x-polku-phone": secret },
      request_body_schema: {
        type: "object",
        description: `Arguments for ${tool.name}`,
        properties: {
          ...params.properties,
          conversation_id: { type: "string", dynamic_variable: "system__conversation_id", description: "" },
        },
        required: [...(params.required ?? []), "conversation_id"],
      },
    },
  };
  const existing = ids.tools[tool.name];
  if (existing) await api("PATCH", `/tools/${existing}`, { tool_config });
  else ids.tools[tool.name] = (await api<{ id: string }>("POST", "/tools", { tool_config })).id;
  save();
}

// Agent: the web agent's prompt, voice and workflow, with the webhook tools.
type Agent = { conversation_config: { agent: { prompt: { tool_ids?: string[]; tools?: unknown } } }; platform_settings: Record<string, unknown>; workflow?: unknown };
const web = await api<Agent>("GET", `/agents/${webAgentId}`);
web.conversation_config.agent.prompt.tool_ids = AGENT_TOOLS.map((t) => ids.tools[t.name]);
delete web.conversation_config.agent.prompt.tools; // the GET returns both; create accepts one
const agent = {
  name: "Polku Phone",
  conversation_config: web.conversation_config,
  platform_settings: web.platform_settings,
  workflow: web.workflow,
  tags: ["polku", "phone"],
};
if (ids.agentId) await api("PATCH", `/agents/${ids.agentId}`, agent);
else ids.agentId = (await api<{ agent_id: string }>("POST", "/agents/create", agent)).agent_id;
save();

// The Twilio number answers with the phone agent.
const numbers = await api<{ phone_number_id: string; provider: string }[]>("GET", "/phone-numbers");
const number = numbers.find((n) => n.provider === "twilio");
if (!number) throw new Error("No Twilio number imported in ElevenLabs");
ids.phoneNumberId = number.phone_number_id;
await api("PATCH", `/phone-numbers/${number.phone_number_id}`, { agent_id: ids.agentId });

save();
console.log(`Polku Phone: agent ${ids.agentId}, number ${ids.phoneNumberId}, tools to ${BASE}/api/phone/*`);
