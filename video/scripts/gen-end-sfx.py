"""Synthesize the ending's build: a riser locked to the score's 120 BPM grid, and a sub thump for each hit.
Pure numpy, deterministic. Usage: python3 scripts/gen-end-sfx.py
The riser runs 3.5 s: snare roll 8ths -> 16ths -> 32nds -> 64ths over an opening noise sweep, hard stop."""
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


# Riser: 7 beats of 0.5 s = 3.5 s.
LEN = 3.5
n = int(LEN * SR)
t = np.arange(n) / SR
p = t / LEN
sweep = lowpass(rng.standard_normal(n), 250 * (40 ** p)) * (0.05 + 0.6 * p**2.2)
roll = np.zeros(n)
grid = [(0.0, 1.0, BEAT / 2), (1.0, 2.0, BEAT / 4), (2.0, 3.0, BEAT / 8), (3.0, 3.5, BEAT / 16)]
hit = snare()
for a, b, step in grid:
    k = a
    while k < b - 1e-9:
        i = int(k * SR)
        g = 0.25 + 0.75 * (k / LEN) ** 1.5
        seg = hit[: n - i] * g
        roll[i : i + len(seg)] += seg
        k += step
x = sweep + 0.55 * roll
x[-int(0.004 * SR) :] *= np.linspace(1, 0, int(0.004 * SR))  # hard stop, no click
write("end-riser.wav", x / np.abs(x).max() * 0.9)

# Sub thump: pitch drop 110 -> 42 Hz, short click on top.
d = 0.6
t = np.arange(int(d * SR)) / SR
f = 42 + 68 * np.exp(-t / 0.05)
ph = 2 * np.pi * np.cumsum(f) / SR
thump = np.sin(ph) * np.exp(-t / 0.18)
thump[: int(0.003 * SR)] += rng.standard_normal(int(0.003 * SR)) * 0.4
write("end-thump.wav", thump / np.abs(thump).max() * 0.9)
print("ok end-riser.wav end-thump.wav")
