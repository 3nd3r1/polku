/**
 * Video 2 soundtrack. Voices: ElevenLabs TTS (scripts/voice-lines.json, scripts/gen-voice.py).
 * Effects: ElevenLabs sound effects in public/v2/sfx. Starts are scene-local seconds and match
 * the subtitle timings in scenes2.tsx / people.tsx.
 */
import React from "react";
import { Html5Audio, Loop, Sequence, staticFile } from "remotion";
import { s } from "../theme";

type Cue = { scene: string; at: number; file: string; volume?: number; loopSec?: number; durSec?: number };

const voice = (scene: string, at: number, id: string, volume = 1): Cue => ({ scene, at, file: `v2/voice/${id}.mp3`, volume });

export function cues(people: boolean): Cue[] {
  return [
    // A: kitchen. In the live-action cut the clip carries its own cough.
    { scene: "A-table", at: 0, file: "v2/sfx/room-clock.mp3", volume: 0.25, durSec: 12 },
    voice("A-table", people ? 5.2 : 3.4, "a-matti-fi", 0.95),
    // C: ring (Video2.tsx), answer click, the agent greets.
    { scene: "C-dial", at: 3.6, file: "v2/sfx/answer-click.mp3", volume: 0.5 },
    voice("C-dial", 3.7, "c-agent-greet"),
    // D: the call, over a quiet line ambience.
    { scene: "D-call", at: 0, file: "v2/sfx/line-ambience.mp3", volume: 0.18, loopSec: 12, durSec: 35 },
    voice("D-call", 1.2, "d-matti-1"),
    voice("D-call", 7.6, "d-agent-1"),
    voice("D-call", 10.1, "d-agent-2"),
    voice("D-call", 12.2, "d-matti-2"),
    voice("D-call", 17.4, "d-agent-3"),
    voice("D-call", 20.6, "d-matti-3"),
    voice("D-call", 23.4, "d-agent-4"),
    voice("D-call", 26.1, "d-matti-4"),
    voice("D-call", 32.4, "d-agent-5"),
    // E: the promise, then silence (plan: no VO over the 2 s after it).
    voice("E-promise", 0.1, "e-agent-promise"),
    voice("F-nurse", 8.2, "f-vo"),
    { scene: "G-112", at: 0, file: "v2/sfx/hit-112.mp3", volume: 0.8 },
    voice("G-112", 1.6, "g-vo"),
    voice("H-map", 0.8, "h-vo-1"),
    voice("H-map", 4.8, "h-vo-2"),
    voice("I-code", 0.7, "i-vo"),
    voice("J-logo", 0.6, "j-vo"),
  ];
}

export const Soundtrack: React.FC<{ people: boolean; sceneStart: (id: string) => number }> = ({ people, sceneStart }) => (
  <>
    {cues(people).map((c, i) => {
      const from = sceneStart(c.scene) + s(c.at);
      const audio = <Html5Audio src={staticFile(c.file)} volume={c.volume ?? 1} />;
      return (
        <Sequence key={i} from={from} durationInFrames={c.durSec ? s(c.durSec) : undefined} name={`audio ${c.file}`}>
          {c.loopSec ? <Loop durationInFrames={s(c.loopSec)}>{audio}</Loop> : audio}
        </Sequence>
      );
    })}
  </>
);
