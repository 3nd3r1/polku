# Tech challenges

Side prizes entered alongside AstraZeneca. Each sponsor tech needs a real, distinct job in the architecture, so no judge sees it as bolted on. The full list of 19 is on the Junction Platform ("Tech Challenges" tab).

## What we enter

| Challenge | Prize | Requirement | Job in Polku | Status |
|---|---|---|---|---|
| Best Use of Gemini API (Google DeepMind) | 4 000 € + $1 000 GCP per member · 2 000 € · 1 000 € | Meaningful use of Gemini | Words the cockpit's rule-picked recommendation from aggregate county numbers. Fallback agent LLM. | Todo |
| Best Use of Gemma (Google DeepMind) | 1 000 € each to 3 teams | Innovative use of Gemma | The agent's LLM: personal data only goes to an open model we host | Todo (spike S3) |
| Verda Compute Track | $10 000 credits · $2 500 · $2 500 | Use Verda for something you couldn't do on a laptop. **Post a summary in their Discord.** | Hosts Gemma in an EU data centre on renewable energy. Their brief: "keep sensitive data in Europe, run open-weight models on infrastructure you control". | Todo (spike S3) |
| Best Use of Aiven | 1 000 € · 750 € · 500 € | An Aiven service as a meaningful part | Managed Postgres for the ontology store in prod | Todo (deploy) |
| Best Use of ElevenLabs (MLH) | Wireless earbuds | Voice in your hack | The phone line | Done |
| Best use of CRACI | LEGO, Red Bull, lunch at Slush | CI/CD on CRACI (`runs-on: craci`) | CI | Todo (~15 min) |
| Best Use of Codex (OpenAI) | $10 000 / $5 000 / $2 500 API credits | Meaningful use of Codex in the dev process, show how | Used for parts of the build, documented | Needs real usage and evidence |

Not entered: Oxylabs, Context.dev, Modal, Nemotron, Tiger Data (no wow for the cost, or they conflict with the sovereign story). Solana, MongoDB, Vultr, Cloudinary, Arduino, Atech, Entire have no honest fit.

## Architecture

```
Caller (personal data)                  County (aggregate data only)
   │                                        │
   ▼                                        ▼
Gemma on Verda (EU, renewable)          Gemini API
symptoms → typed observations           words the recommendation from
                                        cited, aggregate numbers
   │                                        ▲
   ▼                                        │
Rules engine + ontology ── Aiven Postgres ──┘
   │
   ├─ ElevenLabs: voice of the phone line
   └─ CI on CRACI, built partly with Codex
```

## Verda

Judged on: an ambitious idea where compute makes it possible, the right Verda product with a clear reason, the path from idea to prototype, and (bonus) how it scales.

- **Job:** Gemma behind an OpenAI-compatible endpoint (vLLM on a GPU instance, or the Inference API if it serves Gemma), plugged into ElevenLabs as the custom LLM. Personal health data stays in the EU on infrastructure we control, and a real-time call needs GPU latency.
- **Scale story:** one auto-scaling container per county, EU-only, renewable energy.
- **Process log:** keep `docs/verda-log.md` as we go (what we tried, latency, what broke, cost). It becomes the Discord post.

## Admin

- **Verda:** summary post in their Discord channel.
- **Codex:** keep evidence (screenshots, commit notes) of real usage.
- **CRACI:** CI badge or run link in the README.
