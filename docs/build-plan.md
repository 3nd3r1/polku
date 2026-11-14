# Build plan

Polku does the handoffs between care steps. The MVP shows one patient going from a phone call to a nurse task, then an agent callback that books the time, then the next step, with the same record the whole way.

Final submission Sun 09:00 (deadline 10:00). Feature freeze and video recording Sat 18:00.

## What we're building

Polku is not the nurse's system and not a statistics dashboard. Nurses keep their own patient system. Polku takes work off them between steps: it collects the information on the call, makes the nurse's part one decision, and calls the patient back.

Build only what makes one of these four better.

1. The call. The patient phones, the agent identifies them and collects what the nurse needs. The screen shows a handoff packet filling up: symptoms next to the patient's own words, the matching criterion with one source line, and what's still missing. Red-flag symptoms fill the screen with "Call 112", decided by the engine. The call ends with "Handed to the nurse, due Sun 21:47".
2. The task view. A short list of tasks, each with one decision. The time is already proposed by the rules. The nurse presses Accept, or calls the patient themselves.
3. The callback. After Accept the agent phones the patient, reads out the proposed time and books it when they agree. The task closes and the next step's task appears.
4. The handoff strip. One line per patient: Call, Nurse, CT, Specialist. It shows who has the patient now, the deadline for that handoff, and which parts of the record each step has opened. This is where the ontology shows: one secured record that moves with the patient, nobody asks the same question twice, and every access is logged.

The demo moment is the phone ringing back. A judge makes the call, accepts the task as the nurse, and the agent calls them back with a time.

## Status

| Element       | Where it stands                                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| The call      | Transcript, symptoms and criteria match work. The packet layout, missing fields and the full-screen red flag aren't built. |
| Task view     | Worklist and proposed times in progress, not committed.                                                                    |
| Callback      | `book_time` tool and the callback part of `agent/prompt.md` in progress, not committed. Browser call only.                 |
| Handoff strip | Not built. The access log exists per call.                                                                                 |

Already done underneath: lung pathway typed and sourced (`src/pathways/lung.ts`), rules engine with tests, identification gate (identity code and simulated Mobile ID, three failures lock the call), cases, clocks and audit in Postgres with live updates. Deployed at https://polku.eros.ender.fi, deploys on push.

## Next

1. Finish and commit the task view and the callback.
2. Call screen: packet layout, missing fields, full-screen red flag.
3. Handoff strip.
4. Move all demo tooling to `/demo` (see below).
5. A phone at the table reaches the agent: QR web call, or a non-Finnish Twilio number (+358 needs a slow regulatory bundle). The callback only rings a real phone with Twilio. Without it the callback plays in the browser.
6. Run the full loop 10 times on prod without a failure.
7. Sat 18:00: freeze, record the video.

If time: Gemma on Verda as the agent's LLM (go/no-go was Sat 12:00, otherwise Gemini runs it). An eval set of scripted callers with expected outcomes, all red flags and adversarial calls included.

## Demo tooling, kept apart

Anything that fakes part of the world for the demo lives on one page, `/demo`, never on the call, task or strip screens. Everything on it is labelled synthetic.

- Scripted callers: Matti, Aino, red flag, Liisa (open case), Impostor. Now under "Play a call" on Screening.
- Scripted callback for when there's no voice. Now in the nurse inbox (`simulateCallback`).
- Demo reset (`/api/admin/reset`).
- Synthetic register and resource calendars (`src/db/demo.ts`).

## Cut

County cockpit as a screen. It becomes one line in the pitch: every handoff is timed, so waits can be counted per county. Also cut: stats dashboards, anything that looks like replacing the nurse's system, patient screens or apps, real patient data, real EHR integration, more than one pathway, ontology graph browsing, landing page.

## Polku's own rules

These come from us, not from a published pathway. `lung.ts` cites them as source `POLKU`.

- Red flags mean 112. Massive haemoptysis, severe breathlessness or sudden severe chest pain always return "call 112 now", enforced in the engine whatever the LLM says.
- Nurse callback within 2 days of a match. No Nordic pathway defines this step. The nearest precedent is Pirkanmaa, which processes lung referrals within 1-2 working days.
- Nothing before identification. Until `verify_identity` succeeds, every tool returns nothing about any person (`src/server/identity.ts`). After it, tools only reach the identified caller. No tool takes a name, identity code or person id, so there is no lookup to inject. Three failed codes lock the call. Every tool call is logged as allowed or refused.
- No case without a clear intake. The agent is told what is missing and asks again.
- Proposed times come from a rule: the earliest free slot before the deadline (`src/server/schedule.ts`). The agent only reads the time out and records the answer.

## Copy rules

- Say "promise", "due", "kept", "broken". Not "SLA", "breach", "StepClock".
- A match is one plain sentence and one source line: "New cough for 6 weeks in a former smoker over 40. Source: Swedish standardised lung cancer pathway v1.4."
- Every synthetic number has the word "synthetic" next to it, not in a footer.
- Nothing said to the caller mentions cancer beyond the name of the line. It's "a fast-track assessment".
- A task shows the task and the decision, not a patient record.
