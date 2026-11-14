# Polku

**Every cancer pathway, on the clock.** A phone line for suspected lung cancer that applies published Nordic referral criteria, books a nurse callback, and runs a clock on every pathway step, rolled up per Finnish wellbeing county.

Built at Junction 2026 for the AstraZeneca challenge *Equal Care Across Finland*.

## Why

- The national cancer strategy 2026-2035 sets a goal of raising 5-year lung cancer survival by 14 percentage points to reach the Nordic level.
- The strategy's equality indicator, "patients get treatment within target times", can't be measured per county today. Finland has no national lung pathway yet, and no public per-county access-time data exists.
- Counties already promise different things: Pirkanmaa, CT within about a week of the referral being processed; Keski-Suomi, a specialist within about a month.

Sources for every claim are in [`docs/strategy.md`](docs/strategy.md) and [`docs/lung-pathway-sources.md`](docs/lung-pathway-sources.md).

## How it works

1. **The patient calls.** A phone call is the only patient interface, because most cancer patients are older ([`docs/product.md`](docs/product.md)). The caller is strongly identified (Mobile ID, **simulated**), so age and county come from the identity, not from the conversation.
2. **The LLM extracts, it never triages.** The voice agent turns speech into typed symptom objects, each with the caller's own words.
3. **A deterministic engine matches.** The symptoms are checked against published criteria (Swedish SVF lung pathway v1.4, Danish and Finnish regional guidance), and each criterion cites its source. Red flags always return "call 112", enforced in the engine.
4. **A nurse decides.** A match opens a case with a callback deadline. The nurse confirms, and each pathway step starts its own clock with a sourced target time.
5. **The county sees the delays** (in progress). Clocks are rolled up per wellbeing county and step.

## The screens (staff only)

| Tab | Who | What |
|---|---|---|
| Screening (`/`) | Care team | Each call live: identification, symptoms, criteria check, outcome |
| Nurse (`/nurse`) | Callback nurse | Cases to call back, step clocks, one action per step |
| Cockpit | County | Planned |

No microphone? The Screening tab's **Simulate** buttons play scripted synthetic callers through the same API.

## Run it

```sh
nix-shell                 # Node 22 (NixOS); otherwise use any Node 22
npm install
cp .env.example .env.local
npm run db:up             # Postgres in Docker on port 5433
npm run db:push           # create tables
npm run dev               # http://localhost:3000
npm test                  # engine tests
```

Voice calls need an ElevenLabs agent. See [`agent/README.md`](agent/README.md).

## Code map

| Path | What |
|---|---|
| `src/pathways/lung.ts` | The lung pathway as code: criteria, steps, time limits, sources |
| `src/ontology/` | Intake schema (zod), deterministic engine, tests |
| `src/server/` | Actions: calls, identification, intake, nurse actions, live updates |
| `src/db/` | Drizzle schema: calls, cases, clocks, audit |
| `src/app/api/` | `calls`, `intake` (agent tools), `cases`, `events` (SSE) |
| `agent/` | Voice agent prompt and setup |
| `docs/` | Product, build plan, story and demo, research and sources |

## Honesty notes

- **Synthetic data only.** No real patient data. People returned by the simulated identification are fictional.
- **Strong identification is simulated.** Real integration would go through Suomi.fi e-Identification or a Mobile ID provider.
- **Finland's own lung targets don't exist yet.** The Swedish SVF times are used as a placeholder, with Danish and Norwegian times documented alongside.
- **Not a medical device in its current form.** As a product, software that applies referral criteria to patient symptoms would need medical device conformity assessment (CE marking) before clinical use. In Polku a nurse makes every clinical decision.

## License

MIT
