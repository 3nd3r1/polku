# Lung pathway: sources, criteria, clocks, public data

Researched Fri 13.11.2026. Every number has a URL. "Not verified" means we could not open the primary source. `src/pathways/lung.ts` encodes a subset of this.

## Source list (short names used below)

| Short | Document | URL | Status |
|---|---|---|---|
| SE-SVF | RCC i samverkan, *Standardiserat vårdförlopp lungcancer*, v1.4, 2024-11-05 | https://kunskapsbanken.cancercentrum.se/diagnoser/lungcancer/vardforlopp/ (PDF: https://kunskapsbanken.cancercentrum.se/globalassets/cancerdiagnoser/lunga-och-lungsack/vardforlopp/svf-lungcancer.pdf) | Read directly |
| NO-PF | Helsedirektoratet, *Pakkeforløp for lungekreft*, last professional change 03.07.2026 | Times: https://www.helsedirektoratet.no/nasjonale-forlop/lungekreft/forlopstider-i-pakkeforlop-for-lungekreft · Entry: https://www.helsedirektoratet.no/nasjonale-forlop/lungekreft/inngang-til-pakkeforlop-for-lungekreft | Read directly |
| DK-SST | Sundhedsstyrelsen, *Pakkeforløb for lungekræft, for fagfolk* (2018 text, file dated jan 2025) | https://www.sst.dk/media/estk2oo1/pakkeforloeb-for-lungekraeft-jan-2025.pdf | **Not opened** (sst.dk blocks automated fetch). Numbers from search-engine extracts of this PDF and the 2018 patient leaflet https://www.sst.dk/media/e4znbwta/patientpjece-lungekraeft-2018.pdf |
| DK-SYD | sundhed.dk, Region Syddanmark GP guidance "Lungecancer" (updated 21.04.2021) | https://www.sundhed.dk/sundhedsfaglig/information-til-praksis/syddanmark/almen-praksis/patientbehandling/patientforloeb/kraeftpakker/lungecancer/ | Read directly |
| DK-HOV | sundhed.dk, Region Hovedstaden GP guidance "Lungekræft" (updated 23.03.2022) | https://www.sundhed.dk/sundhedsfaglig/information-til-praksis/hovedstaden/almen-praksis/patientbehandling/patientforloeb/forloebsbeskrivelser-icpc/r-luftveje/lungekraeft/ | Read directly |
| FI-THL | THL Ohjaus 21/2016, *Hoitoonpääsyn seuranta syövän hoidossa*, valid from 1.1.2017 (Julkari file is now labelled "Vanhentunut", 2025 annexes exist) | https://www.julkari.fi/items/0424a55a-f159-406f-8883-5dfdad4d6772 | Read directly |
| FI-FILHA | Filha ry, *Valtakunnallinen keuhkosyöpäohjelma 2026-2035*, preprint 18.05.2026 | https://www.filha.fi/wp-content/uploads/2026/05/Valtakunnallinen-keuhkosyopaohjelma-2026-2035_180526_preprint.pdf | Read directly |
| FI-KH | Käypä hoito *Keuhkosyöpä* (2017) | https://www.kaypahoito.fi/hoi06050 | **Returns 404 on 13.11.2026.** Content not verified. Filha cites it as the 2017 edition |
| FI-PIRHA | Pirkanmaan hyvinvointialue, "Keuhkosyöpäpotilaan hoitopolku" (updated 19.8.2026) | https://www.pirha.fi/asiakkaalle/hoito-ja-palvelupolut/keuhkosyopapotilaan-hoitopolku | Read directly |
| FI-KS | Keski-Suomen hyvinvointialue, "Keuhkosyöpäpotilaan hoitopolku" | https://www.hyvaks.fi/asiakkaana/hoitopolut/keuhkosyopapotilaan-hoitopolku | Read directly |
| FI-KYS | KYS (Pohjois-Savo), "Keuhkosyöpäpotilaan hoitoketju" (slide PDF, date not verified) | https://syovanhoitokeskus.pshyvinvointialue.fi/documents/268336/269724/KYS+Keuhkosy%C3%B6p%C3%A4potilaan+hoitoketju.pdf/547c35a2-5382-68b4-5bac-afcff530959d | Read directly |

