# Product

**Every cancer pathway, on the clock.** A phone line for suspected lung cancer that applies published Nordic referral criteria, gives the caller a deadline, and runs a clock on every pathway step, rolled up per wellbeing county.

## The problem

- **Finland has no national lung cancer pathway.** Sweden, Denmark and Norway publish entry criteria, ordered steps and a maximum time per step. Finland's strategy commits to building its own (measure 3.1.2, 2026-2028), and the national lung recommendation is still being drafted (Filha, 05/2026).
- **Finland can't measure its own goal.** The strategy's headline equality indicator is "patients get treatment within target times". No public per-county data for it exists, because nothing records the clock.
- **Counties already promise different things.** Pirkanmaa: CT usually within about a week of the referral being processed. Keski-Suomi: pulmonology visit within about a month of the referral arriving.
- **Survival:** the strategy targets +14 percentage points in 5-year lung cancer survival to reach the Nordic level (mean of Sweden and Norway). Our verified figures show Finland about 8-10 points behind Norway.

Polku runs the pathway, and the measurement falls out as a by-product.

Sources: `strategy.md`, `lung-pathway-sources.md`.

## Matti

Matti is 71, lives alone in Keski-Suomi, used to smoke, and has been coughing for seven weeks. He hasn't called anyone because he doesn't want to be a bother. Today he would wait for a GP slot, an X-ray, a referral, a CT and a pulmonologist. Nobody owns the whole journey and nothing is timed.

In Sweden his symptoms match a published criterion on day one (SE-M1: new cough for 6 weeks in a current or former smoker over 40). From well-founded suspicion, a clock gives him 40-44 days to treatment.

## Three surfaces, one ontology

**1. Phone line (patient).** A phone call is the only patient interface. Matti calls a number, is strongly identified, and describes what's going on in his own words. Polku turns that into typed symptoms, each linked to his exact words. A rules engine checks them against published criteria. The answer is never a diagnosis, it is a next step with a deadline: "Your symptoms match the criteria for a fast-track assessment. A nurse will call you by Sunday 21:47."

**2. Nurse.** The nurse sees the symptoms, the matched criterion and its source, and the deadline. They confirm or dismiss, log the callback, and the pathway steps start, each with its own deadline. A human makes every clinical decision.

**3. County cockpit.** Every case's clocks, rolled up per county and step: which promises are kept and which are broken. One rule-picked recommendation per county, e.g. "Referral-to-CT is where the wait is. A direct CT route from primary care (measure 2.5.2) saves 9 days" (example, synthetic numbers). This is the indicator Finland can't measure today.

| Screen | Route | Who | Shows |
|---|---|---|---|
| Screening | `/` | Care team, judges | Each call live: identity, symptoms, criteria check, outcome |
| Nurse | `/nurse` | Callback nurse | Cases to call back, step clocks, one action per step |
| Cockpit | `/cockpit` (not built) | Wellbeing county | Clocks rolled up per county and step |
| Ontology | `/ontology` | Tech judges | Object types, links and actions |

## Phone first

Most cancer patients are old, lung cancer patients especially. For an older person the best interface is a phone call: no app, no account, no screen. **The patient never sees a Polku screen.** (Share of lung cancer patients aged 65+ is not sourced yet. Don't quote a number until it is.)

Why this is the moat:

- Every competing digital front door (symptom checkers, Omaolo-style forms, apps) loses exactly the people most likely to have cancer.
- A call works the same on a smartphone, a landline or with poor eyesight.
- Counties already run phone lines and callback queues. Adoption means a better phone line, not a new channel.

### The call

1. **Strong identification.** The caller is identified first, so the nurse gets a verified person. Identity also gives age (from the identity code) and wellbeing county (from the population register), so the agent never asks for them and the cockpit gets its key for free.
2. **Symptom intake.** The agent asks only what the criteria need: symptoms in the caller's words, how long, any known cause, smoking status. It keeps asking until the intake is clear.
3. **Deterministic match.** The engine checks the intake against cited criteria. Red flags return "call 112" immediately.
4. **Outcome spoken back.** For a match, a deadline: "A nurse will call you by Sunday 21:47." The nurse callback clock starts.

### Identification options

| Option | How it works on a call | Fit for older callers | Status |
|---|---|---|---|
| Mobile ID (mobiilivarmenne) | Request pushed to the caller's SIM, they enter a PIN on the same phone | Good if they have it, no app needed | To verify: can it be answered during an active call; coverage among 65+ |
| Bank ID via Suomi.fi e-Identification | Needs a browser or bank app | Poor on a phone-only call | Fallback: SMS link |
| Caller ID, nurse confirms identity on callback | No strong auth in the call | Best reach | Weakest assurance, always available |

**In the prototype identification is simulated** and labelled so: the agent says it sent a Mobile ID request, the server approves it after a few seconds and returns a synthetic person. A real integration would go through Suomi.fi e-Identification or a Mobile ID provider.

## Sovereign ontology

- **Pathway as code.** Each pathway is one typed, versioned definition of criteria, steps and time limits, and every rule cites its source (`src/pathways/lung.ts`). A new cancer is a new file, not a new product.
- **Objects, links, actions.** Callers, cases, criteria, steps, clocks, counties, hospitals and resources are typed objects (`src/ontology/`, shown in the Ontology tab). Every change is a typed action with a permitted role and an audit entry.
- **Deterministic where it matters.** The LLM only turns speech into typed symptoms. Matching is rules, and every outcome can be traced to a source.
- **Sovereign data (target, not yet true).** Personal data processed only by an open model (Gemma) on EU infrastructure (Verda). Hosted models (Gemini) see only county totals. Today the voice agent runs on ElevenLabs, which on our tier routes voice through the US. Say so before anyone asks: the voice layer is swappable.

## Safety and regulation

- The AI never triages or diagnoses. It extracts typed symptoms with the caller's quotes.
- Patient self-report only ever reaches "suspicion, nurse to confirm", never "well-founded suspicion" on its own.
- Red flags return "call 112" from the engine, whatever the model says.
- Every call starts with "I'm an AI assistant" (EU AI Act transparency).
- As a product it would need medical device conformity assessment before clinical use. That is why the criteria are published national ones and a nurse makes every decision.

## Why now

- **The strategy (2026-2035) and its roadmap** fund exactly this: symptom-based referral criteria (2.5.2), pathways with target times for 5 cancers by 2028 (3.1.2), digital pathways and AI symptom assessment with a 1.14 M€ budget (3.5.3).
- **Filha's lung programme** is drafting the Finnish criteria right now. When they're published, we change the file, not the product.
- **The European Health Data Space** pushes for structured, sovereign health data.

## Business

- **Customer:** the 21 wellbeing counties, plus Helsinki and HUS.
- **Rollout:** lung first, then the 5 cancers on the roadmap.
- **Pitch to a county:** they already run a phone line and a callback queue. This is a better phone line that produces the Goal 3 indicator they will be asked to report. Measure 3.5.3 has a pilot budget.
- **Expansion:** the same engine runs any time-critical pathway. The ontology is the asset, cancer is the wedge.
