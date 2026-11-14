/**
 * Video 2 soundtrack. Voices: ElevenLabs TTS (scripts/voice-lines.json, scripts/gen-voice.py).
 * Effects: ElevenLabs sound effects in public/v2/sfx. Starts are scene-local seconds and match
 * the subtitle timings in scenes2.tsx / people.tsx.
 */
import React from "react";
import { Html5Audio, Loop, Sequence, interpolate, staticFile } from "remotion";
import { s } from "../theme";
import { END_TIMES, G_TIMES, O_TIMES, P_TIMES } from "./scenes2";

type Cue = { scene: string; at: number; file: string; volume?: number; loopSec?: number; durSec?: number; voiceSec?: number };

// Measured with ffprobe. Regenerate if a voice line is regenerated.
const VOICE_SEC: Record<string, number> = {
  "a-matti-fi": 4.85, "c-agent-greet": 5.16, "d-agent-1": 2.19, "d-agent-2": 1.77, "d-agent-3": 2.89,
  "d-agent-4": 2.38, "d-agent-5": 1.73, "d-matti-1": 4.53, "d-matti-2": 4.85, "d-matti-3": 2.39,
  "d-matti-4": 2.34, "e-agent-promise": 3.16, "f-vo": 4.6, "g-vo": 3.67, "h-vo-1": 2.97,
  "h-vo-2": 2.88, "k-vo-close": 5.25, "p-vo": 4.13, "o-vo": 7.01,
};

const voice = (scene: string, at: number, id: string, volume = 1): Cue => ({
  scene, at, file: `v2/voice/${id}.mp3`, volume, voiceSec: VOICE_SEC[id],
});

