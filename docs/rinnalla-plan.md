# Rinnalla – Full Plan (Junction 2026, AstraZeneca challenge "Equal Care Across Finland")

> **Context for the reader (human or AI):** This is our team's full plan for a 48-hour hackathon entry. It covers the challenge, the evidence, the concept, how AI is used, data and analyses, recommendations, the demo, the build plan and risks. UI design is documented separately and left out here. Figures marked *synthetic* are invented demo data; everything else is sourced (see Sources at the end).

---

## 1. The challenge

**Sponsor:** AstraZeneca (Finland). **Track:** Healthcare. **Prizes:** €1,000 / €750 / €250.

**Brief (summary):** Build an AI-powered system that supports equal and effective cancer care across Finland. The solution should:

1. **Identify the gap** – differences in access to cancer care or outcomes.
2. **Locate the gap in the care pathway** – detection, referral from primary to specialist care, diagnosis, or treatment start.
3. **Recommend what to do** – concrete, evidence-based proposals that a wellbeing services county or the nation could implement. This is the most important part.

**Minimum requirements:**

- Use reliable evidence (public data and/or insights from AstraZeneca mentors), with sources for every claim.
- Cover at least one indicator connected to **Goal 3** of the National Cancer Strategy.
- Give actionable recommendations, not just analysis.
- Show a working demo (slides alone are not enough).
- A decision-maker should understand the key message within two minutes.

**Judging criteria:**

| Criterion | Weight | Question judges ask |
|---|---|---|
| Actionability | 30% | Are proposals concrete enough for a health centre or county to implement? |
| Insight | 25% | Does it reveal a real, meaningful gap and show where it emerges in the pathway? |
| Data quality & transparency | 20% | Clear sources, limitations acknowledged, no unsupported assumptions? |
| Execution | 15% | Does it work live in front of the judges? |
| Clarity | 10% | Can a decision-maker get the message and action in two minutes? |

AstraZeneca would like to continue promising solutions after Junction, ideally as a follow-up project with a Finnish wellbeing services county. Judges are largely from marketing and business excellence, so the story matters.

---

## 2. Goal 3 of the National Cancer Strategy 2026–2035

**Goal 3: "Ensure equitable and effective cancer care"** (*Varmistetaan yhdenvertainen ja vaikuttava syövänhoito*).

**Headline indicators:**

- Five-year survival for poor-prognosis cancers rises to the Nordic level (lung cancer: more than +14 percentage points over the 2023 level).
- Cancer mortality falls by 10% from about 13,300 deaths a year.
- Patients access treatment within target times (monitored under THL guidance 21/2016; the strategy sets no numeric target in days).
- Regional and socioeconomic differences in incidence, treatment and mortality are available and used to steer services.

**Sub-goals:**

| Sub-goal | Content |
|---|---|
| 3.1 | National treatment guidelines and care pathways, including target waiting times |
| 3.2 | National cancer quality register, systematic review of results, peer comparison between counties |
| 3.3 | Rehabilitation, psychosocial support, health social work and palliative care as a standard part of the pathway |
| 3.4 | Functional-capacity data (e.g. the G8 screen) guiding diagnosis and treatment of older patients |
| 3.5 | Sufficient, skilled staff; digital tools and AI |

**Implementation roadmap 2026–2031 actions we tie into:**

| Action | What it says | How Rinnalla relates |
|---|---|---|
| 1.2.2 | Uniform patient-experience measures (NPS, HoPP) with digital apps and wellbeing questionnaires | Rinnalla collects experience and wellbeing data as part of each contact |
| 1.2.3 | A named care coordinator model; FICAN guidance 2026–28, counties adopt 2029–31 | Rinnalla is the coordinator's working tool |
| 3.1.2 | Pathway descriptions for 5 cancers with waiting-time targets in 2026–28 | Rinnalla tracks each patient against those target times |
| 3.1.4 | National quality and effectiveness indicators per cancer | Our proposed timestamp standard feeds these |
| 3.2.1 / 3.2.2 | Quality register (90% coverage target) and county benchmarking | Our county view and timestamps support both |
| 3.3.1 | National patient-reported measures (EQ-5D-5L via GenPROM) in patient systems and OmaKanta | Wellbeing questions inside Rinnalla contacts |
| 3.4.1 | Systematic functional assessment (G8) for older cancer patients | Rinnalla asks G8 for patients over 70 |
| 3.5.3 | Digital tools, AI and innovation: digital care pathways, remote follow-up, symptom assessment, self-care apps; 2026–28 = mapping and **limited pilots** | Rinnalla is a pilot candidate under this action |
| 4.1.1 | Structured, harmonised recording of cancer data (FHIR, OMOP), AI-supported structuring | Our timestamp standard plugs into this data model |

