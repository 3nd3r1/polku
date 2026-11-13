# Story, wow and what to build for it

Written Fri 13.11 late. Role: product/founder/marketing view over docs 09-18. This doc decides **what the audience should feel**, then steers the MVP toward it. Where it conflicts with `17-build-plan.md` on priorities, discuss and pick one.

## 1. The diagnosis: too many heroes

The current pitch has six ideas competing for the lead: sovereign ontology, phone first, deterministic engine, clocks, county cockpit, Finland vs Sweden. All are good. A reviewer with 3 minutes remembers one.

Proposed hierarchy:

| Level | What | Where it shows |
|---|---|---|
| **Hero** | The clock. Someone is finally counting the days. | Every surface, every sentence |
| **Proof** | The live call. You speak, the system makes a promise with a deadline. | Table demo, video centre |
| **Reason to trust** | The AI does almost nothing. Rules decide, a nurse confirms. | The 112 moment, the "Why?" trace |
| **Reason to buy** | The county map that is blank today fills in. | Cockpit, AZ judging |
| **How** | Sovereign ontology: pathway as code, cited, EU-hosted. | One beat for stage and tech judges, not the opener |

"Sovereign ontology" stays the named concept, but it is the answer to "how?", not the first thing we say. Nobody cries over an ontology.

## 2. The emotional core

**The enemy is not cancer. It is silence.** Waiting without knowing whether anything is happening, and nobody counting.

Three feelings to produce, in this order:

1. **Recognition.** Everyone in the room has a parent or grandparent who "doesn't want to be a bother" (*en viitsi vaivata*). Finns don't complain, so the system has to count for them.
2. **Relief.** A calm voice says a sentence with a deadline in it. A clock starts. For the first time somebody owns the wait.
3. **Indignation, aimed at the system.** Same disease, same country, different promise depending on your address. And nobody can even measure it.

Humour stays aimed at bureaucracy and Sweden, never at illness.

### One sentence, one number, one image

| | Choice | Why |
|---|---|---|
| Sentence | **"A nurse will call you by Sunday 21:47."** | The whole product is making that sentence and then making it true. It is specific, human and checkable. |
| Number | **155 days** from first symptom to treatment in lung cancer (Yle MOT, via `rinnalla-plan.md`) | More visceral than percentage points. **Must be opened and verified before use.** Fallback: 14 points. |
| Image | **A map of Finland with no data on it** | It is true today (no public per-county access times). Then it fills in. |

Lines worth keeping:

- "The AI listens. The rules decide. The nurse confirms. The clock keeps everyone honest."
- "The official clock starts at the referral. Ours starts at the first phone call."
- "Finns don't complain. So the system has to count for them."
- "The most important thing our AI does is nothing." (for a room full of AI demos)
- "The strategy says pathways by 2028. We built one by Sunday."
- "Your call just became a data point Finland doesn't have."

### Reframe: clocks are promises

"Clock" is the mechanism. "Promise" is what a person feels. Each pathway step is a promise with a deadline, and it is either kept or broken.

- Pirkanmaa promises a CT in about a week. Keski-Suomi promises a specialist in about a month. **Nobody checks either.**
- Nurse screen: "Promise kept, 2 h 14 min early."
- Cockpit: "Promises kept: 61 %" per county and step. A politician understands that without a legend.

Tagline stays **"Every cancer pathway, on the clock."** Use "promise" in the spoken story and UI copy.

## 3. Fix the hero: Matti

Matti is 58 in `16-pitch.md`, but the moat argument is "patients are old". Make them agree.

**Matti, 71, Keski-Suomi, former smoker, lives alone. Has coughed for seven weeks. Hasn't called because he doesn't want to be a bother.**

- Still matches SE-M1 (over 40, ex-smoker, 6 weeks).
- Makes phone-first obvious without arguing for it.
- Keski-Suomi is the county with the "about a month" promise, so the story and the data point at the same place.

