# Tech challenges (side prizes), all 19

Scraped Fri 13.11 ~21:00 from the "Tech Challenges" tab. These are **open challenges you enter alongside your main challenge**. Check the submission form for any limit on how many you can tick.

## Full list

| # | Tech challenge | Sponsor | Requirement (short) | Prize |
|---|---|---|---|---|
| 1 | **Best Use of Gemini API** | Google DeepMind | Meaningful, innovative use of Gemini, open problem | **4 000 €** + $1 000 GCP credits per member · 2nd 2 000 € · 3rd 1 000 € |
| 2 | **Best Use of Gemma** | Google DeepMind | Innovative use of Gemma open models | **1 000 € each to 3 teams** (unranked) |
| 3 | **Verda Compute Track** | Verda | Use Verda (Inference API, GPU, CPU, containers, batch) for something you couldn't do on a laptop. **Post a summary in their Discord.** They explicitly suggest "keep sensitive data in Europe, run open-weight models … on infrastructure you control" | **$10 000 credits** + hoodies · 2nd/3rd $2 500 credits |
| 4 | **Best Use of Codex** | OpenAI | Use Codex meaningfully in your dev process, show how | $10 000 / $5 000 / $2 500 API credits |
| 5 | **Best use of Modal** | Modal | Modal does the heavy lifting (GPU inference, sandboxes, fine-tune, batch) | **$2 000 cash** + $3 000 credits |
| 6 | **Best Use of Aiven** | Aiven | At least one Aiven service as a meaningful part (Postgres, Valkey, Kafka, ClickHouse, OpenSearch, Runtime) | **1 000 €** · 750 € · 500 € |
| 7 | Best agentic use of Oxylabs Web API | Oxylabs | Live /search or /scrape at runtime, show source URLs. Add a note on the endpoints used. | 1 000 € Apple voucher + $500 credits each |
| 8 | Best Use of Context.dev: Fully Structured Web | Context.dev | At least one endpoint in the **core** flow, visibly driving the demo. Add a note. | 750 € · 250 € · swag |
| 9 | Best Use of Nemotron | NVIDIA | Nemotron 3.5 Super VL central to the working solution. Text explanation in the form. | 2× RTX 5080 |
| 10 | Best Use of ElevenLabs | MLH | Voice in your hack | Wireless earbuds |
| 11 | Best use of CRACI | CRACI | CI/CD runs on CRACI (`runs-on: craci` in GitHub Actions). Any project counts. | LEGO each · Red Bull · CRACI x OpenAI lunch at Slush |
| 12 | Best Use of Tiger Data | MLH | Tiger Data (Postgres + time series) | Stream Deck Mini |
| 13 | Best Use of Entire | MLH | Entire Sessions/Graph/Brain/Trails in your workflow | Mini projector |
| 14 | Best Use of Cloudinary | Cloudinary | Images/video via their tools. **Separate form.** | $500 Amazon each |
| 15 | Best Use of MongoDB Atlas | MLH | MongoDB Atlas | M5Stack IoT kit |
| 16 | Best Use of Vultr | MLH | Vultr cloud | M5Stack monitor |
| 17 | Best Use of Solana | MLH | Solana | Hardware wallets |
| 18 | Best use of Arduino UNO Q | Arduino | Hardware + edge AI | UNO Q + kit each |
| 19 | Atech Real World Challenge | Atech | Atech hardware modules | Pro kit |

## Stacking plan for Polku (cancer)

The idea: one architecture where each sponsor tech has a **real, distinct job**, so no judge sees it as bolted on. This also produces the "sovereign" story for free.

```
Patient (personal data)                 County (aggregate data only)
   │                                        │
   ▼                                        ▼
Gemma on Verda (EU, renewable)          Gemini API
"sovereign extractor": symptoms →       county analyst: explains gaps,
typed observations, data never          drafts recommendations from
leaves Europe                           cited numbers (no personal data)
   │                                        ▲
   ▼                                        │
Rules engine + ontology ── Aiven PostgreSQL ┘
   │
   ├─ ElevenLabs: phone front door + nurse callback voice
   ├─ Oxylabs or Context.dev: live check that the cited guideline/criteria source is current
   └─ CI on CRACI, built partly with Codex
```

