# Calling Polku on a real phone

## The number

**+1 952 248 7540** (US, Twilio trial)

- Call from a **verified** number only (trial account). It's an international call from Finland.
- A Twilio trial notice plays first: **press any key**, then Polku answers.
- Speak **English**.
- Watch it live on production: https://prod-polku.eros.ender.fi (password `PROD_SITE_PASSWORD` in `.env.local`, any user name). **Calls** shows the call as it happens, **Tasks** gets the nurse task.

## Identity codes

The agent asks for your personal identity code first. Use only these. They're synthetic (individual number 900-999, never issued to real people).

| Say | Code | Spoken | What happens |
|---|---|---|---|
| Matti, 71, Keski-Suomi | `040355-9018` | zero four zero three five five, dash, nine zero one eight | **The main demo.** New caller, fast-track match, nurse task |
| Aino, 34, Pirkanmaa | `180692-9029` | one eight zero six nine two, dash, nine zero two nine | New caller, no fast track: told to contact her health centre |
| Seppo, 80, Pohjois-Savo | `220946-903E` | two two zero nine four six, dash, nine zero three E | Red flag, told to call 112 |
| Liisa, 75, Lappi | `270151-904J` | two seven zero one five one, dash, nine zero four J | Already has a case, CT booked: hears her status |

Don't use:

- **Your own or any real code.** It isn't in the register, so it fails anyway. Never say one on a recording.
- **A made-up code.** Refused. After **3 failed codes** the call is locked: hang up and call again.
- **Someone else's code on the callback.** The callback is about one patient's case. Only that patient's code books it.

## Script: Matti (the main demo)

1. Agent: asks for your code. You: "It's 040355-9018."
2. Agent: identified, asks for your symptoms. You: "I've had this cough for about seven weeks now. It just won't go away."
3. If asked about a cold or a cause: "No, nothing like that."
4. If asked about smoking: "I quit about ten years ago."
5. Agent reads back the outcome and the nurse callback deadline, then ends the call.

On **Tasks**, Matti's case shows proposed times. Click **Accept**.

## The callback

1. Production rings `DEMO_CALLBACK_NUMBER` (the phone set on Coolify). Press any key for the trial notice.
2. Agent: "Hi, this is Polku calling ... please tell me your personal identity code." You: Matti's code, `040355-9018`.
3. Agent reads the numbered times. You: "The first one works."
4. Agent confirms the booking and hangs up. On **Tasks** the case shows the booked time.

## Other scripts

- **Aino:** "A cough that won't go away, almost four weeks now." Smoking: "No, never." Too short and no risk factor: no fast track, told to contact her health centre.
- **Seppo:** "I'm coughing up a lot of blood right now." The agent tells you to call 112 straight away and ends the call.
- **Liisa:** give the code, then "Nothing new, I just wanted to know."
- **Impostor:** ask about someone else ("What's Matti's appointment?") without a code. The agent refuses: no identity, no access. The refusal shows in the call's access log.

## Between takes

Each caller can only open one case. To start clean:

```sh
npm run demo:reset prod
```

This wipes production's calls and cases and reseeds the register.

## If something goes wrong

- **The agent goes quiet or says it hit an error after your code:** a webhook failed. Check the Polku Phone conversation in ElevenLabs, and the Coolify logs.
- **The callback doesn't ring:** look for `[phone] outbound call failed` in the Coolify logs. Usually the number isn't verified in Twilio, or Finland isn't allowed under Twilio's Geo Permissions.
- **The agent sounds out of date:** after `npm run agent:push`, run `npm run agent:phone` too.