---

## 3. The problem (evidence)

### 3.1 What limits Finnish cancer care

1. **Access to primary care and early recognition (the biggest limit).**
   - Chief physicians name delays in reaching care, especially in primary care, as the main reason Finland's results are worse than other Nordic countries'.
   - The Cancer Society's council calls primary-care access barriers the bottleneck for early detection and equal care.
   - In a patient survey, nearly a third felt their diagnosis was delayed. Obstacles: money (19%), finding a suitable doctor (18%), long distance to a cancer doctor (11%).
2. **Doctors and staff.** One in three people cannot see a primary-care doctor within two weeks; there are shortages of radiologists and cancer specialists, and training takes years.
3. **Money.** Cancer care costs are expected to grow from about €1.4bn (2023) to €2.2bn (2035); the strategy needs €139M for 2027–31; €400,000 for the quality register was removed from next year's budget proposal; higher patient fees may delay low-income people.
4. **Structure and data.** Finland is the only Nordic country without transparent national guidelines and standardised pathways; stage is recorded in only 42% of new cancers.
5. **Patients' willingness (smallest).** 97% of patients are committed to treatment once in it; the problem is getting in. Fear and cost can delay seeking help.

**Implication:** a solution must not need more doctors. It should save clinicians' time and act on the front door and the handovers.

### 3.2 What patients actually wait for

For lung cancer, the average time from first symptoms to treatment in Finland is about **155 days** (Yle MOT). The wait is several stacked waits:

1. Deciding to seek help (fear, cost, not recognising the symptom)
2. Getting a primary-care appointment
3. Being believed: over half felt symptoms weren't taken seriously; a third needed three or more visits before diagnosis
4. Tests, then the result, then someone to tell them (sometimes a test must be redone)
5. The referral: written, sent, processed
6. First specialist appointment
7. Further tests: CT, MRI, PET, endoscopy, biopsy, pathology, molecular tests
8. Multidisciplinary team meeting and treatment decision
9. Treatment start: surgery slot, radiotherapy planning or drug treatment

Throughout: waiting for a call or letter without knowing if anything is happening. Just under 40% had to ask for their own test results.

**Key insight #1 – much of the wait is handovers, not queues.** A result is ready but nobody calls; a referral is written but not confirmed. Handovers can be fixed without extra doctors.

**Key insight #2 – the official clock starts too late.** THL's monitoring (guidance 21/2016) measures from when the referral arrives at the hospital. Steps 1–5 are a blind spot, even though primary care is the named bottleneck. Yle MOT confirmed that Finland lacks comprehensive national data on cancer treatment delays.

**Pitch line:** "The official clock starts at the referral. Our clock starts at the first suspicion."

### 3.3 Who the patients are

- Cancer is mainly a disease of older people; a typical patient is around 70 (approximate – verify in Finnish Cancer Registry age statistics before using on a slide).
- By 2040, cancers among people over 75 are forecast to grow by more than 60%, and one in five new cancers will be in people over 85.
- **Implication:** no smartphone app. Use text messages, phone calls, letters, and relatives.

### 3.4 Language

