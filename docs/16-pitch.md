# Polku

**A sovereign ontology for Finnish cancer care. Every pathway, on the clock.**

## The story

Matti is 58, an ex-smoker in Keski-Suomi, and has been coughing for seven weeks. Today he calls the health centre, waits for a GP slot, gets an X-ray, waits for a referral, waits for a CT, waits for a pulmonologist. Nobody owns the whole journey, nothing is timed, and nobody notices when he's been waiting too long.

If Matti lived in Sweden, his symptoms would match a published pathway criterion on day one. From well-founded suspicion, a clock would give him about 40 days to treatment, and someone would be accountable for every step.

The gap shows up in the numbers. Finland trails Sweden and Norway by about 14 points on lung cancer survival. Pirkanmaa promises a CT within about a week of the referral being processed; Keski-Suomi promises a specialist within about a month. Same country, same disease, different promise.

## The insight

1. **The Nordic cancer pathways are already an ontology.** Entry criteria, ordered steps and a maximum time per step, all published. Finland's strategy commits to building its own, but it doesn't exist yet. The national lung recommendation is still being drafted (Filha, 05/2026).
2. **Finland can't measure its own goal.** The strategy's headline equality indicator is "patients get treatment within target times". No public per-county data for it exists, because nothing records the clock.

Polku solves both. It runs the pathway, and the measurement falls out as a by-product.

## The product: three surfaces, one ontology

**1. Front door (patient).** Matti calls a number or opens a chat, in Finnish, any time, and describes what's going on in his own words. Polku turns that into structured symptoms, each linked to the exact words he used. A rules engine checks them against published pathway criteria. The answer is never a diagnosis. It's a next step: "Your symptoms match the criteria for a fast-track assessment. A nurse will call you by Wednesday."

**2. Nurse console.** The nurse sees a structured case: the symptoms, the matched criterion and its source, and the deadline. They confirm or dismiss it, log the callback, and the pathway clock starts. A human makes every clinical decision.

**3. County cockpit.** Every case's clocks, rolled up per county and per step: where the target time is breached and by how much. A Gemini analyst explains the pattern in plain language and proposes fixes, and a simulator shows the effect. For example: "62 % of referral-to-CT steps breach target; a direct CT route from primary care would save 9 days." This is the indicator Finland can't measure today.

## The sovereign ontology (the core)

- **Pathway as code.** Each cancer pathway is one strict, typed, versioned definition: steps, criteria, time limits. Every rule cites its source. A new pathway is a new file, not a new product.
- **Objects, links, actions.** Patient, Case, Criterion, Step, Clock, Nurse task, County. Every change is a typed action with a permitted role and an audit trail.
- **Sovereign data.** Personal data is processed only by an open model (Gemma) on EU infrastructure (Verda, renewable energy). Hosted models only ever see county-level totals. The ontology is open and owned by Finland, not a vendor.
- **Deterministic where it matters.** The LLM only turns language into structured symptoms. Matching is rules, not vibes, and every decision can be explained.

## Why now

- **The strategy:** the national cancer strategy (2026-2035) and its roadmap fund exactly this:
  - symptom-based referral criteria (measure 2.5.2)
  - pathways with target times for 5 cancers by 2028 (3.1.2)
  - digital pathways and AI symptom assessment, with a 1.14 M€ budget (3.5.3)
- **The lung programme:** Filha's lung programme is drafting the criteria right now.
- **The EU:** the European Health Data Space is pushing for structured, sovereign health data.

## The business

- **Customer:** the 21 wellbeing counties, plus HUS and Helsinki.
- **Rollout:** start with lung, then the 5 most common cancers, the same ones on the strategy's roadmap.
- **Expansion:** the same engine runs any time-critical pathway (stroke follow-up, suspected sepsis referral, mental health). The ontology is the asset; cancer is the wedge.

## The demo moment

A reviewer picks up a phone at the table and plays Matti. Polku hears the cough, the seven weeks and the smoking history, quotes the Swedish criterion it matched, and books the nurse callback. On the big screen a new case appears, its clock starts, and the Keski-Suomi row in the county cockpit ticks one breach closer to red.

## The close

> "Sweden is 14 points ahead. Finland's strategy says pathways by 2028. We built one by Sunday. Polku: a sovereign ontology that puts every Finnish cancer patient on the clock."
