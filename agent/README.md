# Voice agent (ElevenLabs)

The agent only turns speech into a typed intake. Matching happens in our engine, and the agent reads back the sentence our API returns.

## Setup (ElevenLabs dashboard)

1. Create an agent. Paste `prompt.md` as the system prompt. First message: "Hi, this is Polku. Tell me what symptoms you've been having."
2. Add two **client tools**, both with "Wait for response" on: `verify_identity` (no parameters) and `record_intake`. Copy descriptions and parameters from `GET /api/intake` (generated from `src/ontology/schema.ts`, so they never drift from the validator).
3. Make the agent public (no auth) and set limits: max call duration about 3 minutes, plus a daily call cap.
4. Put the agent id in `.env.local` as `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`.

The Screening page handles both tools during a browser call: `verify_identity` posts to `/api/calls/<id>/verify` (simulated Mobile ID, synthetic person) and `record_intake` posts to `/api/intake?channel=web_call&call=<id>`. Each returns `sayThis` to the agent.

## Phone (later)

For a phone number, use the same tool as a **webhook** tool: `POST https://<host>/api/intake?channel=phone`, with the same body.
