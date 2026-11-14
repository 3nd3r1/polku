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
config.tags = ["polku"];
config.workflow = workflow();
config.conversation_config.conversation.max_duration_seconds = 300;
config.platform_settings.call_limits.daily_limit = 300;
config.platform_settings.auth.enable_auth = false; // the Screening page connects with the agent id only
// The Nurse page starts callbacks with CALLBACK_FIRST_MESSAGE instead of the inbound greeting.
config.platform_settings.overrides.conversation_config_override.agent.first_message = true;
writeJson(agent.config, config);

console.log(`Synced ${AGENT_TOOLS.length} tools and ${agent.config}`);

/**
 * The call as a graph, for the ElevenLabs workflow view. Each step adds a
 * focused instruction; all tools stay available everywhere so a missed
 * transition never strands the agent. What each tool returns is decided by
 * the server (src/server/identity.ts), not by this graph.
 */
function workflow() {
  const agentNode = (label: string, prompt: string, y: number, edges: string[], forcedTool: string | null = null) => ({
    additional_knowledge_base: [],
    additional_prompt: prompt,
    additional_tool_ids: [],
    allow_interruptions_on_entry: false,
    conversation_config: {},
    edge_order: edges,
    entry_behavior: "auto",
    forced_tool_name: forcedTool,
    label,
    parent_frame_id: null,
    parent_subgraph_id: null,
    position: { x: 0, y },
    type: "override_agent",
  });
  const edge = (source: string, target: string, condition: string | null) => ({
    backward_condition: null,
    forward_condition: condition
      ? { condition, exit_slot: { type: "any" }, label: null, type: "llm" }
      : { exit_slot: { type: "any" }, label: null, type: "unconditional" },
    reroutes: [],
    source,
    target,
  });
  const end = (x: number, y: number) => ({
    edge_order: [],
    exit_slot: null,
    outcome: "success",
    parent_frame_id: null,
    parent_subgraph_id: null,
    position: { x, y },
    return_when_nested: true,
    type: "end",
  });
  return {
    nodes: {
      start_node: { edge_order: ["start_to_identify"], parent_frame_id: null, parent_subgraph_id: null, position: { x: 0, y: 0 }, type: "start" },
      identify: agentNode(
        "1 Identify caller",
        "Step 1: ask for the personal identity code and call verify_identity with it. Do nothing else until it succeeds. If the caller describes a red-flag symptom, tell them to call 112 now.",
        200,
        ["identify_to_case", "identify_to_end"],
      ),
      check_case: agentNode(
        "2 Check case",
        "Step 2: the caller is identified. Greet them by first name and call get_case. If they have an open case, tell them the returned sentence word for word and ask whether anything is new or worse.",
        420,
        ["case_to_book", "case_to_symptoms", "case_to_end"],
        "get_case",
      ),
      book: agentNode(
        "3 Book a time",
        "get_case read out numbered times. Ask which one suits the caller, then call book_time with that number, or 0 if none suits. Say the returned sentence word for word and end the call.",
        640,
        ["book_to_end"],
      ),
      symptoms: agentNode(
        "3 Record symptoms",
        "Step 3: ask about symptoms, how long, any known cause, and smoking. Call record_intake, ask what it says is missing, and say the returned sentence word for word.",
        860,
        ["symptoms_to_end"],
      ),
      end_node: end(0, 1080),
      end_early: end(360, 860),
    },
    edges: {
      start_to_identify: edge("start_node", "identify", null),
      identify_to_case: edge("identify", "check_case", "verify_identity confirmed the caller's identity"),
      identify_to_end: edge("identify", "end_early", "The caller was told to call 112, or identification is locked after three failed attempts"),
      case_to_book: edge("check_case", "book", "get_case returned numbered times for the caller to choose from"),
      book_to_end: edge("book", "end_node", "The sentence returned by book_time has been said to the caller"),
      case_to_symptoms: edge("check_case", "symptoms", "The caller has no open case, or reports something new or worse"),
      case_to_end: edge("check_case", "end_early", "The caller heard their case status and has nothing new to report"),
      symptoms_to_end: edge("symptoms", "end_node", "The sentence returned by record_intake has been said to the caller"),
    },
    frames: {},
    subgraphs: config.workflow?.subgraphs ?? {},
    prevent_subagent_loops: config.workflow?.prevent_subagent_loops ?? true,
    version: config.workflow?.version,
  };
}
