# Voice agent (ElevenLabs)

The agent only turns speech into a typed intake. Matching happens in our engine, and the agent reads back the sentence our API returns.

## Setup (ElevenLabs dashboard)

1. Create an agent. Paste `prompt.md` as the system prompt. First message: "Hi, this is Polku. Tell me what symptoms you've been having."
2. Add a **client tool** named `record_intake`, with "Wait for response" on. Copy its description and parameters from `GET /api/intake` (generated from `src/ontology/schema.ts`, so it never drifts from the validator).
3. Make the agent public (no auth) and set limits: max call duration about 3 minutes, plus a daily call cap.
4. Put the agent id in `.env.local` as `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`.

The web page handles the client tool: it posts the intake to `/api/intake?channel=web_call` and returns `sayThis` to the agent.

## Phone (later)

For a phone number, use the same tool as a **webhook** tool: `POST https://<host>/api/intake?channel=phone`, with the same body.
