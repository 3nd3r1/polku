import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Label } from "../components";
import { C, FPS, MONO, s } from "../theme";
import { PeopleCtx } from "./people";
import { MusicBed, Soundtrack } from "./audio";
import { A_Table, B_Text, C_Dial, D_Call, E_Promise, F_Nurse, G_112, H_Map, K_End, O_Ontology, P_Sovereign, PROMISE_CLOCK_START } from "./scenes2";

// docs/hackathon/story-and-demo.md, "Video (2:00 hard cap)". Ending: partners, the ontology build, the drop.
// Every length is a multiple of 0.5 s so the score's 120 BPM grid stays put; the cut lands at 1:59.
// `src` is where the scene's slice of the score starts (score.mp3 seconds): the score was composed
// to the original scene lengths, so each scene plays its own section, trimmed to its new length.
export const SCENES2 = [
  { id: "A-table", sec: 10.5, src: 0, C: A_Table }, // 0:00-0:10.5
  { id: "B-text", sec: 8, src: 12, C: B_Text }, // -0:18.5
  { id: "C-dial", sec: 8, src: 22, C: C_Dial }, // -0:26.5
  { id: "D-call", sec: 33.5, src: 30, C: D_Call }, // -1:00
  { id: "E-promise", sec: 7, src: 65, C: E_Promise }, // -1:07
  { id: "F-nurse", sec: 13, src: 72, C: F_Nurse }, // -1:20
  { id: "G-112", sec: 7.5, src: 85, C: G_112 }, // -1:27.5
  { id: "H-map", sec: 11, src: 93, C: H_Map }, // -1:38.5
  { id: "P-sovereign", sec: 4.5, src: 100, C: P_Sovereign }, // -1:43
  { id: "O-ontology", sec: 8, src: 104.5, C: O_Ontology }, // -1:51
  { id: "K-end", sec: 8, src: null, C: K_End }, // -1:59
] as const;

const starts: number[] = [];
SCENES2.reduce((acc, sc) => (starts.push(acc), acc + s(sc.sec)), 0);
export const TOTAL2 = SCENES2.reduce((a, sc) => a + s(sc.sec), 0);
const at = (id: string) => starts[SCENES2.findIndex((x) => x.id === id)];

const p2 = (n: number) => String(n).padStart(2, "0");

/** The one device through the film: the counter in the corner. Day 49, then it flips to the countdown. */
const Counter2: React.FC = () => {
  const f = useCurrentFrame();
  const show = f >= s(1.2) && f < at("G-112") && !(f >= at("B-text") && f < at("C-dial"));
  if (!show) return null;
  const flipAt = at("E-promise") + PROMISE_CLOCK_START;
  const nurseAt = at("F-nurse");
  const flip = interpolate(f, [flipAt, flipAt + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  let left = 48 * 3600 - Math.max(0, Math.floor((f - flipAt) / FPS)) - 1;
  // Nurse beat: fast-forward to the callback, Sun 19:33 = 2 h 14 min before the deadline.
  const ffFrom = 48 * 3600 - Math.floor((nurseAt - flipAt) / FPS) - 1;
  if (f >= nurseAt) left = Math.round(interpolate(f, [nurseAt, nurseAt + s(1.6)], [ffFrom, 2 * 3600 + 14 * 60], { extrapolateRight: "clamp" }));
  const kept = f >= nurseAt + s(1.6);
  const box: React.CSSProperties = {
    position: "absolute",
    right: 96,
    top: 80,
    border: `1px solid ${C.line}`,
    backgroundColor: C.panel,
    padding: "12px 18px",
    minWidth: 250,
    overflow: "hidden",
    height: 86,
  };
  const row = (y: number): React.CSSProperties => ({ position: "absolute", left: 18, right: 18, top: 12 + y });
  return (
    <div style={box}>
      <div style={{ ...row(-flip * 90), opacity: 1 - flip }}>
        <div style={{ fontFamily: MONO, fontSize: 38, color: C.fg }}>Day 49</div>
        <Label size={13}>Since the first cough</Label>
      </div>
      <div style={{ ...row((1 - flip) * 90), opacity: flip }}>
        <div style={{ fontFamily: MONO, fontSize: 38, color: kept ? C.ok : C.fg, fontVariantNumeric: "tabular-nums" }}>
          {kept ? "Kept" : `${p2(Math.floor(left / 3600))}:${p2(Math.floor((left % 3600) / 60))}:${p2(left % 60)}`}
        </div>
        <Label size={13} color={kept ? C.ok : C.muted}>
          {kept ? "Callback 2 h 14 min early" : "Nurse callback due"}
        </Label>
      </div>
    </div>
  );
};

export const PolkuVideo2: React.FC<{ people?: boolean }> = ({ people = false }) => (
  <PeopleCtx.Provider value={people}>
  <AbsoluteFill style={{ backgroundColor: C.base }}>
    {SCENES2.map((sc, i) => (
      <Sequence key={sc.id} name={sc.id} from={starts[i]} durationInFrames={s(sc.sec)}>
        <sc.C />
      </Sequence>
    ))}
    {/* Ringback, Finnish 425 Hz. The only sound until VO and call audio are added. */}
    <Sequence from={at("C-dial") + s(0.6)} durationInFrames={s(1.2)}>
      <Html5Audio src={staticFile("v2/ring.wav")} />
    </Sequence>
    <Soundtrack people={people} sceneStart={at} />
    <MusicBed people={people} sceneStart={at} scenes={SCENES2} />
    <Counter2 />
  </AbsoluteFill>
  </PeopleCtx.Provider>
);
