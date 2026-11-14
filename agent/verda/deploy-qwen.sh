#!/usr/bin/env bash
# Deploys Qwen3-30B-A3B-Instruct-2507 (FP8) behind vLLM as a Verda serverless container.
# Unlike Gemma 3 it is trained for tool calls, so vLLM's built-in hermes parser and the
# model's own chat template are enough: no custom template.
# Mixture of experts: 30B weights, about 3B active per token, so turns are fast enough for voice.
# Usage: agent/verda/deploy-qwen.sh [name] [hf-token-secret]     (run inside nix-shell)
set -euo pipefail
name="${1:-polku-qwen3}"
secret="${2:-hf-token}"

verda container create \
  --name "$name" \
  --image docker.io/vllm/vllm-openai:v0.29.0 \
  --compute L40S --compute-size 1 \
  --port 8000 \
  --min-replicas 1 --max-replicas 1 --concurrency 8 \
  --env-secret "HF_TOKEN=$secret" \
  --cmd=--model --cmd=Qwen/Qwen3-30B-A3B-Instruct-2507-FP8 \
  --cmd=--served-model-name --cmd=qwen3 \
  --cmd=--max-model-len --cmd=16384 \
  --cmd=--enable-auto-tool-choice --cmd=--tool-call-parser --cmd=hermes \
  -y

echo "Endpoint: https://containers.datacrunch.io/$name/v1 (model id: qwen3)"
