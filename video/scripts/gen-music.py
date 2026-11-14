"""Generate the score with the ElevenLabs CLI (run `elevenlabs auth login` first).
One chunk per section of scripts/music-plan.json, durations matched to the scenes in src/v2/Video2.tsx.
Usage: python3 scripts/gen-music.py [out.mp3]   (default public/v2/music/score.mp3)"""
import json, os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
CLI = os.path.join(HERE, "..", "..", "node_modules", ".bin", "elevenlabs")
out = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "public", "v2", "music", "score.mp3"))
plan = json.load(open(os.path.join(HERE, "music-plan.json")))
bpm = next(s for s in plan["positive_global_styles"] if "BPM" in s).split("steady ")[1].split(",")[0]

# music_v2_5 takes "chunks", not the v1 sections/global styles shape.
chunks = [
    {
        "text": f"[{s['section_name'].split(' (')[0]}]",
        "duration_ms": s["duration_ms"],
        "positive_styles": [bpm, "instrumental"] + s["positive_local_styles"],
        "negative_styles": plan["negative_global_styles"] + s["negative_local_styles"],
        "context_adherence": "high",
    }
    for s in plan["sections"]
]
body = json.dumps({"composition_plan": {"chunks": chunks}, "model_id": "music_v2_5"})

# The CLI saves binary responses as ./download.mp3 in the working directory.
with tempfile.TemporaryDirectory() as tmp:
    r = subprocess.run([CLI, "music", "compose", "--json", body, "--output-format", "mp3_48000_192"], cwd=tmp, capture_output=True, text=True)
    got = os.path.join(tmp, "download.mp3")
    if r.returncode != 0 or not os.path.exists(got):
        sys.exit(f"FAIL {r.stdout[:500]} {r.stderr[:500]}")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    os.replace(got, out)
print("ok", out, sum(c["duration_ms"] for c in chunks), "ms")
