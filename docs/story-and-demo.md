# Story and demo

What the audience should feel, and how each demo, the video and the stage pitch produce it. What to build for it is in `build-plan.md`.

## One hero

The pitch has six good ideas competing for the lead: sovereign ontology, phone first, deterministic engine, clocks, county cockpit, Finland vs the Nordics. A reviewer with 3 minutes remembers one.

| Level | What | Where it shows |
|---|---|---|
| **Hero** | The clock. Someone is finally counting the days. | Every surface, every sentence |
| **Proof** | The live call. You speak, the system makes a promise with a deadline. | Table demo, video centre |
| **Reason to trust** | The AI does almost nothing. Rules decide, a nurse confirms. | The 112 moment, the "Why?" trace |
| **Reason to buy** | The county map that is blank today fills in. | Cockpit, AstraZeneca judging |
| **How** | Sovereign ontology: pathway as code, cited, EU-hosted. | One beat for stage and tech judges, not the opener |

"Sovereign ontology" is the answer to "how?", not the first thing we say.

## Emotional core

**The enemy is not cancer. It is silence:** waiting without knowing whether anything is happening, and nobody counting.

Three feelings, in this order:

1. **Recognition.** Everyone has a parent or grandparent who "doesn't want to be a bother" (*en viitsi vaivata*). Finns don't complain, so the system has to count for them.
2. **Relief.** A calm voice says a sentence with a deadline in it. A clock starts. Somebody owns the wait.
3. **Indignation, aimed at the system.** Same disease, same country, different promise depending on your address. And nobody can measure it.

Humour is aimed at bureaucracy and the Nordic rivalry, never at illness.

| | Choice | Why |
|---|---|---|
| Sentence | **"A nurse will call you by Sunday 21:47."** | The product is making that sentence and then making it true. Specific, human, checkable. |
| Number | **155 days** from first symptom to treatment in lung cancer (Yle MOT) | More visceral than percentage points. **Unverified, see "Facts to check".** Fallback: the strategy's +14 points. |
| Image | **A map of Finland with no data on it** | True today (no public per-county access times). Then it fills in. |

Lines worth keeping:

- "The AI listens. The rules decide. The nurse confirms. The clock keeps everyone honest."
- "The official clock starts at the referral. Ours starts at the first phone call."
- "Finns don't complain. So the system has to count for them."
- "The most important thing our AI does is nothing."
- "The strategy says pathways by 2028. We built one by Sunday."
- "Your call just became a data point Finland doesn't have."

### Clocks are promises

"Clock" is the mechanism, "promise" is what a person feels. Each step is a promise with a deadline, kept or broken.

- Pirkanmaa promises a CT in about a week. Keski-Suomi promises a specialist in about a month. **Nobody checks either.**
- Nurse screen: "Promise kept, 2 h 14 min early."
- Cockpit: "Promises kept: 61 %" per county and step.

Tagline: **"Every cancer pathway, on the clock."**

## Matti

**Matti, 71, Keski-Suomi, former smoker, lives alone. Coughing for seven weeks. Hasn't called because he doesn't want to be a bother.**

- Matches SE-M1 (over 40, ex-smoker, 6 weeks).
- His age makes phone-first obvious without arguing for it.
- Keski-Suomi is the county with the "about a month" promise, so the story and the data point at the same place.

Best possible video asset: **a real older Finnish voice** playing Matti, in Finnish with English subtitles, labelled as acted. Only if the agent handles Finnish cleanly; otherwise English with a teammate.

## Wow moments

| # | Moment | Feeling | Priority |
|---|---|---|---|
| 1 | **Your own words become objects.** The caller's sentence appears on screen and snaps into a typed symptom with their quote attached. | "It heard me" | Must |
| 2 | **Voice and screen in sync.** The agent says "by Sunday 21:47" and at that second a countdown starts on screen, ticking in seconds. | Relief | Must |
| 3 | **The 112 moment.** "I'm coughing up a lot of blood." Screen goes red, the agent says call 112. "That was not the model. That is a rule the model cannot override." | Trust | Must |
| 4 | **"Try to break it."** A card: *make it diagnose you*. It refuses every time, and the eval table shows it. | Fun, respect | Must |
| 5 | **The blank map fills in.** Cockpit opens on "Finland today: not measured" (real). Toggle to Polku: tiles fill with promises kept per county (synthetic). The call just made bumps Keski-Suomi by one. | Indignation, then "oh" | Must |
| 6 | **Time machine.** "+1 day": a promise breaks, the tile turns, an escalation appears on the nurse screen. | The clock has teeth | Should |
| 7 | **"Why?" trace.** One click walks Matti's sentence → symptom → criterion → Swedish source → step → clock → county. | Not a black box | Should |
| 8 | **Postcode lottery.** Same Matti in three lanes: Pirkanmaa, Keski-Suomi, Sweden. Published promises only. | Indignation | Should, as a deck graphic, not app code |