For the video, the strongest possible asset is **a real older Finnish voice** on the call. Ask a parent or grandparent to play Matti by phone on Saturday morning, in Finnish, English subtitles. Label it as acted. An ElevenLabs voice or a 25-year-old teammate cannot fake that, and it proves the "works for old people" claim on camera. Needs Finnish to work in spike S1; if it doesn't, do it in English with a teammate and keep the grandparent idea out.

## 4. The wow moments, ranked

| # | Moment | Feeling | Cost | Verdict |
|---|---|---|---|---|
| 1 | **Your own words become objects.** While the reviewer talks, their sentence appears on screen and snaps into a typed symptom with their quote attached. | "It heard me" | Mostly built. Needs big type and one animation. | Must |
| 2 | **Voice and screen in sync.** The agent says "by Sunday 21:47" and at that second a countdown starts on the screen, ticking in seconds. | Relief, magic | Small | Must |
| 3 | **The 112 moment.** Reviewer says "I'm coughing up a lot of blood". Screen goes red, agent says call 112. We say: "That was not the model. That is a rule the model cannot override." | Trust | Engine has it. Needs a distinct screen state. | Must |
| 4 | **"Try to break it."** A card on the table: *make it diagnose you*. Hackers love this. It refuses every time, and the eval table shows 5/5 adversarial. | Fun, respect | Card + eval numbers | Must |
| 5 | **The blank map fills in.** Cockpit opens on "Finland today: not measured" (real). Toggle to Polku: tiles fill with promises kept per county (synthetic). The call just made bumps Keski-Suomi by one. | Indignation, then "oh" | Cockpit not built yet. This is the biggest remaining item. | Must |
| 6 | **Time machine.** A "+1 day" control. Jump to day 6: a promise breaks, the tile turns, an escalation appears on the nurse screen. | The clock has teeth | Small if all clocks read one sim time source | Should |
| 7 | **The "Why?" trace.** One click on a case walks the graph: Matti's sentence → symptom → criterion → Swedish source document → step → clock → county. | "This is not a black box" | Reuse the ontology explorer already started | Should |
| 8 | **Postcode lottery.** Same Matti in three lanes: Pirkanmaa, Keski-Suomi, Sweden. Published promises only. | Indignation | Slide and video graphic, **not app code** | Should (as a graphic) |
| 9 | Nurse confirms and the caller's phone rings back | Loop closed | Outbound calling, new risk | Cut |

The near-miss matters too: a 30-year-old with a one-week cold gets "this doesn't match, here is ordinary advice". It shows we don't flood nurses, which is the first objection from anyone in healthcare.

## 5. Three audiences, three cuts of the same story

| Audience | Time | They score | Lead with | Close with |
|---|---|---|---|---|
| Peer reviewers (hackers) | ~3 min at the table, noisy | Innovation, impact, implementation | The phone. "Call it. You're Matti." | "Try to break it." Then the blank map. |
| AstraZeneca (marketing and business people) | Sun 14:00 | Actionability 30, insight 25, data 20, execution 15, clarity 10 | The blank map and the unmeasurable indicator | A one-page county pilot and an ask |
| Stage judges (if top 5) | 3 min + 3 min Q&A | Theme tiebreak: idealism and caution | 20 s of Matti, then the live call | "Pathways by 2028. We built one by Sunday." |

### Peer review table: run of show

Setup: big screen in **stage mode** (section 7), a phone or headset, three printed role cards, one "try to break it" card, QR for the web call.

| Time | What |
|---|---|
| 0:00 | "Lung cancer in Finland: about 155 days from first symptom to treatment. Nobody counts them. Pick a card and call." |
| 0:10 | Reviewer calls as Matti. Screen shows identity, then their words turning into symptoms. |
| 1:10 | Agent speaks the promise. Countdown starts. "That deadline is now someone's job." |
| 1:20 | Nurse screen: confirm. Pathway steps appear, each with its own promise. |
| 1:40 | Cockpit: blank map (real), filled map (synthetic), Keski-Suomi +1, the one recommendation. |
| 2:20 | "The AI only did one thing: turn your sentence into a typed object. Want to try to make it diagnose you?" |