export function cues(people: boolean): Cue[] {
  return [
    // A: kitchen. In the live-action cut the clip carries its own cough.
    { scene: "A-table", at: 0, file: "v2/sfx/room-clock.mp3", volume: 0.25, durSec: 10.5 },
    voice("A-table", people ? 5.2 : 3.4, "a-matti-fi", 0.95),
    // C: ring (Video2.tsx), answer click, the agent greets.
    { scene: "C-dial", at: 3.6, file: "v2/sfx/answer-click.mp3", volume: 0.5 },
    voice("C-dial", 3.7, "c-agent-greet"),
    // D: the call, over a quiet line ambience.
    { scene: "D-call", at: 0, file: "v2/sfx/line-ambience.mp3", volume: 0.18, loopSec: 12, durSec: 33.5 },
    voice("D-call", 1.2, "d-matti-1"),
    voice("D-call", 7.6, "d-agent-1"),
    voice("D-call", 10.1, "d-agent-2"),
    voice("D-call", 12.2, "d-matti-2"),
    voice("D-call", 17.4, "d-agent-3"),
    voice("D-call", 20.6, "d-matti-3"),
    voice("D-call", 23.4, "d-agent-4"),
    voice("D-call", 26.1, "d-matti-4"),
    voice("D-call", 31.0, "d-agent-5"),
    // E: the promise, then silence (plan: no VO over the 2 s after it).
    voice("E-promise", 0.1, "e-agent-promise"),
    voice("F-nurse", 8.2, "f-vo"),
    // G: the hit lands when the rule fires, the VO after the agent's line (scenes2.tsx G_TIMES).
    { scene: "G-112", at: G_TIMES.ruleAt, file: "v2/sfx/hit-112.mp3", volume: 0.8 },
    voice("G-112", G_TIMES.voAt, "g-vo"),
    voice("H-map", 0.8, "h-vo-1"),
    voice("H-map", 4.8, "h-vo-2"),
    voice("P-sovereign", P_TIMES.vo, "p-vo"),
    // O: thumps accelerate with the build: bars, then beats, then 8ths. The riser is in MusicBed.
    ...[0.15, 2.15, 4.15, 4.65, 5.15, 5.65, 6.15, 6.4, 6.65, 6.9, 7.15].map((h): Cue => ({ scene: "O-ontology", at: h, file: "v2/sfx/end-thump.wav", volume: 0.5 })),
    voice("O-ontology", O_TIMES.vo, "o-vo"),
    voice("K-end", END_TIMES.vo, "k-vo-close"),
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

/**
 * Score: ElevenLabs music (scripts/gen-music.py, music-plan.json). Each scene plays its own slice of it
 * (SCENES2 `src`), so the music still turns with the scenes after they were shortened.
 * Level per scene, and the bed ducks under every voice line so speech always wins.
 */
const MUSIC_LEVEL: Record<string, number> = {
  "A-table": 1, "B-text": 1, "C-dial": 1, "D-call": 0.7, "E-promise": 0.8,
  "F-nurse": 0.9, "G-112": 1, "H-map": 0.85, "P-sovereign": 0.85, "O-ontology": 1, "K-end": 0,
};
const DUCK = 0.55;
// The ontology build has VO over nearly all of it; it ducks only a little so the music can still climb.
const DUCK_IN: Record<string, number> = { "O-ontology": 0.85 };
const RAMP = 8; // frames
const EDGE = 3; // frames of fade at each slice edge

type SceneRef = { id: string; sec: number; src: number | null };

export const MusicBed: React.FC<{ people: boolean; sceneStart: (id: string) => number; scenes: readonly SceneRef[] }> = ({ people, sceneStart, scenes }) => {
  const speech = cues(people)
    .filter((c) => c.voiceSec)
    .map((c) => [sceneStart(c.scene) + s(c.at), sceneStart(c.scene) + s(c.at + c.voiceSec!)] as const);
  const duckFor = (f: number, amount = DUCK) => {
    const d = Math.max(
      0,
      ...speech.map(([a, b]) => interpolate(f, [a - RAMP, a, b, b + RAMP], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })),
    );
    return 1 - d * (1 - amount);
  };
  const clampX = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  // 112: the bed pulls back when the emergency rule fires.
  const g = sceneStart("G-112") + s(G_TIMES.ruleAt);
  // The breath: the build and the bed stop half a beat before the drop.
  const breath = sceneStart("O-ontology") + s(O_TIMES.breath);
  const dropAt = sceneStart("K-end") + s(END_TIMES.drop);
  return (
    <>
      {scenes.map((sc) => {
        if (sc.src === null) return null;
        const from = sceneStart(sc.id);
        const len = s(sc.sec);
        const level = MUSIC_LEVEL[sc.id];
        return (
          <Sequence key={sc.id} from={from} durationInFrames={len} name={`score ${sc.id}`}>
            <Html5Audio
              src={staticFile("v2/music/score.mp3")}
              trimBefore={s(sc.src)}
              volume={(lf) => {
                const f = from + lf;
                let v = level * duckFor(f, DUCK_IN[sc.id] ?? DUCK);
                // In the build the bed itself rises too.
                if (sc.id === "O-ontology") v *= interpolate(lf, [0, len], [0.55, 1], clampX);
                v *= interpolate(lf, [0, EDGE, len - EDGE, len], [0, 1, 1, 0], clampX);
                v *= interpolate(f, [g, g + 6, g + s(2.5), g + s(4)], [1, 0.35, 0.35, 0.6], clampX);
                v *= interpolate(f, [breath - 2, breath], [1, 0], clampX);
                return v * interpolate(f, [0, s(0.5)], [0, 1], { extrapolateRight: "clamp" });
              }}
            />
          </Sequence>
        );
      })}
      {/* The ontology build: riser on the score's kicks (x.15), climbing to the breath. */}
      <Sequence from={sceneStart("O-ontology") + s(0.15)} name="onto-build">
        <Html5Audio src={staticFile("v2/sfx/onto-build.wav")} volume={(lf) => interpolate(lf, [0, s(7.5)], [0.3, 0.75], clampX)} />
      </Sequence>
      {/* The drop: impact and final chord (ElevenLabs, end-drop.mp3), its hit on the drop beat.
          Ducks less than the bed: the chord should still swell under the closing line. */}
      <Sequence from={dropAt} name="end-drop">
        <Html5Audio src={staticFile("v2/music/end-drop.mp3")} volume={(f) => 0.95 * (0.4 + 0.6 * duckFor(dropAt + f))} />
      </Sequence>
    </>
  );
};
