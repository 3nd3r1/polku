# Polku on Verda

## The challenge we entered

Verda Compute Track. Prizes: $10 000 credits + hoodies, $2 500, $2 500.

- **Task:** use Verda products to build something you couldn't build on a laptop. Their own example list includes "Keep sensitive data in Europe": open-weight models on infrastructure you control.
- **Minimum requirements:** document your process, and post a link to a summary in their Discord channel.
- **Judging, 25% each:** Ambition (what did compute let you do), Fit (right Verda services, used well), Working prototype (runs, process documented), Path to scale (demo to real users).

Source: [Junction Platform](https://hackjunction.app/participate/45/tech-challenges/56), pulled 14.11.2026. Full brief in `docs/reference/tech-challenges-brief.md`.

## Summary

**Polku: a phone line for suspected lung cancer, with its language model on Verda**
Junction 2026 · AstraZeneca "Equal Care Across Finland"

A patient calls one number and describes their symptoms. The language model only turns speech into typed symptoms, and fixed rules match them to published Nordic referral criteria. A nurse confirms every case.

**Why Verda:** call transcripts are personal health data. We wanted an open-weight model we run ourselves in an EU data centre, not a closed API, and a live call needs GPU-speed turns a laptop can't give.

**What runs on Verda:** Qwen3-30B-A3B-Instruct-2507 (FP8) on vLLM, a serverless container on one L40S. Every turn of the call goes ElevenLabs → our proxy → Verda. We started with Gemma 3 12B and a custom tool-call template, then switched to Qwen3: native tool calls, and only ~3B active parameters so turns are fast enough for voice. Deploy is one `verda container create` command.

**Limits:** ElevenLabs still routes audio through the US on our tier, so a fully EU call is the goal, not the current state. Synthetic patients only, research prototype.

**Scale:** one container per wellbeing county, so each county's call data stays on an endpoint it controls.

Demo: https://polku.ender.fi · Code (MIT): https://github.com/3nd3r1/polku