Role cards:

| Card | Says | Outcome |
|---|---|---|
| Matti, 71 | Cough for seven weeks, used to smoke | Fast-track match, nurse callback promise |
| Aino, 34 | Cough for a week after a cold, never smoked | No match, ordinary advice |
| Red flag | Coughing up a lot of blood right now | Call 112, engine-enforced |

The venue is loud. The **live transcript in large type** is what lets bystanders follow, so it is not optional. Fallback if audio fails: the Simulate buttons play the same three cards.

### AstraZeneca: sell the Monday morning

Their brief says the recommendation is the most important part, and they want a follow-up with a county. So the demo ends on something a county can say yes to.

- **Cockpit's first line is one sentence**, e.g. "Keski-Suomi: the wait is in the first specialist visit. Median 24 days against a 5-day target (synthetic)."
- **One recommendation card**, rule-triggered, tied to a roadmap measure, with simulated effect: "Direct CT route from primary care (measure 2.5.2). Simulated: 9 days saved."
- **A printed one-page pilot**: one county, one phone number, one nurse, 90 days, what gets measured, which roadmap measures it implements (2.5.2, 3.1.2, 3.5.3), what it needs from the county.
- **The ask, out loud:** "Introduce us to one wellbeing county."
- Use their verbs in order: identify, locate, recommend.
- Go and tell Kaisa Kaitila the blank-map insight on Saturday. If a mentor confirms it, quote them in the pitch.

### Stage: 3 minutes

| Time | Beat |
|---|---|
| 0:00 | "Matti is 71. He has been coughing for seven weeks. He hasn't called anyone, because he doesn't want to be a bother." |
| 0:20 | "In Finland it takes about 155 days from that first cough to treatment. Nobody is counting them. So we built something that counts." |
| 0:35 | Live call, 75 s. Presenter plays Matti. Screen behind shows words → symptoms → promise → countdown. |
| 1:50 | "The AI listened. A rule decided, and here is the source. A nurse confirms." Nurse click. One sentence on the red-flag rule. |
| 2:10 | Blank map → filled map. "This is the indicator the national strategy asks for and cannot measure." |
| 2:35 | "The pathway is code: typed, cited, open, running in Europe. We call it a sovereign ontology. Lung is one file. The next cancer is the next file." |
| 2:50 | "Finland's strategy says pathways by 2028. We built one by Sunday. Polku: every cancer pathway, on the clock." |

Backup: the recorded call, queued. If the live call stalls 5 seconds, play it.

## 6. The video (2:00)

The current plan in `17-build-plan.md` opens with text cards of statistics. Open inside the story instead, and keep one device running through the whole film: **a day counter in the corner.**

| Time | Picture | Sound | Counter |
|---|---|---|---|
| 0:00-0:12 | Black. A kitchen table, a phone, a hand. Or just black with subtitles. | A cough. Matti (Finnish): "It's probably nothing. I don't want to bother anyone." | Day 49 |
| 0:12-0:22 | Text on black: "In Finland, about 155 days pass from the first symptom of lung cancer to treatment. Nobody counts them." | Quiet | Day 49 |
| 0:22-0:30 | He dials. "Polku" on the phone screen. | Ring, agent answers, says it is an AI | Day 49 |
| 0:30-1:05 | The real call, split screen: phone left, Screening right. Words become symptoms. Criterion matched, one source line. | Call audio, subtitles | Day 49 |
| 1:05-1:12 | **Hold on the promise.** Agent: "A nurse will call you by Sunday 21:47." Countdown starts. Let it tick in silence for 2 seconds. | Call audio, then silence | Counter flips to the countdown |
| 1:12-1:25 | Nurse confirms. Steps unfold, each with a deadline. "Promise kept." | VO: "A nurse decides. Every step after that is a promise with a deadline." | |
| 1:25-1:32 | Hard cut: red screen, "Call 112". | VO: "The AI never decides. Some rules it cannot override." | |
| 1:32-1:48 | Blank map of Finland, "not measured" (real). It fills (synthetic). One tile ticks. Recommendation card. | VO: "Today Finland cannot measure this per county. With Polku it is a by-product of care." | |
| 1:48-1:55 | Pathway-as-code flash, "open · cited · runs in Europe". | VO: "One typed, cited definition per cancer. A sovereign ontology." | |
| 1:55-2:00 | Logo. "Every cancer pathway, on the clock." | VO: "By 2028, says the strategy. We built one this weekend." | |

