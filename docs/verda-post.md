# Verda Discord post

## The challenge

Verda Compute Track. Prizes: $10 000 credits + hoodies, $2 500, $2 500.

- **Task:** use Verda products to build something you couldn't build on a laptop. Their own example list includes "Keep sensitive data in Europe": open-weight models on infrastructure you control.
- **Minimum requirements:** document your process, and post a link to a summary in their Discord channel.
- **Judging, 25% each:** Ambition (what did compute let you do), Fit (right Verda services, used well), Working prototype (runs, process documented), Path to scale (demo to real users).

Source: [Junction Platform](https://hackjunction.app/participate/45/tech-challenges/56), pulled 14.11.2026. Full brief in `docs/reference/tech-challenges-brief.md`.

## Before posting

- [ ] Find the channel name, and check for any required tags or format, in the Junction/Verda Discord (or ask a Verda mentor)
- [ ] Check the deadline (final submission is Sun 10:00)
- [ ] Optional: run `agent/verda/smoke.mts polku-qwen3` (with `SMOKE_MODEL=qwen3`) to get a measured time to first token. Add it only if you measure it.

## Post (paste from here)

**Polku: a phone line for suspected lung cancer, with its language model on Verda**
Junction 2026 · AstraZeneca challenge "Equal Care Across Finland"

A patient calls one number and describes their symptoms in their own words. Polku's language model only turns that speech into typed symptoms. Fixed rules match them to published Nordic referral criteria, and each criterion cites its source. A nurse confirms every case. Red flags always return "call 112", and that rule lives in the rules engine, not the model.

**Why Verda:** call transcripts are personal health data. We wanted an open-weight model that we run ourselves in an EU data centre, not a closed API. A live phone call also needs GPU-speed turns that a laptop can't give.

**What runs on Verda:** Qwen3-30B-A3B-Instruct-2507 (FP8) on vLLM 0.29, as a Verda serverless container on one L40S. It serves an OpenAI-compatible endpoint. Every turn of the call goes ElevenLabs voice agent → our `/api/llm` proxy → Verda. The proxy also writes the transcript live for the nurse's view. If the endpoint is slow or down, ElevenLabs falls back to hosted Gemini.

**Idea to prototype:**
1. We started with Gemma 3 12B on vLLM. It doesn't do tool calls out of the box, so we wrote our own chat template. Verda limits each start argument to 253 characters, so we uploaded the template as a file secret and mounted it into the container.
2. We switched to Qwen3-30B-A3B. It's trained for tool calls, so vLLM's built-in hermes parser works and there's no custom template. It's a mixture of experts with about 3B active parameters per token, which keeps turns fast enough for voice.
3. The whole deployment is one `verda container create` command (`agent/verda/deploy-qwen.sh`). A smoke test replays a real call against the endpoint with our real prompt and tools.

**Honest limits:** our proxy adds about 0.5 s per turn compared with hosted Gemini. The voice layer (ElevenLabs) still sends audio through the US on our tier, so a fully EU call is a goal, not where we are today. Every patient in the demo is synthetic. It's a research prototype, not for clinical use.

**How it scales:** one container per wellbeing county, with min/max replicas set per county, so each county's call data stays on an endpoint it controls. Verda containers scale replicas and concurrency without code changes.

**What we found along the way:** only two of Finland's 22 care areas publish a lung-specific time limit for a patient like ours (public pages, our search 14.11.2026). Polku starts its clock at the first call.

Demo: https://polku.ender.fi · Code (MIT): https://github.com/3nd3r1/polku · Thanks to the Verda team for the compute.
