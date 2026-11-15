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
Polku is a phone line for suspected lung cancer that does the handoffs between care steps. Every cancer pathway, on the clock.

## Matti
Matti is 71, lives alone in Keski-Suomi, used to smoke and has been coughing for seven weeks. He hasn't called anyone because he doesn't want to be a bother. Today he would wait for a GP slot, an X-ray, a referral, a CT and a pulmonologist, and nobody owns the whole journey. In Sweden his symptoms match a published criterion on day one: a new cough for 6 weeks in a current or former smoker over 40. (Matti is a synthetic person. Criterion: Swedish standardised lung cancer pathway v1.4, https://kunskapsbanken.cancercentrum.se/diagnoser/lungcancer/vardforlopp/)

## The gap
65-70 % of lung cancers in Finland are found at an advanced stage. (Source: Filha lung cancer programme 2026-2035, citing the Cancer Registry, https://www.filha.fi/wp-content/uploads/2026/05/Valtakunnallinen-keuhkosyopaohjelma-2026-2035_180526_preprint.pdf)

Finland has no national lung cancer pathway yet. The national cancer strategy measures equality by treatment within target times, but we found no public county-level series of lung cancer pathway times. Sweden and Denmark publish theirs per region. (Search scope and limits: `docs/lung-pathway-sources.md` in https://github.com/3nd3r1/polku)

Care stalls between the steps more than inside them: call to nurse, nurse to CT, CT to pulmonology. Published county guidance gives about 1 week to CT and 2-3 weeks to the first specialist visit. Polku proposes a nurse callback within 2 days, which is our design choice, not a published standard. (Sources: https://www.pirha.fi/asiakkaalle/hoito-ja-palvelupolut/keuhkosyopapotilaan-hoitopolku and https://www.hyvaks.fi/asiakkaana/hoitopolut/keuhkosyopapotilaan-hoitopolku)

## How it works
The patient only ever uses a phone. Most lung cancer patients are older, and a call needs no app, account or screen.

1. The patient calls the line. The agent says it is an AI and identifies the caller first (Mobile ID, simulated in the demo). Before identification it can read nothing, after it only the caller's own record.
2. The language model turns speech into typed symptoms, each linked to the caller's own words. It does nothing else.
3. Deterministic rules match the symptoms to a published Nordic criterion, and every criterion cites its source. Red flags always return "call 112", enforced in the engine, not the prompt.
4. The caller hears a next step with a deadline, for example "A nurse will call you by Sunday 21:47."
5. The nurse gets one task with a proposed time and accepts it. The agent calls the patient back and books it.
6. The record moves to the next step with its own clock. Every access is logged.

Staff screens show each call live, the nurse's tasks and step clocks, and per-county promises kept, so the target-time indicator comes out of running the pathway.

## The ontology
Everything Polku knows is one typed ontology: people, calls, cases, clocks and appointments, the counties, hospitals and resources that provide care, and the pathway with its steps, criteria, symptoms and sources. Lung is one typed, cited file (`src/pathways/lung.ts`). The next cancer is the next file, and its clocks and county numbers follow from the same model.

## Built on
- ElevenLabs runs the phone line. It answers the call and calls the patient back to book the time.
- Verda is the sovereign AI. Qwen3 runs on Verda GPUs in Europe, on infrastructure we control, and turns speech into typed symptoms.
- Aiven Postgres holds the ontology: the patient record, the clocks and the access log.

## Why now
The national cancer strategy 2026-2035 and its roadmap call for symptom-based referral criteria (measure 2.5.2), pathways with target access times for five cancers by 2028 (3.1.2) and digital pathways with AI symptom assessment (3.5.3). Filha is drafting the Finnish lung criteria now. When they are published, we change the file, not the product. (Source: https://files.hackjunction.app/resources/Kansallinen_syopastrategia_2026_2035_FINAL.pdf)

The customers are the wellbeing counties. They already run phone lines and callback queues, so Polku is a better phone line that produces the indicator they will be asked to report. Lung comes first, then the other roadmap cancers.

## How much did we actually build
The calling actually works: you can phone the line, the agent identifies you and takes your symptoms, and it calls you back to book the time the nurse accepted. The pipeline is implemented up to the CT handoff, and the steps after that are seeded demo cases. Patients, Mobile ID and the calendars are synthetic.
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
