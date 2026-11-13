# Phone first: the moat

Decided Fri 13.11 ~22:00.

## The insight

Most cancer patients are old, and lung cancer patients especially. For an older person the best interface is a phone call: no app to install, no account, no screen. **Polku's front door is a phone number and nothing else.** The patient never sees a Polku screen.

To source before the pitch (Syöpärekisteri statistics app): share of new lung cancer cases diagnosed at age 65+ and the median age at diagnosis. Do not quote a number until it is sourced.

Why it's a moat:
- Every competing digital front door (symptom checkers, Omaolo-style forms, apps) loses exactly the people most likely to have cancer.
- A phone call works the same for a smartphone user, a landline user and someone with poor eyesight.
- It is also what a wellbeing county already runs (phone service, takaisinsoitto), so adoption means a better phone line, not a new channel.

## The call

1. **Strong identification (vahva tunnistautuminen).** The caller is identified at the start of the call, so the nurse gets a verified person, not an anonymous story. Identity also gives age (from the identity code) and wellbeing county (from the population register), so the agent never has to ask them and the county cockpit gets its key for free.
2. **Symptom intake.** The agent asks only what the criteria need: symptoms in the caller's own words, how long, any cause they know of, smoking status.
3. **Deterministic screening.** The engine matches against cited criteria. Red flags → "call 112" immediately.
4. **Outcome spoken back.** For a match: "A nurse will call you by Sunday 21:47." The nurse callback clock starts.

## Identification: realistic options (to verify)

| Option | How it works on a call | Fit for older callers | Status |
|---|---|---|---|
| Mobile ID (mobiilivarmenne) | Request is pushed to the caller's SIM, they enter a PIN on the same phone | Good if they have it, no app needed | To verify: can the prompt be answered during an active call; coverage among 65+ |
| Bank ID (pankkitunnukset) via Suomi.fi e-Identification | Needs a browser or bank app | Poor on a phone-only call | Fallback: send an SMS link |
| Caller ID + nurse confirms identity on callback | No strong auth in the call itself | Best reach | Weakest assurance, always available as fallback |

**Demo:** identification is **simulated** and labelled so: the agent says it sent a Mobile ID request, the server approves it after a few seconds and returns a **synthetic** person (name, birth year, wellbeing county). Real integration would go through Suomi.fi e-Identification or a Mobile ID provider.

## The screens (staff only)

| Screen | Who | Shows |
|---|---|---|
| Screening | Care team, judges | Each call as it happens: identity → symptoms → criteria check → outcome |
| Nurse | Callback nurse | Cases that need a callback, step clocks, one action per step |
| Cockpit (later) | Wellbeing county | Clocks rolled up per county and step |
