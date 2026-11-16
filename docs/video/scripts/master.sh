#!/usr/bin/env bash
# Master the render's audio: one static gain to -14 LUFS, then a true-peak limiter at -1 dBTP.
# Static gain (not loudnorm's dynamic mode) so the drop keeps its punch. Video stream copied.
# Usage: scripts/master.sh in.mp4 out.mp4   (needs ffmpeg: nix-shell -p ffmpeg)
set -euo pipefail
in=$1; out=$2
I=$(ffmpeg -hide_banner -nostats -i "$in" -af ebur128 -f null - 2>&1 | sed -n 's/^ *I: *\(-\?[0-9.]*\) LUFS/\1/p' | tail -1)
# The limiter costs some loudness, so measure the result and correct the gain once.
LIM="alimiter=limit=0.75:level=false:attack=1:release=60"
gain=$(python3 -c "print(round(-14 - ($I), 2))")
for pass in 1 2; do
  ffmpeg -hide_banner -v error -y -i "$in" -c:v copy -c:a aac -b:a 256k -ar 48000 -af "volume=${gain}dB,$LIM" "$out"
  got=$(ffmpeg -hide_banner -nostats -i "$out" -af ebur128 -f null - 2>&1 | sed -n 's/^ *I: *\(-\?[0-9.]*\) LUFS/\1/p' | tail -1)
  gain=$(python3 -c "print(round($gain + (-14 - ($got)), 2))")
done
echo "mastered $out (input $I LUFS, output $got LUFS)"
