# Voice agent (ElevenLabs)

The agent only turns speech into tool calls. It knows nothing about the caller until the server tells it, and the server decides what each tool returns (`src/server/identity.ts`). Matching happens in our engine, and the agent reads back the sentence our API returns.

## Agent as code

The live agent is **Polku Agent** (`agent_9901m7chdrncehma1fymbn0g6wcp`), managed with the ElevenLabs CLI (`@elevenlabs/cli`, on PATH in `nix-shell`). Never edit it in the dashboard: the next push overwrites it.

| Source | Becomes |
|---|---|
| `agent/prompt.md` | System prompt |
| `FIRST_MESSAGE` in `src/server/agent-tools.ts` | First message |
| `AGENT_TOOLS` in `src/server/agent-tools.ts` | The three client tools (also served by `GET /api/intake`) |
| `agent/sync.ts` | `end_call` on, auth off, 5 min max call, 300 calls/day |

To change the agent, edit those and run:

```sh
nix-shell
elevenlabs auth login     # once
npm run agent:push        # sync.ts writes agent_configs/ and tool_configs/, then pushes both
```

`agents.json` and `tools.json` hold the ElevenLabs ids. Put the agent id in `.env.local` as `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`.

Test from the Screening page (**Call the line**), not the ElevenLabs test window: the tools are client tools, so only our page can run them.

The Screening page runs the tools during a browser call. Each one only forwards to the server and returns `sayThis` (or the refusal) to the agent:

| Tool | Endpoint | Before identification |
|---|---|---|
| `verify_identity` | `POST /api/calls/<id>/verify` `{ hetu }` | Register lookup, then simulated Mobile ID. Locked after 3 failures. |
| `get_case` | `POST /api/calls/<id>/case` | Refused (403) |
| `record_intake` | `POST /api/intake?channel=web_call&call=<id>` | Refused (403) |

Every call to every tool is logged, allowed or refused, and shown on the Screening screen.

## Demo identity codes

Synthetic, from `npm run db:seed` (test range 900-999, never issued to real people):

| Caller | Code | Story |
|---|---|---|
| Matti, 71, Keski-Suomi | 040355-9018 | New caller, fast-track match |
| Aino, 34, Pirkanmaa | 180692-9029 | New caller, no match |
| Seppo, 80, Pohjois-Savo | 220946-903E | Red flag, call 112 |
| Liisa, 75, Lappi | 270151-904J | Open case, CT booked |

## Phone (later)

For a phone number, use the same tools as **webhook** tools against the same endpoints, with the call id from our `POST /api/calls`.