## Step targets

Calendar days. SVF is used as the backbone because it is the only one with a clock on every sub-step. DK and NO are shown for cross-checking. Clock start points differ by country (see caveats).

| # | Polku step | Clock: start → stop | Proposed `maxDays` | SE-SVF | DK-SST | NO-PF | Finland | Chosen source |
|---|---|---|---|---|---|---|---|---|
| 0 | Nurse callback | SymptomReport submitted → callback logged | **configurable, not sourced** | not defined | not defined | not defined | Not defined. Nearest precedent: Pirha handles lung referrals in "1-2 arkipäivän sisällä" | Polku design choice, label it as such |
| 1 | Primary-care assessment + imaging (filter function) | Referral decision on suspicion → decision on well-founded suspicion | **10** (1+5+1+3) | Remissbeslut → remissankomst 1; → lungröntgen/DT 5; → svar till remittenten 1; → beslut om välgrundad misstanke 3 | National not verified. Regional: CT "indenfor 7 kalenderdage efter at henvisningen er modtaget" (DK-HOV); "maksimalt inden for 14 dage, jf. ventetidsgaranti" (DK-SYD) | CT "tas uten opphold", no number | THL: radiologist statement "viikon kuluessa tutkimuspyynnön tekemisestä" (all cancers) | SE-SVF |
| 2 | Referral to specialist | Well-founded suspicion decided → referral received and assessed | **2** (1+1) | → remiss mottagen 1; → remiss bedömd (block A) 1 | inside the 6 days of step 3 | inside the 7 days of step 3 | Pirha: referral processed in 1-2 working days | SE-SVF |
| 3 | First specialist visit | Referral assessed → first visit | **5** | 5 | Referral received → first visit: **6** | Referral received → first visit: **7** | Keski-Suomi: visit "noin kuukauden sisällä lähetteen saapumisesta" (target 2-3 weeks) | SE-SVF |
| 4 | Diagnostics to MDT | SVF start → first MDK | **21** | 21 | First visit → completed investigation: **24** | First visit → completed investigation ("beslutning tas"): **21** | THL (all cancers): biopsy within 1 week of request, pathology statement within 1 week of biopsy | SE-SVF (NO agrees) |
| 5 | MDT decision | MDK → treatment decision | **2** | 2 | not separated | not separated | KYS: MDT meets weekly | SE-SVF |
| 6 | Treatment start | Treatment decision → first treatment | **surgery 14, radiotherapy 14, drug 10, palliative 0** | as proposed | Completed investigation → start: surgery 14, medical 11, radiotherapy 15 | Completed investigation → start: surgery 14, drug 7, radiotherapy 14 | none for lung | SE-SVF |
| Σ | Total (follow-up metric) | see column | **SE: 44 surgery/RT, 40 drug, 30 palliative** from well-founded suspicion | 40 / 44 / 30, 80 % of patients within | From referral received: surgery 44, medical 41, RT 45 | From referral received: surgery 42, drug 35, RT 42 | THL general rule: "maksimiaika lähetteen saapumisesta ensimmäiseen hoitoon ... on 6 viikkoa" (42 d) | Show SE total; show FI 42 d as the only Finnish number |

Notes:
- SVF's sub-step times are "rekommenderade"; only the totals (40/44/30) are followed up nationally, with the goal "80 % av de patienter som utreds i ett SVF ska utredas inom ledtiderna."
- NO times are "normerende", not legal limits.
- DK numbers come from search-engine text of the sst.dk PDF (6 + 24 + 14/11/15 adds up to the stated 44/41/45, and the KORA report also quotes "41-45 dage"). Treat as **partially verified**.
- The only Finnish target number is the generic THL 6-week rule (origin: STM working group, STM Selvityksiä 6/2010). It happens to equal NO's 42 days for surgery/RT, which is a good talking point.