Rules:

- Record the call as one continuous take with screen and audio. A visible cut inside the call kills the "it's real" effect.
- Subtitles burned in. Most viewers watch muted, and the call may be in Finnish.
- The 2 seconds of silence after the promise is the emotional peak. Don't put VO over it.
- "Synthetic" label visible on the filled map. It reads as integrity, and Data quality is 20 % of the AZ score.
- Target 1:55. Not one frame over 2:00.

## 7. Steering the MVP

Principle: **build only what appears in the video or the 3-minute table demo.** If it is in neither, it is not in the MVP.

### Build, in this order

| P | Item | Why (which wow) | Notes |
|---|---|---|---|
| 0 | **Stage mode for Screening** | 1, 2 | Readable from 2 m. Large live transcript, quote → symptom animation, plain-language match with one source line, the promise as the biggest text on screen. This is the frame the video is shot in. |
| 0 | **Promise + live countdown** | 2 | The engine returns an absolute deadline, the agent speaks it, the UI ticks in seconds. The spoken sentence and the screen must show the same time. |
| 0 | **Red-flag state** | 3 | Whole screen changes. No subtlety. Label: "Engine rule, not model output." |
| 0 | **Cockpit v1** | 5 | Tile grid of the wellbeing counties (a tile map in the hairline style, not a real SVG map: cheaper and on-brand). Two states: "Today: not measured" (real) and "With Polku" (synthetic, labelled). One headline sentence. One recommendation card. The live case bumps its county over SSE. |
| 0 | **Three scripted callers** | table fallback | Matti, Aino, red flag in the Simulate buttons, same as the role cards. |
| 1 | **One sim clock + "+1 day"** | 6 | All clocks read one time source. Jumping forward breaks a promise and raises an escalation on the Nurse screen. Without this, day-scale clocks never move during a demo. |
| 1 | **"Why?" trace** | 7 | Point the ontology explorer at one case and show a single path from the caller's sentence to the cited source. It should not be a general graph browser in the demo. |
| 1 | **Eval table** | 4 | 40 vignettes, accuracy per class. The numbers that back "try to break it". Goes on the cockpit footer, the deck and the README. |
| 1 | **Finnish call** | video | Only if S1 shows it works well. A stumbling Finnish agent is worse than a clean English one. |
| 2 | **Sovereign badge** | theme, Verda, Gemma | One line on Screening: where this call's text was processed. Only show it when it is true for that call. |
| 2 | **Gemini writes the recommendation text** | Gemini prize | Over aggregate numbers only. The rule picks the recommendation, Gemini only words it. |
| 2 | Landing page | submission | One screen: tagline, the number, call button, video. |

### Cut or freeze

| Item | Why |
|---|---|
| Slot booking depth, appointment capacity | Not in the video or the table run. Keep what exists, add nothing. |
| General ontology graph browsing | Replaced by the "Why?" trace. |
| Postcode-lottery as an app view | It is a graphic. Make it in the deck. |
| Outbound callback call | New failure mode on the demo path. |
| Oxylabs/Context.dev, Modal, LoRA fine-tune | No wow, real cost. Only after the video is recorded. |
| More criteria coverage beyond what the three cards and the eval need | Invisible in 3 minutes. |

### Copy rules for the UI

