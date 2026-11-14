/**
 * Writes the ElevenLabs CLI configs in agent/ from the repo's single sources:
 * prompt.md, FIRST_MESSAGE and AGENT_TOOLS (src/server/agent-tools.ts).
 * Run via `npm run agent:push`, which then pushes tools and agent.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AGENT_TOOLS, FIRST_MESSAGE, toElevenLabs } from "../src/server/agent-tools";

const dir = join(import.meta.dirname, ".");
const readJson = (f: string) => JSON.parse(readFileSync(join(dir, f), "utf8"));
const writeJson = (f: string, v: unknown) => writeFileSync(join(dir, f), `${JSON.stringify(v, null, 4)}\n`);

// Tools: one client tool per definition. The browser runs them and forwards to our API.
const registered: { config: string; id: string }[] = readJson("tools.json").tools;
const toolIds: string[] = [];
for (const tool of AGENT_TOOLS) {
  const entry = registered.find((t) => t.config === `tool_configs/${tool.name}.json`);
  if (!entry) throw new Error(`No tool '${tool.name}' in tools.json. Run: elevenlabs tools add ${tool.name} --type client`);
  toolIds.push(entry.id);
  writeJson(entry.config, {
    ...readJson(entry.config),
    name: tool.name,
    description: tool.description,
    parameters: toElevenLabs(tool.parameters),
    expects_response: true,
    response_timeout_secs: 30,
  });
}

// Agent: prompt, first message, tools, end_call, limits.
const [agent] = readJson("agents.json").agents as { config: string }[];
const config = readJson(agent.config);
const a = config.conversation_config.agent;
a.first_message = FIRST_MESSAGE;
a.language = "en";
a.prompt.prompt = readFileSync(join(dir, "prompt.md"), "utf8");
a.prompt.tool_ids = toolIds;
delete a.prompt.tools; // system tools live in built_in_tools, ours in tool_ids
a.prompt.built_in_tools.end_call = {
  assignments: [],
  description: "",
  disable_interruptions: false,
  force_pre_tool_speech: false,
  interruption_mode: "allow",
  name: "end_call",
  params: { system_tool_type: "end_call" },
  pre_tool_speech: "auto",
  response_timeout_secs: 20,
  tool_call_sound: null,
  tool_call_sound_behavior: "auto",
  tool_error_handling_mode: "auto",
  type: "system",
};
config.conversation_config.tts.suggested_audio_tags = [];
config.conversation_config.conversation.max_duration_seconds = 300;
config.platform_settings.call_limits.daily_limit = 300;
config.platform_settings.auth.enable_auth = false; // the Screening page connects with the agent id only
writeJson(agent.config, config);

console.log(`Synced ${AGENT_TOOLS.length} tools and ${agent.config}`);
