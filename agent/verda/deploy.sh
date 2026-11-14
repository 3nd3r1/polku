#!/usr/bin/env bash
# Deploys Gemma 3 behind vLLM as a Verda serverless container, with our tool-aware chat template.
# The template is uploaded as a Verda file secret and mounted at /templates
# (Verda caps each start argument at 253 characters, so it cannot go inline).
# Usage: agent/verda/deploy.sh <name> <hf-token-secret-name>     (run inside nix-shell)
set -euo pipefail
name="${1:?deployment name, e.g. polku-gemma-3}"
secret="${2:?name of the Verda secret holding the Hugging Face token}"
dir="$(cd "$(dirname "$0")" && pwd)"
template_secret="polku-gemma3-template"

# The CLI can mount file secrets but not create them, so use the API with the CLI's credentials.
node - "$dir/gemma3-tools.jinja" "$template_secret" <<'JS'
const fs = require("fs");
const [file, secretName] = process.argv.slice(2);
const creds = Object.fromEntries(
  fs.readFileSync(`${process.env.HOME}/.verda/credentials`, "utf8")
    .split("\n").map((l) => l.match(/^\s*(\w+)\s*=\s*(.*?)\s*$/)).filter(Boolean).map((m) => [m[1], m[2]]),
);
const base = (creds.verda_base_url || "https://api.verda.com/v1").replace(/\/$/, "");
(async () => {
  const tok = await fetch(`${base}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "client_credentials", client_id: creds.verda_client_id, client_secret: creds.verda_client_secret }),
  });
  if (!tok.ok) throw new Error(`token: HTTP ${tok.status}`);
  const headers = { Authorization: `Bearer ${(await tok.json()).access_token}`, "Content-Type": "application/json" };
  // Replace any earlier version. Fails harmlessly if it does not exist or is still mounted.
  await fetch(`${base}/file-secrets/${secretName}`, { method: "DELETE", headers });
  const res = await fetch(`${base}/file-secrets`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name: secretName, files: [{ file_name: "gemma3-tools.jinja", base64_content: fs.readFileSync(file).toString("base64") }] }),
  });
  if (!res.ok) throw new Error(`file secret: HTTP ${res.status} ${await res.text()}`);
  console.log(`✓ File secret ${secretName} uploaded`);
})().catch((e) => { console.error(e.message); process.exit(1); });
JS

verda container create \
  --name "$name" \
  --image docker.io/vllm/vllm-openai:v0.29.0 \
  --compute L40S --compute-size 1 \
  --port 8000 \
  --min-replicas 1 --max-replicas 1 --concurrency 8 \
  --env-secret "HF_TOKEN=$secret" \
  --secret-mount "$template_secret:/templates" \
  --cmd=--model --cmd=google/gemma-3-12b-it \
  --cmd=--max-model-len --cmd=16384 \
  --cmd=--enable-auto-tool-choice --cmd=--tool-call-parser --cmd=pythonic \
  --cmd=--chat-template --cmd=/templates/gemma3-tools.jinja \
  -y