## Criteria

Two levels, as in all Nordic pathways: **suspicion** (send to imaging, a GP/nurse action) and **well-founded suspicion** (enter the fast-track pathway, a clinician action, usually needs imaging). Polku's patient front door can only ever reach the suspicion level, except SE-V3 (repeated haemoptysis), which is symptom-only.

| ID | Plain-language rule | Structured form | Source quote (original) | English gloss | URL |
|---|---|---|---|---|---|
| SE-M1 | New cough or breathlessness lasting 6 weeks in a current or former smoker over 40 | `any(COUGH_NEW, DYSPNOEA_NEW) && durationDays >= 42 && age > 40 && smoking in {current, former}` → suspicion | "nytillkomna luftvägssymtom (t.ex. hosta eller andnöd) med en varaktighet av 6 veckor hos rökare eller före detta rökare över 40 år" | New airway symptoms (e.g. cough, breathlessness) lasting 6 weeks in smokers or ex-smokers over 40 | SE-SVF |
| SE-M2 | Chest or shoulder pain with no other explanation | `any(CHEST_PAIN, SHOULDER_PAIN) && unexplained` → suspicion | "bröst- eller skuldersmärta utan annan förklaring" | Chest or shoulder pain without other explanation | SE-SVF |
| SE-M3 | Any bloody cough | `HAEMOPTYSIS` → suspicion | "blodig hosta" | Bloody cough | SE-SVF |
| SE-V1 | Imaging suggests lung cancer | `IMAGING_SUSPECT_LUNG_CA` → well-founded | "fynd vid bilddiagnostik som ger misstanke om lungcancer" | Imaging finding suggesting lung cancer | SE-SVF |
| SE-V2 | Metastasis suggests lung cancer | `METASTASIS_SUSPECT_LUNG_ORIGIN` → well-founded | "metastasfynd som ger misstanke om lungcancer" | Metastasis finding suggesting lung cancer | SE-SVF |
| SE-V3 | Repeated haemoptysis with no other obvious cause, even with a normal X-ray | `HAEMOPTYSIS_REPEATED && unexplained` → well-founded (no imaging needed) | "upprepad blodig hosta utan annan uppenbar orsak, även vid normal röntgen" | Repeated bloody cough without other obvious cause, even with normal X-ray | SE-SVF |
| SE-V4 | Superior vena cava obstruction | `SVC_OBSTRUCTION` (clinician-entered) → well-founded | "obstruktion av vena cava superior" | SVC obstruction | SE-SVF |
| SE-V5 | Recurrent laryngeal nerve palsy | `RECURRENT_NERVE_PALSY` (clinician-entered) → well-founded | "recurrenspares" | Recurrent nerve palsy | SE-SVF |
| SE-X1 | Unclear X-ray finding with low suspicion does NOT qualify | `IMAGING_UNCLEAR_LOW_SUSPICION` → not well-founded (order CT) | "Oklart fynd vid lungröntgen och låg malignitetsmisstanke ska inte betraktas som välgrundad misstanke." | Unclear X-ray, low suspicion is not well-founded | SE-SVF |
| DK-1 | Cough over 4-6 weeks in a previously lung-healthy person, in people over 40 (esp. smokers) | `COUGH_NEW && durationDays >= 28..42 && age > 40` (smoking weights, not required) → suspicion | "Diagnosen lungecancer skal overvejes hos personer over 40 år, specielt tidligere eller nuværende rygere, med uforklarlige luftvejssymptomer." + "Hoste af mere end 4-6 ugers varighed hos tidligere lungerask person" | Consider lung cancer in over-40s, especially smokers, with unexplained airway symptoms; cough over 4-6 weeks in a previously lung-healthy person | DK-SYD (same wording DK-HOV) |
| DK-2 | Changed cough pattern in chronic bronchitis | `COUGH_CHANGED && CHRONIC_BRONCHITIS_OR_COPD` → suspicion | "Ændring i hostemønster hos person med kronisk bronkitis" | Change in cough pattern in chronic bronchitis | DK-SYD |
| DK-3 | New breathlessness with abnormal spirometry, no other explanation | `DYSPNOEA_NEW && ABNORMAL_SPIROMETRY && unexplained` → suspicion (needs GP test) | "Nytilkommet åndenød med abnorm spirometri uden anden oplagt forklaring derpå" | New dyspnoea with abnormal spirometry, no obvious other explanation | DK-SYD |
| DK-4 | Haemoptysis at any age, smoker or not | `HAEMOPTYSIS` (no age/smoking condition) → suspicion | "Hæmoptyse uanset alder og tobaksanamnese" | Haemoptysis regardless of age and smoking history | DK-SYD, DK-HOV |
| DK-5 | Stridor of unknown cause | `STRIDOR && unexplained` → suspicion | "Stridor af ukendt årsag bør, ud over nævnte CT-scanning, føre til spirometri og laryngo-bronkoskopi" | Unexplained stridor: CT plus spirometry and laryngo-bronchoscopy | DK-SYD |
| DK-6 | General symptoms (supporting, not stand-alone) | `any(FATIGUE, APPETITE_LOSS, WEIGHT_LOSS_UNEXPLAINED, THROMBOCYTOSIS)` → raises weight of other criteria | "Almen symptomer i form af træthed, manglende appetit, vægttab, trombocytose" | General symptoms: fatigue, poor appetite, weight loss, thrombocytosis | DK-SYD |
| DK-7 | Hoarseness over 3-4 weeks alone: ENT first | `HOARSENESS && durationDays >= 21..28 && no other symptoms` → route to ENT (larynx pathway), not lung | "Hæshed i mere end 3-4 uger uden andre ledsagesymptomer ... bør primært undersøges af speciallæge i øre-næse-halssygdomme" | Isolated hoarseness over 3-4 weeks: ENT first | DK-SYD |
| DK-B | Well-founded suspicion = suspicious infiltrate on imaging or clinical manifestation | `IMAGING_SUSPECT_LUNG_CA` → well-founded | "Begrundet mistanke er et suspekt infiltrat fundet ved billeddiagnostisk undersøgelse eller klinisk manifestation" | Well-founded suspicion is a suspicious infiltrate on imaging or a clinical manifestation | DK-SYD |
| NO-M1 | Haemoptysis, or new/changed lung symptoms that last longer than usual (e.g. after infection) | `HAEMOPTYSIS \|\| (any(COUGH_NEW, COUGH_CHANGED, DYSPNOEA_NEW) && persistsBeyondInfection)` → suspicion. No week threshold given | "symptomer som hemoptyse samt nyoppståtte eller endrede symptomer fra lungene som vedvarer utover det som er vanlig ved for eksempel infeksjoner, bør gi mistanke om lungekreft" | Haemoptysis and new/changed lung symptoms persisting beyond the usual (e.g. infections) should raise suspicion | NO-PF (Mistanke) |
| NO-R | Risk group: smokers and ex-smokers over 40 (also radon, occupational exposure) | `age > 40 && smoking in {current, former}`; `RADON_EXPOSURE`, `OCCUPATIONAL_EXPOSURE` as risk flags | "Røykere og tidligere røykere i aldersgruppen over 40 år" | Smokers and ex-smokers over 40 | NO-PF (Risikogrupper) |
| NO-F | Filter: CT thorax without delay on clinical suspicion, even if X-ray is normal | action rule, not a matcher | "CT toraks, (ev. røntgen toraks front og side) tas uten opphold ved klinisk mistanke om lungekreft ... selv om ev. rtg toraks er normalt" | CT without delay on clinical suspicion even if X-ray normal | NO-PF (Filterfunksjon) |
| NO-B | Well-founded suspicion: radiology malignancy-suspect, or biopsy elsewhere suggests lung origin | `IMAGING_SUSPECT_LUNG_CA \|\| METASTASIS_SUSPECT_LUNG_ORIGIN` → well-founded | "radiologi viser malignitetssuspekt forandring i lunge eller en biopsi tatt fra annet organ viser kreft som tyder på origo i lunge" | Radiology shows malignancy-suspect lung change or biopsy from another organ suggests lung origin | NO-PF (Begrunnet mistanke) |
| FI-P1 | Patient advice: see a doctor for blood in sputum, unexplained weight loss, or cough/breathlessness/chest or shoulder pain/hoarseness over 3 weeks | `HAEMOPTYSIS \|\| WEIGHT_LOSS_UNEXPLAINED \|\| (any(COUGH_NEW, COUGH_WORSENING, DYSPNOEA_NEW, CHEST_PAIN, SHOULDER_PAIN, HOARSENESS) && durationDays > 21)` → "book GP" (patient-facing, not a referral criterion) | "verta ysköksessä · selittämätön painon lasku · yskä tai yskän paheneminen yli kolmen viikon ajan · hengenahdistus yli kolmen viikon ajan · rintakehän tai hartian kipu yli kolmen viikon ajan · äänen käheys yli kolmen viikon ajan · vähentynyt ruokahalu · uupumus ja epätavallinen vointi" | Blood in sputum; unexplained weight loss; cough or worsening cough, breathlessness, chest/shoulder pain, hoarseness for over 3 weeks; reduced appetite; fatigue | FI-PIRHA |
| FI-P2 | Recurrent pneumonia in the same lung is common in lung cancer (informational) | `PNEUMONIA_RECURRENT_SAME_LUNG` → supporting | "Toistuvasti samaan keuhkoon tuleva keuhkokuume on keuhkosyövässä yleinen ilmiö." | Recurrent pneumonia in the same lung is common | FI-PIRHA |
| FI-K1 | Prolonged unexplained symptoms warrant pulmonologist review even with a clean X-ray | `persistentSymptoms && unexplained && XRAY_NORMAL` → referral | "pitkittyvät oireet, joille ei selkeää selittävää syytä, vaikka keuhkokuva olisi siisti, ovat aihe keuhkolääkärin arviolle" | Prolonged unexplained symptoms need pulmonologist review even if the X-ray is clean | FI-KYS |
| FI-K2 | SVC compression symptoms: fast, near-emergency review | `SVC_OBSTRUCTION` → urgent | "Nopeaa, jopa päivystysluonteista hoitoarviota tarvitaan, mikäli potilaalla on vena cava -kompressio-oireisto." | Rapid, even emergency, review if SVC compression symptoms | FI-KYS |

