# Polku

Junction 2026 hackathon project (Espoo, 13-15 Nov 2026), AstraZeneca challenge "Equal Care Across Finland".

**Pitch:** Polku does the handoffs between cancer care steps. A patient calls a phone line (ElevenLabs voice agent) and describes symptoms. The LLM only turns speech into typed symptom objects, and a deterministic rules engine matches them against published Nordic lung cancer pathway criteria, each with a cited source. The nurse gets one small task with a time already proposed by the rules. If they accept, the agent calls the patient back and books it. The same secured record moves on to the next step, and every access is logged. Polku doesn't replace the nurse's own system.

**Status:** archived after the event. The public demo site (https://polku.ender.fi) stays up. Production, the phone line and the Verda model are shut down.

## Read first

| Doc | What |
|---|---|
| `docs/architecture.md` | How it works technically, and Polku's own rules (linked from `src/pathways/lung.ts`) |
| `docs/product.md` | What Polku is: problem, Matti, surfaces, phone first and identification, safety, business |
| `docs/lung-pathway-sources.md` | Lung criteria (SE/DK/NO/FI), step time limits, symptom codes. `src/pathways/lung.ts` is encoded from this |
| `docs/strategy.md` | National cancer strategy and roadmap measures |
| `docs/design.md` | Locked visual language |
| `docs/deploy.md` | Coolify deployments and the phone line |
| `docs/hackathon/` | Event-weekend notes: build plan, story and demo, submission, reference material |

## Hard rules

- **Patients only ever use a phone.** No patient app, form or screen. Every screen we build is for staff (screening, nurse, county).
- **All code must be written during the event** (from Fri 13.11 16:00). No pasting from older personal projects.
- The repo is public and **MIT licensed**. Never commit API keys, `.env`, or partner credentials.
- **Synthetic data only.** No real patient data. Label synthetic vs real public numbers everywhere in the UI.
- **The LLM never triages or diagnoses.** It only extracts structured symptoms. Matching is deterministic. Red-flag symptoms always return "call 112", enforced in the engine, not just the prompt. A nurse confirms every case.
- Every criterion and every number shown cites its source.
- Commit messages: no trailers, no Co-Authored-By, no session links.

## Stack

- Next.js 16 (App Router, `src/`), React 19, TypeScript, Tailwind 4
- zod (ontology schemas), Drizzle + Postgres (local via docker, Aiven in prod), vitest
- Node comes from `shell.nix`: run `nix-shell` first (NixOS, no global node)
- Next.js 16 has breaking changes: read `AGENTS.md` and `node_modules/next/dist/docs/` before writing Next-specific code

Layout: `src/ontology/`, `src/pathways/`, `src/db/`, `src/server/`, `src/sim/`, `src/demo/`, `src/app/` (`/` Calls, `/nurse` Tasks, `/handoffs`, `/demo`, `/api/*`), `agent/`. Everything that isn't app code (video, brand, pitch, screenshots) lives under `docs/`.

## Working style

Concise and direct, no filler. Never use em dashes. 24h time. Prefer strict typed definitions over prose, and no AI slop: build the one demo path properly before anything else.
