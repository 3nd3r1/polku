# Junction submission form

Draft text for the Junction Platform form. Edit here first, then paste. Links we don't have yet are marked TODO.

## Project Name

```
Polku
```

## Punchline

```
Let's close the path of oncology with ontology and sovereign AI.
```

## Description

```markdown
Polku is a phone line for suspected lung cancer that does the handoffs between care steps. A caller describes their symptoms, rules match them to published Nordic referral criteria, a nurse accepts one proposed time, and Polku calls the patient back to book it. Every step after that runs on its own clock, so the pathway gets measured while it is being run.

## Recommendation and decision
We ask one wellbeing county to approve a 90-day pilot with one phone number, one nurse workflow and one pulmonology clinic, to name a clinical sponsor, and to supply a baseline extract of referral and pathway timestamps. The pilot tests three proposed local targets: nurse callback within 2 working days, CT within 7 days of a confirmed referral, and a first pulmonology visit within 21 days. The CT and visit targets follow published county guidance. The callback target is Polku's proposal, not a national or Nordic standard. (Sources: https://www.pirha.fi/asiakkaalle/hoito-ja-palvelupolut/keuhkosyopapotilaan-hoitopolku and https://www.hyvaks.fi/asiakkaana/hoitopolut/keuhkosyopapotilaan-hoitopolku)

## The gap
65-70 % of lung cancers in Finland are found at an advanced stage. (Source: Filha lung cancer programme 2026-2035, citing the Cancer Registry, https://www.filha.fi/wp-content/uploads/2026/05/Valtakunnallinen-keuhkosyopaohjelma-2026-2035_180526_preprint.pdf)

In 2025, Finland processed 76.8 % of referrals to specialised care within 3 days. Counties ranged from 68.9 % in Etelä-Pohjanmaa to 88.7 % in Kanta-Häme, and Etelä-Pohjanmaa fell from 78.1 % in 2021. This indicator covers all specialities and is reported by the producer of care, so it does not measure the lung pathway. (Source: THL Sotkanet indicator 13, updated 5.6.2026, https://sotkanet.fi/sotkanet/en/metadata/indicators/13)

We found no public county-level lung cancer access-time series. Counties may hold internal data. Denmark and Sweden publish pathway times per region. (Search scope and limits: `docs/lung-pathway-sources.md` in https://github.com/3nd3r1/polku)

## Where to act
The pilot hypothesis is that delay and unclear ownership sit at the handoffs: first contact to nurse, referral to CT, CT to pulmonology. The baseline extract tests this before any capacity changes.

## How Polku runs and measures it
The ElevenLabs voice agent answers the call. Qwen3 on Verda GPUs in Europe turns the caller's speech into typed symptoms with their own words attached, and does nothing else. Deterministic rules match the symptoms to published Nordic lung cancer referral criteria, each with its source, and red flags always return "call 112" from the engine. The language model does not diagnose or set deadlines. A nurse gets one task with a rule-proposed time. On Accept, the agent calls the patient back and books it. The handoff strip shows who holds the patient and every record access.

The county view puts the real numbers next to Polku's own clocks, names the step where promises break and proposes one action with its precedent. The pilot one-pager states what it takes as planning assumptions: about 5 nurse hours a week (10 cases x 30 min) and 2 protected CT slots a week. No saving is forecast.

## The ontology
Everything Polku knows is one typed ontology in Aiven Postgres: people, calls, cases, clocks and appointments, the counties, hospitals and resources that provide care, and the pathway itself with its steps, criteria, symptoms and sources. The lung pathway is one typed file that cites a source for every criterion and time limit (`src/pathways/lung.ts`). Adding the next cancer means writing the next file, and its clocks and county numbers follow from the same model.

## National strategy
The pilot serves roadmap measures 2.5.2 (symptom-based referral criteria), 3.1.2 (pathways with target access times) and 3.5.3 (digital pathways). Its Goal 3 measure is the share of patients who start treatment within a county-agreed target. (Source: national cancer strategy 2026-2035 p.5 and roadmap 2026-2031 pp.52-57 and 73-74, https://files.hackjunction.app/resources/Kansallinen_syopastrategia_2026_2035_FINAL.pdf)

## Honesty notes
Patients and pathway clocks in the demo are synthetic. The Sotkanet and Filha figures are real public aggregates. Mobile ID is simulated. Symptom extraction runs on Qwen3 on Verda in the EU, with hosted Gemini as a fallback if that endpoint is slow or down. The voice layer is ElevenLabs, which on our tier routes audio through the US, so a fully EU call is a goal, not the current state. Only lung is encoded, and other pathways shown in the video are illustrative. This is a research prototype, not for clinical use, and it needs a regulatory assessment before deployment. Clinical effect, workload and equity effects are unproven until a pilot measures them.
```

## Challenge

AstraZeneca: Equal Care Across Finland

## Links

| Field | Value |
|---|---|
| Project Demo | https://polku.ender.fi/demo |
| Source Code | https://github.com/3nd3r1/polku |
| Video | TODO: upload `video/PolkuV3.mp4` (1:59) to YouTube or Vimeo as public |
| Other Link | https://github.com/3nd3r1/polku/blob/main/docs/Polku-white-paper.pdf (research paper) |
| Presentation | `docs/polku-deck.pdf` |

## Tech challenges

| Challenge | Job in Polku |
|---|---|
| Verda Compute Track | Qwen3-30B-A3B on vLLM in a Verda serverless container turns call speech into typed symptoms. Needs the summary post in Verda's Discord (`docs/verda-post.md`). |
| Best Use of Aiven | Aiven Postgres holds the ontology in production: records, clocks and the access log. |
| Best Use of ElevenLabs | The phone line: answers the call and calls the patient back to book. |

Dropped from the earlier draft: Gemma (replaced by Qwen3, which handles tool calls), CRACI and Codex (not done). Gemini only runs as the fallback model, so it is a weak entry.
