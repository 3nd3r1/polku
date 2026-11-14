# Polku

A phone line for suspected lung cancer. The caller describes their symptoms, a rules engine checks them against published Nordic referral criteria, and a nurse calls back by a deadline. Every pathway step after that runs on a clock, and the clocks roll up per wellbeing county.

Built at Junction 2026 for the AstraZeneca challenge "Equal Care Across Finland". Try the public demo at https://polku.ender.fi/demo.

## Why

Finland's cancer strategy measures equality as "patients get treatment within target times", but nothing records those times per county today. Finland also has no national lung cancer pathway yet. Polku runs the pathway and the measurement comes out of it. Sources are in `docs/strategy.md` and `docs/lung-pathway-sources.md`.

## How a call works

1. The caller gives their identity code and confirms with Mobile ID (simulated). Until then the agent can't read anything about anyone, and after that only the caller's own case. The server enforces this in `src/server/identity.ts` and logs every tool call.
2. The voice agent (ElevenLabs) turns what the caller says into typed symptoms. It doesn't triage or diagnose.
3. A deterministic engine matches the symptoms against criteria in `src/pathways/lung.ts`, each with a cited source. Red flags always return "call 112".
4. A match opens a case with a nurse callback deadline, which the agent reads out. When the nurse confirms, each pathway step gets its own deadline.

Patients only ever use a phone. All screens are for staff:

| Screen | Who | What |
|---|---|---|
| Screening (`/`) | Care team | Each call live: identity, symptoms, criteria match, outcome |
| Nurse (`/nurse`) | Callback nurse | Cases to call back, step clocks, the next action |
| Cockpit | County | Not built yet |

No microphone? On the demo site, "Play a call" on `/demo` runs scripted synthetic callers through the same API, including an impostor who tries to skip identification. Demo identity codes are in `agent/README.md`.

## Run it

```sh
nix-shell                 # Node 22 on NixOS, otherwise any Node 22
npm install
cp .env.example .env.local
npm run db:up             # Postgres in Docker on port 5433
npm run db:push           # create tables
npm run db:seed           # synthetic register, empty task list
npm run dev               # http://localhost:3000
npm test
```

Or everything in Docker, Postgres and the production build with schema and seed included:

```sh
cp .env.example .env.local   # once
npm run up                   # http://localhost:3000
```

Without npm: `docker compose --env-file .env.local up --build`.

Voice calls need an ElevenLabs agent, see `agent/README.md`. To call the real number, see `docs/phone-demo.md`.

The real phone line is a Twilio number on ElevenLabs answered by "Polku Phone", a copy of the agent whose tools are webhooks to `/api/phone/[tool]` on production. `npm run agent:phone` (after `agent:push`) creates or updates it and points the number at it. When the nurse accepts times, production rings `DEMO_CALLBACK_NUMBER`. The Twilio account is a trial: it only calls verified numbers and plays a trial notice first (press any key).

## Deploy

Pushing to main deploys through Coolify (Dockerfile build, Aiven Postgres). The container creates the schema and seeds on first boot.

```sh
npm run deploy            # manual redeploy if the webhook fails
npm run demo:reset        # wipe and reseed local and production (or: demo:reset local, demo:reset prod)
npm run agent:push        # push prompt and tools to ElevenLabs
```

### Two sites

Both are Coolify apps in the `polku` project, built from `main` with the same Dockerfile.

| | Production | Public demo |
|---|---|---|
| Coolify environment | `production` | `demo` |
| URL | https://prod-polku.eros.ender.fi | https://polku.ender.fi |
| Database (Aiven) | `defaultdb` | `polku_demo` |
| For | us: voice calls, the pitch, the video | anyone: the link we hand out, start at `/demo` |
| `NEXT_PUBLIC_DEMO_SITE` (build time) | unset | `1` |
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | set | unset |
| `SITE_PASSWORD` | set: the browser asks for it once, any user name | unset |

The demo site has no voice calls: scripted callers on `/demo` stand in for the phone, a scripted patient answers the callback, and the reset needs no token. It does not deploy on push: run `npm run deploy:demo`.

## Code

| Path | What |
|---|---|
| `src/pathways/lung.ts` | Lung pathway: criteria, steps, time limits, sources |
| `src/ontology/` | Intake schema (zod), rules engine, tests |
| `src/server/` | Calls, identification, intake, nurse actions, live updates |
| `src/db/` | Drizzle schema: calls, cases, clocks, audit |
| `src/app/api/` | Agent tools, cases, SSE events |
| `agent/` | Voice agent prompt and setup |
| `docs/` | Product, build plan, demo, research |

## Limits

- All data is synthetic. Nobody in the register is real.
- Identification is simulated. A real version would use Suomi.fi e-Identification or a Mobile ID provider.
- Finland has no lung pathway target times yet, so we use the Swedish ones as placeholders.
- It isn't a medical device. Clinical use would need CE marking, and a nurse makes every clinical decision.

## License

MIT
