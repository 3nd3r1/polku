# Junction submission form

Draft text for the Junction Platform form. Edit here first, then paste. Links we don't have yet are marked TODO.

## Project Name

```
Polku
```

## Punchline

```
Approve a 90-day county pilot: one phone line, three proposed handoff targets, and a lung cancer pathway measured from the first call to specialist care.
```

## Description

```markdown
## Recommendation and decision
We ask one wellbeing county to approve a 90-day pilot with one phone number, one nurse workflow and one pulmonology clinic, to name a clinical sponsor, and to supply a baseline extract of referral and pathway timestamps. The pilot tests three proposed local targets: nurse callback within 2 working days, CT within 7 days of a confirmed referral, and a first pulmonology visit within 21 days. The CT and visit targets follow published county guidance. The callback target is Polku's proposal, not a national or Nordic standard. (Sources: https://www.pirha.fi/asiakkaalle/hoito-ja-palvelupolut/keuhkosyopapotilaan-hoitopolku and https://www.hyvaks.fi/asiakkaana/hoitopolut/keuhkosyopapotilaan-hoitopolku)

## The gap
65-70 % of lung cancers in Finland are found at an advanced stage. (Source: Filha lung cancer programme 2026-2035, citing the Cancer Registry, https://www.filha.fi/wp-content/uploads/2026/05/Valtakunnallinen-keuhkosyopaohjelma-2026-2035_180526_preprint.pdf)

In 2025, Finland processed 76.8 % of referrals to specialised care within 3 days. Counties ranged from 68.9 % in Etelä-Pohjanmaa to 88.7 % in Kanta-Häme, and Etelä-Pohjanmaa fell from 78.1 % in 2021. This indicator covers all specialities and is reported by the producer of care, so it does not measure the lung pathway. (Source: THL Sotkanet indicator 13, updated 5.6.2026, https://sotkanet.fi/sotkanet/en/metadata/indicators/13)

We found no public county-level lung cancer access-time series. Counties may hold internal data. Denmark and Sweden publish pathway times per region. (Search scope and limits: `docs/lung-pathway-sources.md` in https://github.com/3nd3r1/polku)

## Where to act
The pilot hypothesis is that delay and unclear ownership sit at the handoffs: first contact to nurse, referral to CT, CT to pulmonology. The baseline extract tests this before any capacity changes.

## How Polku runs and measures it
A caller describes symptoms to a voice agent, which turns speech into typed symptoms with the caller's own words attached. Deterministic rules match them to published Nordic lung cancer referral criteria, each with its source, and flag emergencies. The language model does not diagnose or set deadlines. A nurse gets one task with a rule-proposed time. On Accept, the agent calls the patient back and books it. The handoff strip shows who holds the patient and every record access.

The county view puts the real numbers next to Polku's own clocks, names the step where promises break and proposes one action with its precedent. The pilot one-pager states what it takes as planning assumptions: about 5 nurse hours a week (10 cases x 30 min) and 2 protected CT slots a week. No saving is forecast.

## National strategy
The pilot serves roadmap measures 2.5.2 (symptom-based referral criteria), 3.1.2 (pathways with target access times) and 3.5.3 (digital pathways). Its Goal 3 measure is the share of patients who start treatment within a county-agreed target. (Source: national cancer strategy 2026-2035 p.5 and roadmap 2026-2031 pp.52-57 and 73-74, https://files.hackjunction.app/resources/Kansallinen_syopastrategia_2026_2035_FINAL.pdf)

## Honesty notes
Patients and pathway clocks in the demo are synthetic. The Sotkanet and Filha figures are real public aggregates. Mobile ID is simulated. The voice runs on ElevenLabs today, and EU-only processing is a design goal, not the current state. The callback rings in the browser. This is a research prototype, not for clinical use, and it needs a regulatory assessment before deployment. Clinical effect, workload and equity effects are unproven until a pilot measures them.
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