The near-miss matters too: Aino, 34, with a week-long cough after a cold gets "this doesn't match, here is ordinary advice". It shows we don't flood nurses, the first objection anyone in healthcare raises.

## Three audiences

| Audience | Time | They score | Lead with | Close with |
|---|---|---|---|---|
| Peer reviewers (hackers) | ~3 min at the table, noisy | Innovation, impact, implementation | The phone. "Call it. You're Matti." | "Try to break it." Then the blank map. |
| AstraZeneca (marketing and business) | Sun 14:00 | Actionability 30, insight 25, data 20, execution 15, clarity 10 | The blank map and the unmeasurable indicator | A one-page county pilot and an ask |
| Stage judges (if top 5) | 3 min + 3 min Q&A | Theme tiebreak: idealism and caution | 20 s of Matti, then the live call | "Pathways by 2028. We built one by Sunday." |

### Peer review table

Setup: big screen in stage mode, a phone or headset, three role cards, one "try to break it" card, QR for the web call.

| Time | What |
|---|---|
| 0:00 | "Lung cancer in Finland: about 155 days from first symptom to treatment. Nobody counts them. Pick a card and call." |
| 0:10 | Reviewer calls as Matti. Screen shows identity, then their words turning into symptoms. |
| 1:10 | Agent speaks the promise. Countdown starts. "That deadline is now someone's job." |
| 1:20 | Nurse screen: confirm. Pathway steps appear, each with its own promise. |
| 1:40 | Cockpit: blank map (real), filled map (synthetic), Keski-Suomi +1, the one recommendation. |
| 2:20 | "The AI only did one thing: turn your sentence into a typed object. Want to try to make it diagnose you?" |

| Role card | Says | Outcome |
|---|---|---|
| Matti, 71 | Cough for seven weeks, used to smoke | Fast-track match, nurse callback promise |
| Aino, 34 | Cough for a week after a cold, never smoked | No match, ordinary advice |
| Red flag | Coughing up a lot of blood right now | Call 112, engine-enforced |

The venue is loud. The live transcript in large type is what lets bystanders follow. Fallback if audio fails: the Simulate buttons play the same three cards.

### AstraZeneca: sell the Monday morning

Their brief says the recommendation is the most important part, and they want a follow-up with a county. End on something a county can say yes to.

- **The cockpit's first line is one sentence**, e.g. "Keski-Suomi: the wait is in the first specialist visit. Median 24 days against a 5-day target (synthetic)."
- **One recommendation card**, rule-triggered, tied to a roadmap measure, with simulated effect: "Direct CT route from primary care (measure 2.5.2). Simulated: 9 days saved."
- **A printed one-page pilot:** one county, one phone number, one nurse, 90 days, what gets measured, which roadmap measures it implements (2.5.2, 3.1.2, 3.5.3), what it needs from the county.
- **The ask, out loud:** "Introduce us to one wellbeing county."
- Use their verbs in order: identify, locate, recommend.
- Tell mentor Kaisa Kaitila the blank-map insight on Saturday. If she confirms it, quote her.

### Stage: 3 minutes

| Time | Beat |
|---|---|
| 0:00 | "Matti is 71. He has been coughing for seven weeks. He hasn't called anyone, because he doesn't want to be a bother." |
| 0:20 | "In Finland it takes about 155 days from that first cough to treatment. Nobody is counting them. So we built something that counts." |
| 0:35 | Live call, 75 s. Presenter plays Matti. Screen shows words → symptoms → promise → countdown. |
| 1:50 | "The AI listened. A rule decided, and here is the source. A nurse confirms." Nurse click. One sentence on the red-flag rule. |
| 2:10 | Blank map → filled map. "This is the indicator the national strategy asks for and cannot measure." |
| 2:35 | "The pathway is code: typed, cited, open, running in Europe. We call it a sovereign ontology. Lung is one file. The next cancer is the next file." |
| 2:50 | "Finland's strategy says pathways by 2028. We built one by Sunday. Polku: every cancer pathway, on the clock." |

Backup: the recorded call, queued. If the live call stalls for 5 seconds, play it. Stage audio: presenter's phone on speaker into the handheld mic, or a laptop web call into the PA. Test at the venue Saturday. Rehearse Saturday night; there's no rehearsal on Sunday.

## Video (2:00 hard cap)

Open inside the story, not on statistics. One device runs through the whole film: **a day counter in the corner.**