- 646,392 people (11.4% of the population, end of 2025) have a mother tongue other than Finnish, Swedish or Sámi; the group grew more than 70% from 2017 to 2025, but is younger than average, so its share among today's cancer patients is clearly lower.
- Concentrated in the capital region: people of foreign background are 30% of Vantaa, 26% of Espoo, 22% of Helsinki.
- Equality gap: cervical screening participation is 73% for women born in Finland, 62% for those born elsewhere in Europe, 46% for those born in Africa. Screening participation is lowest in Helsinki, Vantaa–Kerava and Western Uusimaa.
- Swedish is required anyway in bilingual counties.
- **Implication:** language support is a strong but secondary feature; AI makes extra languages nearly free.

---

## 4. The concept: Rinnalla

### 4.1 One line

**Rinnalla** ("alongside") is a support service that the wellbeing services county gives every patient from the first suspicion of cancer to the start of treatment, so nobody waits alone and nobody has to chase their own care.

**Framing:** a supportive part of the care process, provided by the county – not a monitoring tool, not a commercial app. The data it produces is a by-product of good care.

**Promise to the patient:** "You won't have to wait alone, and you won't have to chase anything yourself. We'll tell you what happens next, and we'll check that it happens."

**Closing line for the pitch:** "Cancer care in Finland is excellent once you get there. We make sure nobody has to wait on that road alone."

### 4.2 How it works

1. **Enrolment at the first suspicion.** When a doctor first suspects cancer, the patient joins with consent. They choose channel (text, call, letter), language, and whether a relative is included. The first contact also asks when symptoms started and how many visits it took – covering the blind spot before referral.
2. **A short message or letter at each step:** what happened, what comes next, roughly when, who to call.
3. **A clock for every step.** Each step has a maximum time. When a fixed rule sees that a handover has stalled, the service gets in touch first, in this order:
   1. a text message ("Has anyone contacted you about your scan result?")
   2. if no reply, an AI phone call that says it is an AI and asks 2–3 questions
   3. if needed, the named relative
   4. then a call from a human coordinator
4. **Worries always go to a person.** The AI never gives medical advice.
5. **Wellbeing in parallel:** a few EQ-5D-5L questions, plus the G8 screen for patients over 70, so psychosocial, rehabilitation and geriatric support reach them in time.
6. **The coordinator sees only exceptions:** e.g. "47 on track, 3 need a call today."

### 4.3 Channels and languages

- Text and phone first (work without a smartphone), letters for those who prefer paper.
- Finnish and Swedish from day one; other languages added by AI. Core messages are pre-translated and checked; complex situations go to a human interpreter.

---

## 5. How AI is used

**Principle:** AI handles talking, listening, writing and noticing patterns. People and fixed rules make decisions.

| Role | What the AI does |
|---|---|
| Talking | Natural phone calls in Finnish and Swedish (and more), at the patient's pace; plain-language texts and letters |
| Listening | Turns free speech ("I had the scan last week but haven't heard") into structured data; recognises worry or confusion and routes it to a person; catches urgent warning words and escalates without assessing them |
| Reading | Pulls dates and steps from letters or referrals |
| Matching | Spots when sources disagree (e.g. a test is booked but the patient knows nothing) |
| Supporting staff | A three-line summary before each call; draft messages to the treating unit; explains why a patient is first on today's list |
| Reporting | Drafts the county's monthly report and a board proposal; a second "sceptic" agent checks every figure against its source |
| Learning | Which channel and wording reach which group; simulations ("one more coordinator → how many fewer stalls?") |

**What the AI never does:**

- No diagnosis, urgency assessment or treatment advice (keeps it out of medical-device regulation and EU AI Act high-risk territory).
- No decisions about a patient without a person. Rules flag; the AI explains and contacts.
- No pretending to be human – every call starts "I'm an AI assistant" (EU AI Act transparency).
- No data outside healthcare; the county provides the service and holds the data.

---

## 6. Data and analyses

### 6.1 Existing data (real baseline)

| Source | What it gives |
|---|---|
| Finnish Cancer Registry | Incidence, survival, stage coverage by county (stage recorded in 42% of new cancers, 2024), screening participation by county, mother tongue and education |
| Lung cancer quality-register pilot report 2019–2023 | Diagnosis and treatment by county; 27% reached curative treatment; stage missing for almost half |
| THL | Primary-care access monthly by county; specialist-care queues |
| NORDCAN | Nordic survival benchmark |
| Statistics Finland | Age structure, language, distances, education and income by area |
| Cancer Patients Finland survey | Felt delays, number of visits, patients asking for their own results |

