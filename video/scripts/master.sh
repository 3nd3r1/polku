#!/usr/bin/env bash
# Master the render's audio: two-pass loudnorm to -14 LUFS, -1 dBTP, video stream copied.
# Usage: scripts/master.sh in.mp4 out.mp4   (needs ffmpeg: nix-shell -p ffmpeg)
set -euo pipefail
in=$1; out=$2
m=$(ffmpeg -hide_banner -nostats -i "$in" -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$m" | sed -n "s/.*\"$1\" : \"\(.*\)\".*/\1/p"; }
ffmpeg -hide_banner -v error -y -i "$in" -c:v copy -c:a aac -b:a 256k -ar 48000 \
  -af "loudnorm=I=-14:TP=-1:LRA=11:linear=true:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset)" \
  "$out"
echo "mastered $out"
