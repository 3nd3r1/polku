# Junction submission form

Draft text for the Junction Platform form. Edit here first, then paste. Links we don't have yet are marked TODO.

## Project Name

```
Polku
```

## Punchline

```
A phone line that puts every suspected lung cancer patient on the clock: published Nordic criteria, a nurse callback, and per-county waiting times Finland can't measure today.
```

## Description

```markdown
## The problem
Finland trails Sweden and Norway by about 14 percentage points in 5-year lung cancer survival, and the national cancer strategy (2026-2035) sets closing that gap as a goal. Its headline equality indicator, "patients get treatment within target times", can't be measured per wellbeing county today: Finland has no national lung pathway yet, and no public per-county access-time data exists. Meanwhile counties promise different things: Pirkanmaa says CT within about a week of the referral being processed, Keski-Suomi says a specialist within about a month.

## What Polku does
**1. A phone call is the only patient interface.** Most cancer patients are older, and the best interface for them is the phone they already have. No app, no form. The caller is strongly identified (Mobile ID, simulated in the prototype), then describes their symptoms in their own words to a voice agent.

**2. The AI never triages.** The LLM only turns speech into typed symptom objects, each linked to the caller's exact words. A deterministic rules engine matches them against published Nordic lung cancer pathway criteria (Swedish SVF, Danish and Finnish regional guidance), and every criterion cites its source. Red-flag symptoms always return "call 112", enforced in the engine, not the prompt.

**3. A nurse decides, and every step runs on a clock.** Matches go to a nurse callback queue with a deadline. The nurse confirms, and each pathway step (assessment, referral, specialist visit, diagnostics, MDT, treatment start) starts its own clock with a sourced target time.

**4. Counties see where the delays are.** The clocks roll up per wellbeing county and pathway step: the Goal 3 indicator, measured as a by-product of running care. Polku also records the interval nobody measures today, from symptom onset to first contact.

## Sovereign ontology
The pathway is code: one typed, versioned definition of criteria, steps and time limits, each citing its source. Patients, cases, criteria, steps and clocks are typed objects, and every change is an audited action with a permitted role. Personal data is meant to stay in the EU on infrastructure we control.

## Maps to the national roadmap
- 2.5.2: standardised symptom-based referral criteria
- 3.1.2: cancer pathways with target access times
- 3.5.3: digital pathways and symptom assessment

## Built with
Next.js, TypeScript, zod, Drizzle and Postgres, ElevenLabs voice agent, deterministic rules engine with tests.

## Honesty notes
Synthetic data only. Strong identification is simulated. Prototype, not a medical device in its current form.
```

## Challenge

AstraZeneca: Equal Care Across Finland

## Links

| Field | Value |
|---|---|
| Project Demo | TODO (after deploy) |
| Source Code | https://github.com/3nd3r1/polku |
| Video | TODO (max 2:00, public YouTube/Vimeo) |
| Other Link | TODO |
| Presentation | TODO (PDF) |

## Tech challenges

- Best Use of Gemini API
- Best Use of Gemma
- Verda Compute Track
- Best Use of Aiven
- Best Use of ElevenLabs
- Best use of CRACI
- Best Use of Codex

Undecided: Oxylabs or Context.dev (pick one, only if it visibly drives the demo).