### 6.2 Missing data (what Rinnalla fills)

- Timestamps for each step from first suspicion to treatment start
- Number of visits before referral
- How much of the wait was a queue vs a stalled handover
- How the patient is doing while waiting

### 6.3 Analyses Rinnalla produces

1. **Wait split by step per county** – median and slowest 10% at each step.
2. **Queue vs handover share** – the part fixable without new resources.
3. **Equality comparisons** on aggregated data – age, language, distance to a cancer centre, living alone.
4. **Impact model** – "If county X cut handover delays by N days, M more patients would start treatment within target."
5. **Coordinator workload** – exceptions per 1,000 patients (the business case).
6. **Link to outcomes (later)** – combined with registry data: stage at diagnosis vs length of wait.

---

## 7. Recommendations (three levels)

**1. Patient – offer Rinnalla to everyone with a suspected cancer.**

- Pilot in one wellbeing services county for one cancer (lung), under roadmap action 3.5.3 (limited pilots 2026–28).
- It is the named coordinator's tool (1.2.3) and puts patient-experience and wellbeing measures into practice (1.2.2, 3.3.1).

**2. County – fix the slowest handover first.**

- The county view shows which step stalls longest; the AI drafts a board proposal with three actions, e.g. "results delivered within 3 working days with a named owner per unit", "every referral confirmed to the patient within 48 hours".
- Review monthly against pathway target times (3.1.2) and benchmark against other counties (3.2.2).

**3. National – standardise about 8 timestamps from first suspicion to treatment start.**

- Extend THL waiting-time monitoring (guidance 21/2016) to start at the first suspicion, not when the referral arrives.
- Include the timestamps in the national indicators (3.1.4), the quality register (3.2.1) and the structured data model (4.1.1).
- Cheap, concrete, and makes waiting measurable the same way everywhere.

---

## 8. Who benefits

| Who | What they get |
|---|---|
| Patient | Knows what is happening; doesn't chase results or fight to be heard |
| Relative | Kept informed; fewer anxious calls |
| Nurses and coordinators | Fewer "where's my result?" calls; time goes to those who need it |
| Doctors | Patients arrive prepared (G8 and basics done) |
| Wellbeing services county | Fewer stalled handovers, missed appointments and repeated tests; better patient-experience scores |
| Finland | First comparable data on the whole pathway from first suspicion |
| Research | Patients can choose to donate data, with consent controls |

---

## 9. Fit to Goal 3 and judging criteria

Rinnalla covers Goal 3 through two headline indicators – **access to treatment within target times** and **regional/socioeconomic differences used to steer services** – with lung cancer survival as the impact measure.

| Criterion | How Rinnalla scores |
|---|---|
| Actionability (30%) | A service, county actions and a national data standard, each tied to a roadmap action number |
| Insight (25%) | The wait is mostly handovers and the clock starts too late; located step by step and by county |
| Data quality (20%) | Real registry baseline; synthetic pilot data clearly labelled; every figure sourced and checked by a second agent |
| Execution (15%) | A live phone call; the stalled handover appears in the coordinator and county views |
| Clarity (10%) | One person, one call, one map, in two minutes |

---

## 10. Two-minute demo script

1. **Problem (20 s).** "For lung cancer, about five months from symptoms to treatment. The official clock starts only at the referral; nobody measures the wait before that."
2. **Maija, 72 (40 s).** Her scan result has been ready for 9 days; nobody has told her. She doesn't call because she doesn't want to be a nuisance. Rinnalla calls her **live on speakerphone in Finnish** (a teammate plays Maija), introduces itself as an AI and asks two questions.
3. **Coordinator (15 s).** Maija appears first on today's list, with a three-line summary and an AI-drafted message to the imaging unit awaiting approval.
4. **Language (10 s).** Her neighbour Fatima, 68, gets the same call in Arabic.
5. **County (20 s).** Which step stalls longest, with real registry baseline beside synthetic pilot data.
6. **Recommendations (15 s).** County board proposal + national timestamp standard. Close with the closing line.

