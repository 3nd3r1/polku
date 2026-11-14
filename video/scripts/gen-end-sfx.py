"""Synthesize the ending's build: a riser locked to the score's 120 BPM grid, and a sub thump for each hit.
Pure numpy, deterministic. Usage: python3 scripts/gen-end-sfx.py
The build runs 7.5 s: snare roll 8ths -> 16ths -> 32nds -> 64ths over an opening noise sweep and a rising
Shepard tone, hard stop at the breath before the drop."""
import os, wave
import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "public", "v2", "sfx")
rng = np.random.default_rng(7)
BEAT = 0.5


def write(name, x):
    x = np.clip(x, -1, 1)
    pcm = (np.repeat(x[:, None], 2, axis=1) * 32767 * 0.98).astype("<i2")
    with wave.open(os.path.join(OUT, name), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def lowpass(x, cutoff):
    """One-pole lowpass with a per-sample cutoff in Hz."""
    a = 1 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def snare(dur=0.09):
    t = np.arange(int(dur * SR)) / SR
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.025)
    noise = rng.standard_normal(len(t)) * np.exp(-t / 0.04)
    noise = noise - lowpass(noise, np.full(len(t), 1500.0))  # keep the bright part
    return 0.5 * body + 0.7 * noise


def riser(length, grid, shepard=False):
    """Noise sweep + snare roll on `grid` [(from, to, step) in s]; optional rising Shepard tone. Hard stop."""
    n = int(length * SR)
    t = np.arange(n) / SR
    p = t / length
    sweep = lowpass(rng.standard_normal(n), 250 * (40 ** p)) * (0.05 + 0.6 * p**2.2)
    roll = np.zeros(n)
    hit = snare()
    for a, b, step in grid:
        k = a
        while k < b - 1e-9:
            i = int(k * SR)
            g = 0.25 + 0.75 * (k / length) ** 1.5
            seg = hit[: n - i] * g
            roll[i : i + len(seg)] += seg
            k += step
    x = sweep + 0.55 * roll
    if shepard:
        # Endlessly rising tone: octave layers gliding up, each faded by a bell over log-frequency.
        tone = np.zeros(n)
        for o in range(6):
            pos = (o + p * 2.0) % 6  # two octaves of rise over the length
            f = 55 * 2**pos
            amp = np.exp(-0.5 * ((pos - 3) / 1.1) ** 2)
            tone += np.sin(2 * np.pi * np.cumsum(f) / SR) * amp
        x += tone * (0.04 + 0.22 * p**1.6)
    # Drive: saturate so the build is loud in RMS, not just on its peaks, and louder still at the top.
    x = x / np.abs(x).max()
    x = np.tanh(x * (2 + 6 * p)) / np.tanh(8)
    x[-int(0.004 * SR) :] *= np.linspace(1, 0, int(0.004 * SR))  # hard stop, no click
    return x / np.abs(x).max() * 0.9


# The ontology build: 15 beats = 7.5 s, 8ths -> 16ths -> 32nds -> 64ths, ending at the breath.
B = BEAT
write("onto-build.wav", riser(7.5, [(0, 6 * B, B / 2), (6 * B, 10 * B, B / 4), (10 * B, 13 * B, B / 8), (13 * B, 15 * B, B / 16)], shepard=True))

# Sub thump: pitch drop 110 -> 42 Hz, short click on top.
d = 0.6
t = np.arange(int(d * SR)) / SR
f = 42 + 68 * np.exp(-t / 0.05)
ph = 2 * np.pi * np.cumsum(f) / SR
thump = np.sin(ph) * np.exp(-t / 0.18)
thump[: int(0.003 * SR)] += rng.standard_normal(int(0.003 * SR)) * 0.4
write("end-thump.wav", thump / np.abs(thump).max() * 0.9)
print("ok onto-build.wav end-thump.wav")