| Time | Picture | Sound | Counter |
|---|---|---|---|
| 0:00-0:12 | Black, or a kitchen table, a phone, a hand | A cough. Matti (Finnish): "It's probably nothing. I don't want to bother anyone." | Day 49 |
| 0:12-0:22 | Text on black: "In Finland, about 155 days pass from the first symptom of lung cancer to treatment. Nobody counts them." | Quiet | Day 49 |
| 0:22-0:30 | He dials. "Polku" on the phone screen. | Ring, agent answers, says it is an AI | Day 49 |
| 0:30-1:05 | The real call, split screen: phone left, Screening right. Words become symptoms. Criterion matched, one source line. | Call audio, subtitles | Day 49 |
| 1:05-1:12 | **Hold on the promise.** "A nurse will call you by Sunday 21:47." Countdown starts. 2 seconds of silence. | Call audio, then silence | Flips to the countdown |
| 1:12-1:25 | Nurse confirms. Steps unfold, each with a deadline. "Promise kept." | VO: "A nurse decides. Every step after that is a promise with a deadline." | |
| 1:25-1:32 | Hard cut: red screen, "Call 112". | VO: "The AI never decides. Some rules it cannot override." | |
| 1:32-1:48 | Blank map, "not measured" (real). It fills (synthetic). One tile ticks. Recommendation card. | VO: "Today Finland cannot measure this per county. With Polku it is a by-product of care." | |
| 1:48-1:55 | Pathway-as-code flash, "open · cited · runs in Europe" | VO: "One typed, cited definition per cancer. A sovereign ontology." | |
| 1:55-2:00 | Logo. "Every cancer pathway, on the clock." | VO: "By 2028, says the strategy. We built one this weekend." | |

Rules:

- Record the call as one continuous take, screen and audio, against the deployed URL. Do it twice, keep the clean one. A cut inside the call kills the "it's real" effect.
- Subtitles burned in. Most viewers watch muted, and the call may be in Finnish.
- No VO over the 2 seconds of silence after the promise. That's the emotional peak.
- "Synthetic" label visible on the filled map. It reads as integrity.
- Target 1:55. Tools: OBS to capture, Kdenlive or DaVinci Resolve to edit. VO in your own voice or ElevenLabs.

## Facts to check before they go on a slide

| Claim | Problem | Action |
|---|---|---|
| "155 days from symptom to treatment" | From Yle MOT (https://yle.fi/a/74-20251023), not opened by us | Confirm number, year and definition. If it holds, it's the hero number. |
| "Sweden is 14 points ahead" | **Wrong.** 14 pp is the strategy's target gain to reach the Nordic level (mean of Sweden and Norway, Nordcan 2023). Our verified figures show about 8-10 points against Norway; Sweden's values are unverified. | Say "the strategy says Finland must gain 14 points to reach the Nordic level" and cite p.5. |
| "Most lung cancer patients are old" | No sourced number yet | Export share aged 65+ and median age from the Syöpärekisteri app. Put it on the phone-first slide. |
| 155 days vs Sweden's 40-44 days | Different start points (first symptom vs well-founded suspicion) | Never show them side by side as like for like. |
| "Processed in the EU" | ElevenLabs on our tier routes voice through the US | Reasoning model in the EU (once Gemma on Verda works), voice layer swappable. Say it before someone asks. |

## Q&A

| Question | Answer |
|---|---|
| Isn't this a medical device? | As a product, yes, it would need conformity assessment. That's why the AI only transcribes into typed symptoms, the criteria are published ones, and a nurse makes every decision. |
| What if the model mishears? | The nurse sees the caller's exact words next to every symptom. The agent asks again until duration and smoking status are clear. Red flags are a rule the model can't override. Eval: N/N. |
| Won't this flood nurses? | The criteria are the ones Sweden already uses to filter. Near-misses get ordinary advice (show Aino). A structured case takes less nurse time than a cold callback. |
| Why would a county buy it? | They already run a phone line and a callback queue. This is a better phone line, and it produces the Goal 3 indicator they'll be asked to report. Measure 3.5.3 has a pilot budget. |
| Why Swedish criteria in Finland? | Finland's own are being drafted (Filha, 05/2026). The pathway is one file. When the Finnish criteria are published, we change the file, not the product. |
| What about people who never call? | Outside this MVP. But Polku records symptom onset for everyone who does call, the first data anyone will have on the delay before first contact. |

## Open decisions

1. Hero number: 155 days (if verified) or the strategy's 14 points. Recommendation: 155 days for peers and video, 14 points on the AstraZeneca slide that maps to the strategy.
2. Call language in the video: Finnish with subtitles if the agent handles it cleanly, else English.