Finland national criteria: **none exist**. FI-FILHA: "Valtakunnallisesti ei ole ollut tarkkaa yhtenäistä ohjeistusta siitä, millä aikataululla diagnostiikan eri osa-alueet tulisi olla tehtyinä." The programme will produce "kansallinen suositus keuhkosyövän diagnostiikasta. Se sisältää myös lähetekriteerit perusterveydenhuollolle ja suositellut aikarajat erikoissairaanhoitoon eri diagnostiikan polun vaiheille." (gloss: a national diagnostics recommendation, including referral criteria for primary care and recommended time limits for each step, is being drafted).

## Symptom codes

`source` lists the criterion IDs above that use the code. Attributes on every observation: `onsetDate`, `durationDays`, `quotedSpan`, `confidence`.

| Code | Meaning | Who records | Used by |
|---|---|---|---|
| `HAEMOPTYSIS` | Blood in sputum / bloody cough, any episode | patient | SE-M3, DK-4, NO-M1, FI-P1 |
| `HAEMOPTYSIS_REPEATED` | More than one episode | patient | SE-V3 |
| `COUGH_NEW` | New cough | patient | SE-M1, DK-1, NO-M1, FI-P1 |
| `COUGH_WORSENING` | Existing cough getting worse | patient | FI-P1 |
| `COUGH_CHANGED` | Changed cough pattern (in chronic cough) | patient | DK-2, NO-M1 |
| `DYSPNOEA_NEW` | New breathlessness | patient | SE-M1, DK-3, NO-M1, FI-P1 |
| `CHEST_PAIN` | Chest pain | patient | SE-M2, FI-P1 |
| `SHOULDER_PAIN` | Shoulder pain | patient | SE-M2, FI-P1 |
| `HOARSENESS` | Hoarse voice | patient | DK-7, FI-P1 |
| `STRIDOR` | Noisy breathing (stridor) | patient/clinician | DK-5 |
| `WEIGHT_LOSS_UNEXPLAINED` | Unexplained weight loss | patient | DK-6, FI-P1 |
| `APPETITE_LOSS` | Reduced appetite | patient | DK-6, FI-P1 |
| `FATIGUE` | Fatigue, feeling unusually unwell | patient | DK-6, FI-P1 |
| `PNEUMONIA_RECURRENT_SAME_LUNG` | Repeated pneumonia, same side | patient (history) | FI-P2 |
| `SMOKER_CURRENT` | Smokes now | patient | SE-M1, NO-R |
| `SMOKER_FORMER` | Ex-smoker | patient | SE-M1, NO-R |
| `PACK_YEARS` | Smoking amount (numeric) | patient | referral content in FI-KYS ("askivuosin") |
| `OCCUPATIONAL_EXPOSURE` | Asbestos, dust, other occupational exposure | patient | NO-R, FI-KYS referral content |
| `RADON_EXPOSURE` | Long-term radon exposure | patient | NO-R |
| `CHRONIC_BRONCHITIS_OR_COPD` | Known chronic bronchitis / COPD | patient/clinician | DK-2 |
| `ABNORMAL_SPIROMETRY` | Abnormal spirometry | clinician | DK-3 |
| `THROMBOCYTOSIS` | Raised platelets | clinician | DK-6 |
| `XRAY_NORMAL` | Chest X-ray normal | clinician | SE-V3, FI-K1, NO-F |
| `IMAGING_SUSPECT_LUNG_CA` | X-ray/CT finding suspicious for lung cancer | clinician | SE-V1, DK-B, NO-B |
| `IMAGING_UNCLEAR_LOW_SUSPICION` | Unclear finding, low suspicion | clinician | SE-X1 |
| `METASTASIS_SUSPECT_LUNG_ORIGIN` | Metastasis / biopsy suggesting lung origin | clinician | SE-V2, NO-B |
| `SVC_OBSTRUCTION` | Superior vena cava obstruction | clinician | SE-V4, FI-K2 |
| `RECURRENT_NERVE_PALSY` | Recurrent laryngeal nerve palsy | clinician | SE-V5 |

