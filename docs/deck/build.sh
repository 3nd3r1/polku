#!/usr/bin/env bash
# Builds docs/polku-deck.pdf from docs/deck/deck.html. Run from the repo root after npm install (fonts come from node_modules).
set -euo pipefail
cd "$(dirname "$0")"
nix-shell -p chromium --run "chromium --headless --disable-gpu --no-sandbox --no-pdf-header-footer --allow-file-access-from-files --print-to-pdf=../polku-deck.pdf file://$PWD/deck.html"
