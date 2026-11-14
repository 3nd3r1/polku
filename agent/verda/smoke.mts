/**
 * Replays an ElevenLabs-shaped call against the Gemma endpoint: real prompt, real tools,
 * streaming, agent speaks first. Usage: tsx agent/verda/smoke.mts <deployment-name>
 * Needs VERDA_INFERENCE_KEY in .env.local.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AGENT_TOOLS, FIRST_MESSAGE, toElevenLabs } from "../../src/server/agent-tools";

const root = join(import.meta.dirname, "../..");
const key = readFileSync(join(root, ".env.local"), "utf8").match(/^VERDA_INFERENCE_KEY=(.*)$/m)?.[1].replace(/"/g, "").trim();
if (!key) throw new Error("VERDA_INFERENCE_KEY missing from .env.local");
const name = process.argv[2] ?? "polku-gemma-3";
const url = `https://containers.datacrunch.io/${name}/v1/chat/completions`;
const system = readFileSync(join(root, "agent/prompt.md"), "utf8");
const tools = AGENT_TOOLS.map((t) => ({
  type: "function",
  function: { name: t.name, description: t.description, parameters: toElevenLabs(t.parameters) },
}));

type Msg = Record<string, unknown>;
type Call = { id?: string; name: string; args: string };

async function turn(label: string, messages: Msg[]): Promise<{ text: string; calls: Call[] }> {
  const t0 = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemma-3-12b-it",
      messages: [{ role: "system", content: system }, ...messages],
      tools,
      stream: true,
      max_tokens: 400,
      temperature: Number(process.env.TEMP ?? 0),
    }),
  });
  if (!res.ok || !res.body) {
    console.log(`\n[${label}] HTTP ${res.status} ${(await res.text()).slice(0, 400)}`);
    return { text: "", calls: [] };
  }
  let ttft = 0;
  let text = "";
  let buf = "";
  const calls: Call[] = [];
  const dec = new TextDecoder();
  for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
    buf += dec.decode(chunk, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
      const delta = JSON.parse(line.slice(6)).choices?.[0]?.delta;
      if (!delta) continue;
      if (!ttft && (delta.content || delta.tool_calls)) ttft = Date.now() - t0;
      if (delta.content) text += delta.content;
      for (const c of delta.tool_calls ?? []) {
        const call = (calls[c.index] ??= { name: "", args: "" });
        if (c.id) call.id = c.id;
        if (c.function?.name) call.name += c.function.name;
        if (c.function?.arguments) call.args += c.function.arguments;
      }
    }
  }
  console.log(`\n[${label}] first token ${ttft} ms, total ${Date.now() - t0} ms`);
  if (text) console.log(`  says:  ${text}`);
  for (const c of calls) console.log(`  calls: ${c.name}(${c.args})`);
  return { text, calls };
}

const toolTurn = (name: string, args: string, result: unknown): Msg[] => [
  { role: "assistant", content: null, tool_calls: [{ id: `call_${name}`, type: "function", function: { name, arguments: args } }] },
  { role: "tool", tool_call_id: `call_${name}`, content: JSON.stringify(result) },
];

const greeting: Msg = { role: "assistant", content: FIRST_MESSAGE };
const code: Msg = { role: "user", content: "Yes, it's zero four zero three five five dash nine zero one eight." };
const WHO = "Identity confirmed with Mobile ID. The caller is Matti, 71 years old, from Keski-Suomi. Greet them by first name and do not ask their age. Their case is already looked up, so do not call get_case now.";
const NO_CASE = "The caller has no open case. Ask what symptoms they have been having.";
const TIMES =
  'Tell them: "The nurse has reviewed your case, and we have times for the CT scan at Sairaala Nova: option 1, Thursday at 9:20; option 2, Friday at 13:40. Which one suits you?" When they choose, call book_time with the option number. If none suits, call book_time with option 0.';

const r1 = await turn("1 expect verify_identity(040355-9018)", [greeting, code]);
const identified = (theirCase: string): Msg[] => [
  greeting,
  code,
  ...toolTurn("verify_identity", r1.calls[0]?.args || '{"hetu":"040355-9018"}', { sayThis: `${WHO} ${theirCase}` }),
];

await turn("2 expect greeting + asks for symptoms, no invented case", identified(NO_CASE));
const asked: Msg[] = [...identified(NO_CASE), { role: "assistant", content: "Thank you, Matti. What symptoms have you been having?" }];
await turn("3 expect record_intake", [
  ...asked,
  { role: "user", content: "I've had a cough for about two months, and last week I coughed up a few streaks of blood. I smoked for forty years and quit five years ago." },
]);
await turn("4 expect record_intake (emergency), no more questions", [
  ...asked,
  { role: "user", content: "I'm coughing up lots of blood right now, it fills the tissue every time." },
]);
const r5 = await turn("5 callback: expect the two real times read out, nothing else", identified(TIMES));
await turn("6 expect book_time(option=2)", [
  ...identified(TIMES),
  { role: "assistant", content: r5.text || "Hello Matti. We have times for the CT scan: option 1, Thursday at 9:20; option 2, Friday at 13:40. Which one suits you?" },
  { role: "user", content: "The Friday one is better for me." },
]);