Not included because no source uses them as criteria: fever, bone pain, finger clubbing, sputum, pleural effusion (DK-SYD lists some as "andre symptomer" only).

The red-flag codes `HAEMOPTYSIS_MASSIVE`, `DYSPNOEA_SEVERE` and `CHEST_PAIN_ACUTE_SEVERE` are Polku's own (see `build-plan.md`, Polku's own rules), not from any pathway.

## Public data

| Source | What it shows | Granularity | URL | Usable this weekend | Headline numbers (source, year) |
|---|---|---|---|---|---|
| Syöpärekisteri statistics app | Incidence, mortality, prevalence, survival, cumulative incidence; incidence by **stage** (`inc_stage`, incl. preliminary 2025); by education | Region selector exists. Option codes (101xx-105xx groups) look like 5 yhteistyöalue groups with hyvinvointialue members; labels are JS-rendered, **not verified** | https://tilastot.syoparekisteri.fi/syovat/ | **Yes, manually**: R Shiny app with .csv/.xlsx/.png export buttons. No documented API. Open in a browser and export | From FI-FILHA citing the registry: 2022 new lung cancers men **1 740**, women **1 207**; "keuhkosyövistä 65-70 % todetaan vasta levinneessä vaiheessa" |
| Syöpärekisteri annual report *Syöpä 2022* | Regional risk-ratio maps for lung incidence and mortality (p.54 per FI-FILHA) | Region (exact unit not verified) | https://syoparekisteri.fi/assets/files/2024/06/Syopa-2022.pdf (not opened; site has a bot challenge) | Yes, read in browser | Via FI-FILHA, 2018-2022, women: incidence risk ratio range **0.78-1.45**, mortality **0.76-1.86**; highest Helsinki region **1.42**, Lapland **1.32**. Men vary less |
| Sotkanet REST API | No lung-cancer indicator found (searched all 3 797 indicator titles). Useful: **4404** daily smokers % age 20+ (2013-2024); **5643** cancer index, age-standardised, all cancers (2017-2024); **5083** median wait for specialised care at 31.12 (2017-2022, not cancer-specific) | 4404 and 5643: hyvinvointialue (23 incl. Helsinki, Åland), YTA, kunta. 5083: sairaanhoitopiiri only | https://sotkanet.fi/rest/1.1/json?indicator=4404&years=2024&genders=total (metadata: https://sotkanet.fi/rest/1.1/indicators/4404) | **Yes**: open JSON, no key | Daily smokers 2024: national **9.1 %**; lowest Helsinki and Åland **6.8 %**; highest Satakunta and Vantaa-Kerava **12.5 %**, Kymenlaakso **12.0 %**. Cancer index 2024 (all cancers, FI=100): Kainuu **79.4**, Lapland **89.9**, Helsinki **103.4** |
| NORDCAN 2.0 | Incidence, mortality, survival, Nordic comparison | Country only, no Finnish regions | https://nordcan.iarc.who.int/en/dataviz/survival | Yes (interactive, export) | Tichanek et al., Clin Epidemiol 2023;15:503-510 (NORDCAN data), 5-yr relative survival 2016-2020: Norway men **26.6 %**, women **33.2 %**; Finland men **16.4 %**, women **25.5 %**. 1-yr: Finland men **43 %**, women **52.4 %** (others "over 50 %" / "about 60 %"). Sweden and Denmark values are in a table image, not verified. https://dovepress.com/survival-in-lung-cancer-in-the-nordic-countries-through-a-half-century-peer-reviewed-fulltext-article-CLEP |
| FI-FILHA programme | Narrative stats, regional and education gaps | National, some regional | (see source list) | Yes, quotable | 5-yr survival Finland women ~**26 %**, men ~**17 %** vs Norway **34 %** / **27 %**. Education gap in 5-yr survival: men **13 %** basic vs **18 %** higher; women **20 %** vs **30 %**. Lung cancer costs ~**120 M€/yr** (2023). Programme goal: curative treatment **+10 %**, 5-yr survival **+14 %** |
| THL cancer access monitoring (Hilmo, per FI-THL) | Defines time stamps: referral arrival, first visit, placed on waiting list, first treatment. Lung (C33-34) is in the monitored "muut syövät" list but has **no recommended max times** | n/a | (FI-THL) | **No**: we found no public report of cancer access times per hyvinvointialue or per hospital | none found |
| Hyvinvointialue pathway pages | Published local promises for lung cancer, which already differ | One county each | FI-PIRHA, FI-KS, FI-KYS | Yes, quotable | Pirha: referral processed "1-2 arkipäivän sisällä", invitation in 3-4 working days, CT "useimmiten viikon sisällä lähetteen käsittelystä". Keski-Suomi: pulmonology visit "noin kuukauden sisällä lähetteen saapumisesta", goal "2-3 viikon sisällä" |
| Denmark: Sundhedsdatastyrelsen quarterly monitoring | % of pakkeforløb within standard time, per region and cancer | Region | Search result: https://sundhedsdatastyrelsen.dk/media/16379/Monitoreringsmodel%20Organspecifik%20kraeft.pdf | Reference model only | Figures not verified |
| Sweden: RCC SVF follow-up | SVF inclusion and ledtider per region | Region | https://cancercentrum.se/download/18.7c07b08019d24db18e31c22a/1774867469204/%C3%85rsapport%20%C3%B6verenskommelse%202025%20J%C3%A4mlik%20och%20effektiv%20cancerv%C3%A5rd%20med%20kortare%20v%C3%A4ntetider_bilaga%201%20SVF.pdf | Reference model only | Lung figures not verified |

