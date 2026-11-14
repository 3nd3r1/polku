# Polku

Junction 2026 hackathon project (Espoo, 13-15 Nov 2026), AstraZeneca challenge "Equal Care Across Finland".

**Pitch:** a sovereign ontology for Finnish cancer care. A patient calls a phone line (ElevenLabs voice agent) and describes symptoms. The LLM only turns speech into typed symptom objects. A deterministic rules engine matches them against published Nordic lung cancer pathway criteria, each with a cited source. A nurse confirms, and every pathway step runs on a clock. A county cockpit rolls the clocks up per wellbeing county (hyvinvointialue). That's the Goal 3 indicator Finland can't measure today.

## Read first

| Doc | What |
|---|---|
| `docs/build-plan.md` | **Source of truth for what to build**: scope with status, Polku's own rules, architecture, spikes, validation, build order, timeline |
| `docs/product.md` | What Polku is: problem, Matti, the three surfaces, phone first and identification, sovereign ontology, safety, business |
| `docs/story-and-demo.md` | Story, wow moments, table/AstraZeneca/stage run of show, video beat sheet, facts to check, Q&A |
| `docs/lung-pathway-sources.md` | Lung criteria (SE/DK/NO/FI), step time limits, symptom codes, public data. `src/pathways/lung.ts` is encoded from this |
| `docs/strategy.md` | National cancer strategy and roadmap: Goal 3, measures 2.5.2, 3.1.2, 3.5.3, other evidence to verify |
| `docs/tech-challenges.md` | Side prizes we enter and each one's job in the architecture |
| `docs/submission.md` | Junction submission form draft |
| `docs/reference/` | Event schedule, rules, submission checklist, the AstraZeneca brief |

## Hard rules

- **Patients only ever use a phone.** No patient app, form or screen. Every screen we build is for staff (screening, nurse, county).
- **All code must be written during the event** (from Fri 13.11 16:00). No pasting from older personal projects.
- The repo is public and **MIT licensed**. Never commit API keys, `.env`, or partner credentials.
- **Synthetic data only.** No real patient data. Label synthetic vs real public numbers everywhere in the UI.
- **The LLM never triages or diagnoses.** It only extracts structured symptoms. Matching is deterministic. Red-flag symptoms always return "call 112", enforced in the engine, not just the prompt. A nurse confirms every case.
- Every criterion and every number shown cites its source.
- Commit messages: no trailers, no Co-Authored-By, no session links.

## Deadlines

- **Fri 23:59:** draft submission on the Junction Platform
- **Sun 10:00:** FINAL submission (aim for 09:00). Video max 2:00.
- **Sun 10:30-14:00:** peer review, both team members present
- **Sun 14:00:** AstraZeneca judging

## Stack

- Next.js 16 (App Router, `src/`), React 19, TypeScript, Tailwind 4
- zod (ontology schemas), Drizzle + Postgres (local via docker, Aiven in prod), vitest
- Node comes from `shell.nix`: run `nix-shell` first (NixOS, no global node)
- Next.js 16 has breaking changes: read `AGENTS.md` and `node_modules/next/dist/docs/` before writing Next-specific code

Layout: `src/ontology/`, `src/pathways/`, `src/db/`, `src/server/`, `src/sim/`, `src/app/` (`/` Screening, `/nurse`, `/cockpit` todo, `/api/*`), `agent/`, `eval/` (todo).

## Working style

Concise and direct, no filler. Never use em dashes. 24h time. Prefer strict typed definitions over prose, and no AI slop: build the one demo path properly before anything else.
