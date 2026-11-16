"""Generate voice lines with the ElevenLabs CLI (run `elevenlabs auth login` first).
Usage: python3 scripts/gen-voice.py [line-id ...]   (no ids = only missing files)"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
CLI = os.path.join(HERE, "..", "..", "node_modules", ".bin", "elevenlabs")
OUT = os.path.join(HERE, "..", "public", "v2", "voice")
cfg = json.load(open(os.path.join(HERE, "voice-lines.json")))
os.makedirs(OUT, exist_ok=True)
only = set(sys.argv[1:])

for line in cfg["lines"]:
    path = os.path.join(OUT, f"{line['id']}.mp3")
    if only and line["id"] not in only:
        continue
    if not only and os.path.exists(path):
        continue
    v = cfg["voices"][line["voice"]]
    cmd = [CLI, "text-to-speech", "convert", "--voice-id", v["id"], "--text", line["text"],
           "--model-id", "eleven_multilingual_v2", "--output-format", "mp3_44100_128",
           "--voice-settings.stability", "0.5", "--voice-settings.similarity-boost", "0.8",
           "-o", path, "-q"]
    if line.get("speed"):
        cmd += ["--voice-settings.speed", str(line["speed"])]
    if v.get("lang"):
        cmd += ["--language-code", v["lang"]]
    for k, val in v.get("effects", {}).items():
        cmd += [f"--audio-effects.{k}", val]
    r = subprocess.run(cmd, capture_output=True, text=True)
    print(("ok   " if r.returncode == 0 else "FAIL ") + line["id"], r.stderr.strip()[:300])