**Bottom line for the simulator:** real per-county inputs available now are lung incidence/stage/survival from the Syöpärekisteri app (manual export), smoking prevalence per hyvinvointialue (Sotkanet 4404), and population. **Per-county lung (or any cancer) access-time data is not public.** All step durations in the county view must be synthetic and labelled so. This is itself the insight: the strategy calls regional comparison "sporadic and coarse", Denmark and Sweden publish it per region every quarter/year.

## Caveats

**Where sources disagree**
- Cough duration threshold: SE **6 weeks** (smokers/ex-smokers over 40); DK **4-6 weeks** (over 40, smoking emphasised but not required); FI Pirha patient advice **over 3 weeks** (no age/smoking condition); NO **no number** ("beyond what is usual"). Polku uses SE-M1, SE-M2, SE-M3, DK-1 and DK-4 for fast track and FI-P1 as the softer "see your GP" match.
- Haemoptysis: SE splits single (suspicion) vs repeated (well-founded even with a normal X-ray); DK and NO treat any haemoptysis as suspicion regardless of age/smoking.
- Clock start: SE totals start at the **decision on well-founded suspicion**; DK and NO start at **referral received** by the investigating unit; THL's 6-week rule starts at **referral arrival**; THL's monitored intervals for breast/prostate/colorectal start at **placed on waiting list**. Totals are not directly comparable.
- Drug-treatment start: SE 10 d after decision, NO 7 d after completed investigation, DK 11 d.
- Hoarseness: DK routes isolated hoarseness to ENT first; Pirha lists it among lung symptoms; SE uses recurrent nerve palsy (clinical sign) only.