---

## 11. Build plan (weekend)

### 11.1 Scope

- One cancer type: **lung**.
- About **200 synthetic patients** across **three demo counties**, with one deliberate delay hotspot (results not delivered) that the county analysis should find.
- Rules engine with a maximum time per step (placeholder limits, e.g. informed by Nordic pathway times – confirm with mentors; label them as pilot rules).
- AI phone agent + text messages.
- Coordinator list and county analysis (UI documented separately).
- Real-data baseline from public sources.

### 11.2 Suggested technical architecture

- **Telephony & SMS:** a telephony API (e.g. Twilio or similar) for outbound calls and texts.
- **Voice:** speech-to-text + text-to-speech with good Finnish (test ElevenLabs and alternatives tonight), or a realtime voice model.
- **Language model:** for conversation, structuring replies, summaries, drafts and reports (Claude, Gemini or Nemotron; check side-challenge rules).
- **Rules engine:** deterministic code; decides when a step is stalled and who is on today's list. The LLM never decides.
- **Data store:** SQLite or Postgres.
- **Analytics:** Python (pandas) for step splits, queue vs handover, county comparison, impact model.
- **Verifier agent:** a second LLM pass that checks every figure in reports against its source table/link.

### 11.3 Minimal data model

- `Patient` – id, age, county, language, preferred channel, relative (consented y/n), consent status
- `PathwayStep` – patient_id, step type (suspicion, test, result_delivered, referral_sent, referral_received, specialist_visit, mdt_decision, treatment_start), started_at, completed_at, max_days (pilot rule)
- `Contact` – patient_id, channel (sms/call/letter/relative/human), timestamp, outcome, transcript, extracted fields
- `Flag` – patient_id, reason (stalled_step, worry_raised, no_answer), created_at, status, owner
- `Wellbeing` – patient_id, timestamp, EQ-5D-5L answers, G8 score (age 70+)

**Proposed national timestamp standard (~8 points):** first suspicion · first test ordered · result available · result delivered to patient · referral sent · referral received · treatment decision (MDT) · treatment start. Plus: symptom onset (patient-reported) and number of visits before referral.

### 11.4 Team split

| Person | Owns |
|---|---|
| 1 | Phone agent: telephony, voice, LLM prompts, Finnish + one other language |
| 2 | Data model, synthetic patient generator, rules engine |
| 3 | Coordinator and county views, demo flow |
| 4 | Real-data analysis, sources, mentor interviews, pitch deck and script |

### 11.5 Tonight's checklist

- [ ] Ask AstraZeneca mentors which pathway step they see as worst for lung cancer, and in which regions.
- [ ] Ask how long biomarker/molecular testing takes between diagnosis and treatment and whether it varies by region (citable mentor evidence).
- [ ] Ask what a county cancer lead would do with a one-page brief, and whether screening counts toward Goal 3.
- [ ] Ask for one concrete cost difference between early- and late-stage treatment, for the pitch.
- [ ] Check the lung cancer quality-register report gives figures by county.
- [ ] Test Finnish speech quality for the phone agent.

---

## 12. Risks and fallbacks

| Risk | Fallback |
|---|---|
| Unnatural Finnish speech | Have an English version ready; say Finnish is next |
| Live demo fails | Record a backup video of the same call |
| Consent / privacy | Demo only calls teammates; all patient data synthetic; show consent step briefly; real version handles special-category health data under GDPR, data stays with the county |
| Overclaiming | Say "patients not reaching treatment within target", never "lives lost"; show assumptions on screen |
| Regulation | AI never triages or advises → stays outside medical-device rules; AI discloses itself on every call |
| Small-county noise | Show ranges; benchmark against the best quarter of counties, not the single best |
| Patient-reported dates are imperfect | Next step: validate against OmaKanta / hospital systems; registry data remains the trusted baseline |
| Scope creep | One cancer, one service, three views; everything else is a roadmap slide |