| Tier | Tech challenge | Job in Polku | Extra effort |
|---|---|---|---|
| **1: core** | Gemini API (4 000 €) | County analyst, recommendation narrative over aggregate data | Low (it's our LLM anyway) |
| **1** | Gemma (1 000 €) | Sovereign on-prem symptom extractor for personal data | Medium (host it) |
| **1** | Verda ($10k credits) | Hosts Gemma in an EU data centre on renewable energy. Their brief literally asks for "keep sensitive data in Europe". | Medium + Discord post |
| **1** | Aiven (1 000 €) | Managed Postgres for the ontology store | Low (just a connection string) |
| **1** | ElevenLabs (earbuds) | Voice front door (your stretch goal) | Medium |
| **2: cheap** | CRACI | GitHub Actions `runs-on: craci` | ~15 min |
| **2** | Codex ($10k credits) | Use Codex for some modules (e.g. the simulator), document it | Low, needs real usage |
| **2** | Oxylabs (1 000 € voucher) *or* Context.dev (750 €) | Live freshness check of cited sources (guideline pages, THL news). Has to visibly drive the demo. | Medium; pick one |
| 3: maybe | Modal ($2 000 cash) | Batch Monte Carlo of the county simulator. Conflicts with the Verda sovereignty story if inference runs there. | Medium |
| 3 | Nemotron (RTX 5080) | Read criteria PDFs into draft ontology entries (human-reviewed). Third LLM risks dilution. | Medium |
| 3 | Tiger Data | Step clocks as time series. Conflicts with Aiven Postgres. | Low |
| ✗ | Solana, MongoDB, Vultr, Cloudinary, Arduino, Atech, Entire | No honest fit | |

**Realistic target: 7-8 tech challenges** (Gemini, Gemma, Verda, Aiven, ElevenLabs, CRACI, Codex, plus Oxylabs or Context.dev) on top of AstraZeneca.

## Admin per tech challenge (don't forget)

- **Verda:** summary post in their Discord channel
- **Nemotron, Context.dev, Oxylabs:** short text note in the submission on what endpoint/model is used and why
- **Cloudinary:** separate form (skipped anyway)
- **Codex:** keep evidence (screenshots, commit notes) of real Codex usage
- **CRACI:** the CI badge or run link in the README

## Verda plan (priority side prize)

**What Verda asks for:** use Verda to build something you couldn't build on a laptop. Judged on:
- an ambitious idea where compute makes it possible
- the right Verda product with a clear reason for choosing it
- the path from idea to prototype
- bonus: how it scales to real users

**Must do:** document the process and post a summary link in Verda's Discord channel. Their brief literally suggests "keep sensitive data in Europe, run open-weight models on infrastructure you control".

**Prize:** 1st $10 000 credits + hoodies, 2nd and 3rd $2 500 credits.

Three jobs, each with a different Verda product and a reason:

| Job | Verda product | Why this product | Priority |
|---|---|---|---|
| Sovereign voice-agent brain: Gemma behind an OpenAI-compatible endpoint, plugged into ElevenLabs as the custom LLM | GPU instance (vLLM), or the Inference API if it serves Gemma | Personal health data must stay in the EU on infra we control. A real-time call needs GPU latency. | Must (spike S3) |
| County "what-if" simulator: Monte Carlo of synthetic patient flows, 21 counties × pathway steps × intervention scenarios | Batch jobs | Thousands of scenario runs behind the cockpit's "this change saves N days" claim. Too slow on a laptop, perfect as batch. | Should |
| Better Finnish extraction: LoRA fine-tune of Gemma on synthetic Finnish symptom descriptions, measured before/after with the eval suite | GPU instance | Shows measurable improvement from compute. Also strengthens the Gemma prize. | Stretch |

**Scale story (bonus points):** one auto-scaling container per county, an EU-only footprint, all on renewable energy.

**Process log:** keep `docs/verda-log.md` as we go (what we tried, latency numbers, what broke, cost). It becomes the Discord post.