- "Promise", "due", "kept", "broken". Not "SLA", "breach", "StepClock".
- The match is one plain sentence plus one source line: "New cough for 6 weeks in a former smoker over 40. Source: Swedish standardised lung cancer pathway v1.4."
- Every synthetic number carries the word "synthetic" next to it, not in a footer.
- The outcome never contains the word "cancer" when spoken to the caller beyond the name of the line. It is "a fast-track assessment".

### Schedule impact

| When | Checkpoint |
|---|---|
| Sat 10:00 | Stage mode + promise countdown working with a real call. Call a grandparent if Finnish works. |
| Sat 14:00 | Cockpit v1 live-updating. Whole table run works end to end. Hallway test with the three cards. |
| Sat 16:00 | +1 day, "Why?" trace, eval table. |
| Sat 18:00 | Freeze. Record the call in one take, twice. |
| Sat night | Edit video, deck, one-page pilot, print cards. Rehearse the stage pitch (no rehearsal possible on Sunday). |

## 8. Facts to fix before they go on a slide

| Claim | Problem | Action |
|---|---|---|
| "155 days from symptom to treatment" | Comes from `rinnalla-plan.md` citing Yle MOT. Not opened by us. | Open https://yle.fi/a/74-20251023 and confirm number, year and definition. If it holds, it is the hero number. |
| "Sweden is 14 points ahead" | 14 pp is the **strategy's target gain to reach the Nordic level** (mean of Sweden and Norway, Nordcan 2023). Our verified survival figures (`13-lung-pathway-sources.md`) show roughly 8-10 points against Norway, and Sweden's values are unverified. | Say "the strategy says Finland must gain 14 points to reach the Nordic level" and cite p.5. Don't say "behind Sweden by 14" until a Sweden figure is verified. The "we don't lose to Sweden" joke survives either way. |
| "Most lung cancer patients are old" | No sourced number yet (noted in `18-phone-first.md`). | Export share aged 65+ and median age from the Syöpärekisteri app. Put the number on the phone-first slide. |
| 155 days vs Sweden's 40-44 days | Different start points (first symptom vs well-founded suspicion). | Never put them side by side as a like-for-like comparison. |
| "Processed in the EU" | ElevenLabs free tier routes voice through the US. | Keep the honest line from the build plan: reasoning model in the EU, voice layer swappable. Say it before someone asks. |

## 9. Q&A: the six questions we will get

| Question | Answer |
|---|---|
| Isn't this a medical device? | As a product, yes, it would need conformity assessment. That is why the AI only transcribes into typed symptoms, the criteria are published national ones, and a nurse makes every decision. |
| What if the model mishears? | The nurse sees the caller's exact words next to every symptom. The engine asks again until duration and smoking status are clear. Red flags are a rule the model cannot override. Eval: N/40. |
| Won't this flood nurses with worried callers? | The criteria are the ones Sweden already uses to filter. Near-misses get ordinary advice (show Aino). A structured case takes less nurse time than a cold callback. |
| Why would a county buy it? | They already run a phone line and a callback queue. This is a better phone line, and it produces the Goal 3 indicator they will be asked to report. Roadmap measure 3.5.3 has a budget for pilots. |
| Why Swedish criteria in Finland? | Finland's own are being drafted (Filha, 05/2026). The pathway is one file. When the Finnish criteria are published, we change the file, not the product. |
| What about people who never call? | True, and outside this MVP. But Polku records symptom onset for everyone who does call, which is the first data anyone will have on the delay before first contact. |

## 10. Open decisions

1. Hero number: 155 days (if verified) or 14 points. Recommendation: 155 days for peers and video, 14 points for the AZ slide that maps to the strategy.
2. Matti 71 instead of 58. Recommendation: yes.
3. Call language in the video: Finnish with subtitles if the agent handles it, else English. Decide after S1.
4. Whether "promise" replaces "clock" in UI copy. Recommendation: yes in copy, keep the tagline.
