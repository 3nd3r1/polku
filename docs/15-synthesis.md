# Synthesis: which project, and how to get an edge

Draft, Fri 13.11 ~21:00. Inputs: `10-concept.md` (Polku), `11-alt-valio-aimo.md` (Valtakirja), `12-alt-afterquery.md` (Blast Radius), `14-tech-challenges.md`, and `13-lung-pathway-sources.md` (**pending**).

## Premise

Every team has frontier models (Fable, Codex, Gemini). Model quality is not an edge. Edges come from:
1. **Prize surface:** how many prizes one project can honestly compete for (main + tech challenges)
2. **Peer review:** the top 5 overall come from hackers voting at your table in a few minutes. Memorability wins.
3. **Story:** theme fit, one sticky phrase, one number people remember
4. **Partner judges:** using the partner's exact language and showing you talked to them

## Three options

| | Polku (AstraZeneca) | Valtakirja (Valio Aimo) | Blast Radius (AfterQuery) |
|---|---|---|---|
| Main 1st prize | 1 000 € | 4 000 € | 3 000 € + work trial |
| Agent's self-estimate | n/a | ~79/100 | 75-89/100 |
| Biggest risk | Data scarcity, clinical framing | Obvious build (MCP + approvals + audit), mock API unknown | Harness unproven tonight, token cost |
| "Sovereign ontology" fit | **Native** (health data, EU) | Good (open standards, EU wholesaler vs platforms) | Weak |
| Peer-vote appeal | **High** (cancer, a phone you can call, Finland vs Sweden) | Medium (B2B ordering) | Low (RL env is hard to grasp in 3 min) |
| Tech-challenge stacking | **High:** Gemini, Gemma, Verda, Aiven, ElevenLabs, CRACI, Codex, Oxylabs/Context.dev | Medium: Gemini, Aiven, Codex, CRACI, Oxylabs | Medium: Verda (explicitly named), Modal, Gemma (small model), Codex, CRACI |
| Your passion | **High** | Medium | Medium-high (career) |

**Biased inputs:** each alternative was written by an agent asked to argue for it, and both recommended switching.

## Expected value sketch (rough guesses, not data)

Main prize odds are guesses. Tech-challenge prizes add up across entries:

- **Polku:** AZ 1 000 € (fewer teams in healthcare) + Gemini 4 000 € (open to everyone, competitive) + Gemma 1 000 € (3 winners) + Aiven 1 000 € + Verda credits + small prizes. **Plus the best shot at the overall 10 000 €**, because peer review favours emotional, clear, interactive demos.
- **Valtakirja:** larger main prize, a less memorable demo, and fewer natural tech-challenge fits
- **Blast Radius:** strong career upside, the weakest peer-vote story

## Recommendation: Polku

The lung research (`13-lung-pathway-sources.md`) settles it:

- **Criteria and timings are citable.**
  - Sweden SVF lung v1.4 was read directly: suspicion criteria (e.g. new cough or breathlessness for 6 weeks in a smoker or ex-smoker over 40) and a clock on every step. Totals: 40 days (drug), 44 (surgery/RT), 30 (palliative), 80 % of patients within.
  - Norway (revised 07/2026): 42/35/42 days. Denmark was only partly verified.
  - The only Finnish number: THL's general rule of max 6 weeks (42 days) from referral to first treatment.
- **Finland has no national lung pathway yet.** Filha's lung cancer programme (05/2026): "there has been no precise uniform guidance on the schedule for diagnostics". A national recommendation with primary-care referral criteria and time limits per step is still being drafted. Polku builds that prototype.
- **No public per-county access-time data exists**, for lung or any cancer. This is not a weakness, **it is the Insight.** The strategy's Goal 3 indicator "patients get treatment within target times" **can't currently be measured per county**. Polku's ontology produces those clocks as a by-product of running the pathway.
- **Real, citable county inequality exists anyway:**
  - Pirha publishes "CT usually within about a week of the referral being processed".
  - Keski-Suomi publishes "pulmonology visit within about a month".
  - Two counties, two different promises, no national standard. That is the opening slide.
- Real county data usable this weekend: Sotkanet daily smokers % per hyvinvointialue (risk), the all-cancer index, and Syöpärekisteri incidence/stage/survival (manual CSV export).
- All step clocks in the county view are synthetic, labelled, and calibrated to the public numbers.

The overall Junction prize and tech-challenge stacking outweigh the main-prize difference. Valtakirja is the fallback if something blocks Polku tonight.

## Edge moves for Polku

### Story
- **Tagline built on "sovereign ontology":** e.g. *"A sovereign ontology for Finnish cancer care: your symptoms never leave Europe, your pathway never loses a day."*
- **Make "sovereign" concrete, not buzzword:** personal data is processed only by Gemma on Verda (EU, renewable). Gemini only ever sees aggregate county data. The ontology is open, typed, versioned and owned by Finland, not a vendor.
- **One number:** Finland is 14 percentage points behind Sweden/Norway on 5-year lung cancer survival (strategy target). Also 13 300 cancer deaths a year.
- **Theme:** idealism (fast access for everyone, everywhere) × caution (the AI never triages, a nurse confirms, deterministic criteria with sources)

### Peer review table (the top-5 gate)
- **Reviewers call the number themselves** (ElevenLabs line) or type symptoms into the chat on a phone at the table. Interactive beats watching.
- A printed card: "Call Polku: +358 …". Make it role-play: "pretend you're a 58-year-old smoker with a cough".
- A big live clock on the screen: "days until treatment" ticking per case, with a red breach.
- Stickers or a slide: **"Sovereign Ontology"** as the named concept, repeated everywhere

### Humour (aim it at bureaucracy and rivalry, never at cancer)
- Finland vs Sweden: "Sweden is 14 points ahead. We don't lose to Sweden." (lands at a Finnish event)
- Bureaucracy: "Finland's strategy says pathways by 2028. We did one by Sunday."
- A cheeky ontology diagram in the deck, e.g. `Patient --waitsFor--> Referral --waitsFor--> Referral`

### Partner judges (AstraZeneca)
- Quote their mentors by name. Use their words: "identify the gap, locate it, recommend".
- Map every feature to roadmap measure IDs (2.5.2, 3.1.2, 3.5.3) and Goal 3 indicators
- Show the county pilot path (they want a follow-up with a wellbeing county)
- 2-minute decision-maker clarity: the county view's first screen must say one sentence

## The pitch in four lines

1. Finland is 14 points behind Sweden on lung cancer survival. Pirha promises a CT in a week, Keski-Suomi a specialist in a month.
2. The strategy says patients must get treatment within target times, but nobody can measure that per county, and Finland's lung pathway doesn't exist yet.
3. Polku is a sovereign ontology of the pathway, built from Nordic criteria that are already published. Patients enter by phone or chat, a nurse confirms, and every step runs on a clock.
4. Counties get the measurement the strategy asks for, for free, as a by-product of running care.

## Next actions (tonight)

- [ ] Tell the AstraZeneca mentors the "unmeasurable indicator" insight and see if they bite. Ask about the Syöpärekisteri region level.
- [ ] Create the team on the platform and submit the draft (AstraZeneca + tech challenges) **before 23:59**
- [ ] Claim credits: Verda, Gemini/Gemma (DeepMind booth), Aiven, ElevenLabs, Oxylabs or Context.dev
- [ ] Encode the lung pathway from `13-lung-pathway-sources.md` as the typed definition file (first build task)
- [ ] Get the Gemma-on-Verda inference path working early (the riskiest infra piece)
