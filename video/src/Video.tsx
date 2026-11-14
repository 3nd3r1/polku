import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { Label } from "./components";
import { Call, Cockpit, Code, ColdOpen, Dial, End, Nurse, PromiseScene, RedFlag, TheNumber } from "./scenes";
import { C, FPS, MONO, s } from "./theme";

// Beat sheet: docs/story-and-demo.md "Video". Durations in seconds.
export const SCENES = [
  { id: "cold-open", sec: 10, C: ColdOpen },
  { id: "number", sec: 10, C: TheNumber },
  { id: "dial", sec: 8, C: Dial },
  { id: "call", sec: 33, C: Call },
  { id: "promise", sec: 7, C: PromiseScene },
  { id: "nurse", sec: 12, C: Nurse },
  { id: "red-flag", sec: 7, C: RedFlag },
  { id: "cockpit", sec: 15, C: Cockpit },
  { id: "code", sec: 6, C: Code },
  { id: "end", sec: 7, C: End },
] as const;

const starts: number[] = [];
SCENES.reduce((acc, sc) => (starts.push(acc), acc + s(sc.sec)), 0);
export const TOTAL = SCENES.reduce((a, sc) => a + s(sc.sec), 0);
const startOf = (id: string) => starts[SCENES.findIndex((x) => x.id === id)];

/** The one device through the film: a counter in the top right corner. */
const Counter: React.FC = () => {
  const f = useCurrentFrame();
  const promiseAt = startOf("promise");
  const endAt = startOf("red-flag");
  if (f < s(1) || f >= endAt) return null;
  const o = interpolate(f, [s(1), s(1.5)], [0, 1], { extrapolateRight: "clamp" });
  const box: React.CSSProperties = { position: "absolute", right: 96, top: 80, textAlign: "right", opacity: o };
  if (f < promiseAt) {
    return (
      <div style={box}>
        <div style={{ fontFamily: MONO, fontSize: 44, color: C.fg, fontVariantNumeric: "tabular-nums" }}>Day 49</div>
        <Label size={15}>Since the first cough</Label>
      </div>
    );
  }
  const nurseAt = startOf("nurse");
  if (f < nurseAt) return null; // the promise scene shows the countdown full size
  // Fast-forward in sync with the nurse scene's callback bar: kept with 2 h 14 min to spare.
  const realLeft = 48 * 3600 - Math.floor((nurseAt - promiseAt - s(1.6)) / FPS) - 1;
  const keptLeft = 2 * 3600 + 14 * 60;
  const left = Math.round(
    interpolate(f, [nurseAt + s(4), nurseAt + s(6.4)], [realLeft, keptLeft], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );
  const kept = f >= nurseAt + s(6.6);
  const p2 = (n: number) => String(n).padStart(2, "0");
  return (
    <div style={box}>
      <div style={{ fontFamily: MONO, fontSize: 44, color: C.fg, fontVariantNumeric: "tabular-nums" }}>
        {p2(Math.floor(left / 3600))}:{p2(Math.floor((left % 3600) / 60))}:{p2(left % 60)}
      </div>
      <Label size={15} color={kept ? C.ok : C.muted}>{kept ? "Callback done / promise kept" : "Nurse callback due"}</Label>
    </div>
  );
};

export const PolkuVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.base }}>
    {SCENES.map((sc, i) => (
      <Sequence key={sc.id} name={sc.id} from={starts[i]} durationInFrames={s(sc.sec)}>
        <sc.C />
      </Sequence>
    ))}
    <Counter />
  </AbsoluteFill>
);