**Unverified**
- DK national times (6 / 24 / 14-11-15, totals 44-41-45) and the DK national GP entry criteria (https://www.sst.dk/media/wlmbkxos/260920-lungekraeft-oversigt-over-indgang-til-pakkeforloeb.pdf): sst.dk could not be opened. Regional sundhed.dk pages (read) match on criteria and on the 6-day start.
- Käypä hoito *Keuhkosyöpä*: the URL returns 404 today; whether it was withdrawn, moved or merged is not verified. Do not cite it for criteria.
- NO: the 2026 revision (published 03.07.2026, new times from 01.09.2026 for changed pathways). The live lung page shows the table above; whether lung times changed in that revision is not verified.
- Syöpärekisteri app region labels and stage categories: inferred from page source, not seen rendered.
- Sweden and Denmark 2016-2020 lung survival values: not verified.
- KYS hoitoketju date: not verified. Its "Lähetteen kiireellisyys R1" is quoted as-is; the meaning of R1 is not verified.

**What Finland has not defined yet**
- No national lung referral criteria, no lung-specific step targets, no standardised pathway (strategy measure 3.1.2 and 2.5.2, 2026-2028). The Filha programme (May 2026) says it will produce them.
- THL Ohjaus 21/2016 gives recommended max times only for breast, prostate and colorectal; lung is monitored but has none. The file is labelled outdated in Julkari.
- No public per-county cancer access-time reporting found.

**Framing for judges**
- All Nordic criteria are written for clinicians. A patient self-report is not a clinical finding: Polku should map patient matches to "suspicion, nurse to confirm", never to "well-founded suspicion" (SE-V3 is the only symptom-only well-founded criterion, and a nurse still confirms).
- Present Polku's lung definition as "Swedish SVF v1.4 as placeholder until Finland's own targets exist", with DK/NO shown side by side.