**Possible side prizes:** the phone agent may qualify for *Best Use of ElevenLabs*; using Nemotron as the LLM may qualify for *Best Use of Nemotron*. Check those challenges' rules.

---

## 13. Future extensions (roadmap slide only, not built)

- Screening stage: AI-assisted invitations in the person's language for groups with low participation (Helsinki region, foreign-born women).
- Data donation with dynamic consent; trial matching toward the national target of 10% of cancer patients in interventional trials by 2035.
- AI-supported extraction of cancer stage from free-text records (stage recorded in only 42% of cases).
- Further cancers after lung, following the 3.1.2 pathway rollout.

---

## Sources

- National Cancer Strategy 2026–2035: https://files.hackjunction.app/resources/Kansallinen_syopastrategia_2026_2035_FINAL.pdf
- Implementation roadmap 2026–2031: https://files.hackjunction.app/resources/Kansallinen_syopastrategia_toimeenpanon_tiekartta_2026_2031.pdf
- THL guidance 21/2016, monitoring access to cancer care: https://core.ac.uk/download/145056317.pdf
- Yle News, MOT on cancer treatment delays (155 days, no national delay data): https://yle.fi/a/74-20251023
- Patient survey, symptoms not taken seriously, visits, asking for results: https://www.verkkouutiset.fi/a/syopapotilaat-kokevat-ettei-heidan-oireitaan-oteta-vakavasti/
- Cancer Society patient survey on diagnostic delays: https://www.sttinfo.fi/tiedote/70972938/kyselyselvitys-joka-kolmas-syopapotilas-kokee-diagnoosin-viivastyneen?publisherId=69820264
- Delays in primary care as main cause (Iltalehti via Verkkouutiset): https://www.verkkouutiset.fi/a/il-hoitoon-paasyssa-viiveita-valitettavan-usein-loytyy-levinneena/
- Lung cancer quality-register report (27% curative, stage missing): https://www.verkkouutiset.fi/a/keuhkosyopa-todetaan-usein-liian-myohaan-vain-joka-neljas-saa-parantavaa-hoitoa/
- Stage recorded in 42% of cases (Syöpä 2024): https://www.verkkouutiset.fi/a/syopatiedoissa-isot-alueelliset-erot-yksi-seutu-erottuu/
- Doctor shortage, primary-care access: https://www.verkkouutiset.fi/a/tyonantajalta-karu-varoitus-laakaripula-ei-valikoi-uhrejaan/
- Rising cancer care costs, €139M strategy need: https://www.verkkouutiset.fi/a/syovan-hoidon-kulut-kasvamassa-800-miljoonalla-eurolla-naita-toimia-ehdotetaan/
- Quality register budget cut: https://www.sttinfo.fi/tiedote/72406019/sdp-pia-hiltunen-syopa-ei-odota-hoitoon-paasyn-viiveisiin-on-puututtava?lang=fi
- IHE Cancer Dashboard for Finland: https://ihe.se/?p=27106
- Ageing and cancer forecast: https://www.verkkouutiset.fi/a/syopien-maara-lisaantyy-suomessa-rajusti/
- Screening participation by county, 2024: https://www.sttinfo.fi/tiedote/72173590/kolme-aluetta-erottuu-edukseen-syopaseulonnoissa-helsingissa-osallistuminen-jaa-selvasti-jalkeen?lang=fi
- Cervical screening by country of birth: https://www.sttinfo.fi/tiedote/72484607/tutkimus-kohdunkaulasyovan-seulonta-ei-tavoita-kaikkia-naisia-yhta-hyvin?publisherId=69820264
- Statistics Finland, population structure 2025: https://stat.fi/fi/julkaisu/cmg6f46k91y0e07w0qtdt6yl7
- Foreign background in the Helsinki region: https://www.verkkouutiset.fi/a/nailla-helsingin-seudun-alueilla-ulkomaalaistaustaiset-ovat-jo-enemmistona/
- Swedish cancer patient pathways (Nordic precedent): https://cancercentrum.se/syd/regional-cancer-centres/knowledge-based-healthcare/cancer-patient-pathways/
