# Voice agent (ElevenLabs)

The agent only turns speech into tool calls. It knows nothing about the caller until the server tells it, and the server decides what each tool returns (`src/server/identity.ts`). Matching happens in our engine, and the agent reads back the sentence our API returns.

## Setup (ElevenLabs dashboard)

1. Create an agent. Paste `prompt.md` as the system prompt. First message: "Hi, this is Polku, the lung symptom line. I'm an AI assistant. To identify you, please tell me your personal identity code."
2. Add three **client tools**, all with "Wait for response" on. Copy names, descriptions and parameters from `GET /api/intake`, which is generated from the same schemas the server validates with:
   - `verify_identity` with one string parameter, `hetu`
   - `get_case` with no parameters
   - `record_intake`
3. Turn on the **End call** system tool. The prompt tells the agent to use it after saying goodbye, and the hang-up marks the call as ended on Screening.
4. Make the agent public (no auth) and set limits: max call duration about 3 minutes, plus a daily call cap.
5. Put the agent id in `.env.local` as `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`.

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
