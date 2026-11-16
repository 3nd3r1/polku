# How Polku works

Polku is a Next.js app with a Postgres database and a voice agent on ElevenLabs. The language model only turns speech into typed tool calls. Everything that decides anything (who the caller is, which criterion matches, which time to propose, who may read which part of the record) is plain TypeScript on our server.

```
patient phone                       our server (Next.js)                              staff screens
─────────────                       ────────────────────                              ─────────────
call ─▶ ElevenLabs ─▶ LLM ─tool─▶  identity gate ─▶ intake ─▶ rules engine ─▶ case    Calls     /
        (voice)     (Qwen3 on       (hetu + Mobile    (zod)     (lung.ts)       + clock  Tasks     /nurse
                     Verda)          ID, simulated)                              │       Handoffs  /handoffs
                                                                                  ▼
callback ◀── ElevenLabs ◀── book_time ◀── nurse accepts proposed times ◀── scheduler
                                                                                  │
                                                       next step, same record ◀───┘
```

## The call

The agent is defined as code in `agent/` (prompt, tool configs, `sync.ts`) and pushed with `npm run agent:push`. It has four tools: `verify_identity`, `get_case`, `record_intake` and `book_time`. Their schemas live once in `src/server/agent-tools.ts`, so the agent can't drift from the server's validator.

There were two ways in:

- Browser call. The Calls screen opens an ElevenLabs web call and runs the tools as client tools that forward to `/api/calls/[id]/*` and `/api/intake`.
- Phone. A Twilio trial number on ElevenLabs, answered by a copy of the agent ("Polku Phone") whose tools are webhooks to `/api/phone/[tool]`. Setup is `agent/phone.mts`.

The agent's LLM was Qwen3-30B-A3B-Instruct (FP8) on vLLM, in a Verda serverless container on one L40S in the EU (`agent/verda/deploy-qwen.sh`). ElevenLabs sends each turn to our `/api/llm/chat/completions`, which forwards it to Verda and writes the live transcript on the way (`src/server/llm-proxy.ts`). Hosted Gemini was the fallback. We started with Gemma 3 12B and a custom tool-call template (`agent/verda/gemma3-tools.jinja`), then switched to Qwen3 because it does tool calls natively and only about 3B parameters are active per token, which kept turns fast enough for voice.

The voice itself still went through ElevenLabs, which on our tier routes audio through the US. A fully EU call was the goal, not the state.

## The access gate

`src/server/identity.ts` is the only path from a tool to personal data.

- Before identification every tool returns nothing about anyone.
- `verify_identity` takes the spoken identity code (hetu), checks its check character (`src/ontology/hetu.ts`), looks it up in the synthetic register and runs a simulated Mobile ID confirmation. The agent gets back first name, age and county, never the code.
- After that, tools only reach the identified caller. No tool takes a name, code or person id as input, so there is nothing to inject.
- Three failed codes lock the call.
- Every tool call is written to `access_log` as allowed, refused or ask, and shown on the Calls screen.

Tests: `src/server/identity.test.ts`.

## Intake and the rules engine

`record_intake` sends observations: a symptom code from a fixed enum, duration, known cause and the caller's own words, plus smoking status (`src/ontology/schema.ts`). Age comes from the identity, not the agent. Clinician-only codes like imaging findings aren't in the enum, so the model can't emit them.

`src/ontology/clarity.ts` decides whether the intake is clear enough. If a duration or the smoking status is missing, the tool answers with the question the agent has to ask next. Red flags are never held back for clarity.

`src/ontology/engine.ts` matches observations against the criteria in `src/pathways/lung.ts` and returns one of `call_112`, `fast_track`, `see_gp` or `no_match`, with the matched criterion and its source. Any emergency criterion wins over everything else. What the agent says back is fixed text from `sayThis`, never generated. Tests: `src/ontology/engine.test.ts`.

`lung.ts` is the whole pathway in one typed file: sources, criteria with severity levels, steps with time limits, and a note on where each number comes from. It was encoded from `docs/lung-pathway-sources.md`. Swedish SVF v1.4 is the backbone because Finland has no national lung pathway yet, with Danish and Finnish regional criteria alongside.

## Cases, clocks and booking

A match opens a case with a clock on the nurse callback step (`src/server/cases.ts`). The caller hears the deadline, for example "A nurse will call you by Wednesday 18 November at 10:19".

The nurse's task list is ranked by rules in `src/server/schedule.ts`: first patients with no free time left before the step's limit, then the stronger criterion level, then by deadline. For each task the scheduler finds resources in the patient's county that provide the next step's capability (`src/ontology/world.ts`) and proposes the earliest free sessions before the limit. Occupancy of those calendars is synthetic (`src/sim/capacity.ts`). Real bookings from the database are laid on top.

The nurse presses Accept, or "I'll call myself" and books directly. Accept starts the callback: the agent calls the patient, they identify again, hear the numbered times and pick one, and `book_time` books it. The step's clock closes as kept or broken, and the next step's clock starts.

## One record per patient

`src/ontology/record.ts` splits the record into parts (identity, contact, symptoms, match, booking) and says which holder (call, nurse, CT, specialist) may open which part. The CT unit gets the referral reason, not the symptom story. Every open or write goes to `record_access` through `src/server/record.ts`, and anything outside a holder's parts is refused. The Handoffs screen reads this table.

## The ontology

`src/ontology/meta.ts` defines object types and link types. `world.ts` holds the care layer as validated data: counties, hospitals, capabilities and schedulable resources, each marked real, synthetic or design choice. `graph.ts` builds one instance graph from the register, calls, cases and the pathway, served at `/api/ontology`. Adding a hospital or a CT session is a row of data, and a new cancer would be a new pathway file.

## Data and live updates

Postgres through Drizzle (`src/db/schema.ts`): `people`, `calls`, `access_log`, `cases`, `clocks`, `audit`, `record_access`. Writes publish to an in-process event bus (`src/server/bus.ts`) and the screens listen on `/api/events` with server-sent events. That only works with one server instance, which was all we ran.

## Two deployments

Same Dockerfile, both on Coolify, both on Aiven Postgres with separate databases during the event. After it, the demo's database moved to a Postgres container on Coolify.

- Production: voice calls, the phone line, the pitch and the video. Behind a shared password. Shut down after the event.
- Public demo (`NEXT_PUBLIC_DEMO_SITE=1`): no voice. Scripted callers on `/demo` go through the same API and the same gate, a scripted patient answers the callback, and anyone can press Start over.

Details in `docs/deploy.md`.

## Polku's own rules

These came from us, not from a published pathway. `lung.ts` cites them as source `POLKU`.

- Red flags mean 112. Massive haemoptysis, severe breathlessness or sudden severe chest pain always return "call 112 now", enforced in the engine whatever the LLM says.
- Nurse callback within 2 days of a match. No Nordic pathway defines this step. The nearest precedent is Pirkanmaa, which processes lung referrals within 1-2 working days.
- Nothing before identification, as described under the access gate.
- No case without a clear intake. The agent is told what's missing and asks again.
- Proposed times come from a rule, the earliest free slot before the deadline. The agent only reads the time out and records the answer.
- Patient self-report only reaches "suspicion, nurse to confirm". A nurse confirms every case.

## What was real and what was simulated

Real: the voice calls, the phone line (Twilio trial), the LLM on Verda, the identity code check, the rules, the clocks, the booking callback, the access logs, and the county and hospital names.

Simulated: every patient (identity codes in the 900-999 test range, never issued to real people), Mobile ID (always approves), resource calendars and their occupancy, and the steps after the CT handoff, which were seeded rather than driven by real events.
