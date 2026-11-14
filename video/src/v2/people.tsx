/**
 * Live-action variant of video 2: Matti as AI-generated footage (Higgsfield: GPT Image 2.6
 * keyframes, Seedance 2.5 animation). Fictional person. Labelled on screen as AI-generated.
 * Clips live in public/v2/people/.
 */
import React, { createContext, useContext } from "react";
import { AbsoluteFill, Img, Loop, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { ClockBar, Label, Src, Subtitle, pad2 } from "../components";
import { C, FPS, MONO, SANS, s } from "../theme";

export const PeopleCtx = createContext(false);
export const usePeople = () => useContext(PeopleCtx);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const src = (f: string) => staticFile(`v2/people/${f}`);

/** Footage is graded toward the design palette: desaturated, slightly crushed. */
const GRADE = "saturate(0.55) contrast(1.06) brightness(0.92)";

export const AiLabel: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{ position: "absolute", left: 96, bottom: 80, ...style }}>
    <Label size={15} color={C.muted}>
      Matti is fictional / AI-generated footage
    </Label>
  </div>
);

const Footage: React.FC<{
  file: string;
  rate?: number;
  muted?: boolean;
  volume?: number;
  trimBefore?: number;
  style?: React.CSSProperties;
}> = ({ file, rate = 1, muted = true, volume = 1, trimBefore, style }) => (
  <OffthreadVideo
    src={src(file)}
    trimBefore={trimBefore}
    muted={muted}
    volume={volume}
    playbackRate={rate}
    style={{ width: "100%", height: "100%", objectFit: "cover", filter: GRADE, ...style }}
  />
);

/* 0:00-0:12  Kitchen table. Real cough from the clip's own audio. */
export const A_TablePeople: React.FC = () => {
  const f = useCurrentFrame();
  const fadeIn = interpolate(f, [0, s(1.2)], [0, 1], clamp);
  const CLIP = s(8);
  const START = s(0.3);
  return (
    <AbsoluteFill style={{ backgroundColor: C.base, fontFamily: SANS, color: C.fg }}>
      <AbsoluteFill style={{ opacity: fadeIn }}>
        <Sequence from={START} durationInFrames={CLIP}>
          <Footage file="shot1-table.mp4" muted={false} volume={0.9} />
        </Sequence>
        {/* hold the last frame for the rest of the beat */}
        <Sequence from={START + CLIP}>
          <Img src={src("shot1-last.png")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: GRADE }} />
        </Sequence>
        {f < START && <Img src={src("matti-base.png")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: GRADE }} />}
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 96, top: 88, opacity: fadeIn, backgroundColor: C.panel, border: `1px solid ${C.line}`, padding: "10px 14px" }}>
        <Label size={18} color={C.fg}>
          Matti, 71 / Keski-Suomi / lives alone
        </Label>
      </div>
      <Subtitle
        from={s(5.2)}
        to={s(10.3)}
        speaker="Matti"
        text="Ei se varmaan mitään ole. En viitsi vaivata ketään."
        sub="It's probably nothing. I don't want to bother anyone."
      />
      <AiLabel />
    </AbsoluteFill>
  );
};

/* 0:22-0:30, first part: he dials. Cuts to the drawn phone when the agent answers. */
export const DialFootage: React.FC<{ until: number }> = ({ until }) => {
  const f = useCurrentFrame();
  if (f >= until) return null;
  return (
    <AbsoluteFill style={{ backgroundColor: C.base }}>
      <Footage file="shot2-dial.mp4" trimBefore={s(2.4)} />
      <AiLabel />
    </AbsoluteFill>
  );
};

/* 0:30-1:05: Matti on the line, left column.
   The loop file never stops or reverses: its last frames dissolve into its first, so motion
   is continuous across the seam (made with ffmpeg xfade, frozen start frames of the take
   dropped). A slow push-in runs across the whole beat, outside the loop, so the framing never
   resets either. */
const CALL_FILE = "shot3-call-xfade.mp4";
const CALL_FILE_FRAMES = 63; // at 24 fps
const CALL_LOOP = 93; // composition frames per loop at 30 fps
const CALL_RATE = (CALL_FILE_FRAMES / 24) * FPS / CALL_LOOP; // ~0.85x

export const CallFootage: React.FC<{ speaking: string | null; secs: number }> = ({ speaking, secs }) => {
  const f = useCurrentFrame();
  const push = interpolate(f, [0, s(35)], [1.0, 1.1], clamp);
  return (
    <div style={{ position: "absolute", left: 96, top: 170, width: 700, height: 600, border: `1px solid ${C.line}`, overflow: "hidden", backgroundColor: C.panel }}>
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "48% 35%" }}>
        <Loop durationInFrames={CALL_LOOP}>
          <Footage file={CALL_FILE} rate={CALL_RATE} style={{ objectPosition: "45% 40%" }} />
        </Loop>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: 0, backgroundColor: C.panel, borderRight: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, padding: "8px 12px" }}>
        <Label size={14} color={C.ok}>
          On the line {pad2(Math.floor(secs / 60))}:{pad2(secs % 60)}
        </Label>
      </div>
      {speaking && (
        <div style={{ position: "absolute", right: 0, bottom: 0, backgroundColor: C.panel, borderLeft: `1px solid ${C.line}`, borderTop: `1px solid ${C.line}`, padding: "8px 12px" }}>
          <Label size={14} color={C.fg}>
            {speaking}
          </Label>
        </div>
      )}
      <div style={{ position: "absolute", left: 12, bottom: 10 }}>
        <Label size={12} color={C.muted}>
          Fictional / AI-generated
        </Label>
      </div>
    </div>
  );
};

/* 1:05-1:12: the promise, over his face. Countdown starts. Silence. */
export const E_PromisePeople: React.FC<{ clockStart: number }> = ({ clockStart }) => {
  const f = useCurrentFrame();
  const started = f >= clockStart;
  const left = 48 * 3600 - Math.max(0, Math.floor((f - clockStart) / FPS)) - (started ? 1 : 0);
  const words = "A nurse will call you by Sunday 21:47.".split(" ");
  return (
    <AbsoluteFill style={{ backgroundColor: C.base, fontFamily: SANS, color: C.fg }}>
      <AbsoluteFill>
        <Footage file="shot4-promise.mp4" rate={6 / 7} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 96, top: 230, width: 820 }}>
        <Label size={18} style={{ marginBottom: 20 }}>
          Polku / AI agent
        </Label>
        <div style={{ fontSize: 80, fontWeight: 300, lineHeight: 1.12 }}>
          {words.map((w, i) => {
            const at = s(0.1) + i * 10;
            return (
              <span key={i} style={{ opacity: interpolate(f, [at, at + 5], [0, 1], clamp) }}>
                {w}{" "}
              </span>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: 96, top: 660, width: 760, opacity: started ? 1 : 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 110, fontVariantNumeric: "tabular-nums" }}>
          {pad2(Math.floor(left / 3600))}:{pad2(Math.floor((left % 3600) / 60))}:{pad2(left % 60)}
        </div>
        <div style={{ marginTop: 18 }}>
          <ClockBar width={760} fill={interpolate(f, [clockStart, s(7)], [0, 5 / (48 * 3600)], clamp)} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontFamily: MONO, fontSize: 15, color: C.dim }}>
          <span>Fri 21:47</span>
          <span>Sun 21:47</span>
        </div>
      </div>
      <div style={{ position: "absolute", right: 96, bottom: 80, fontSize: 18, color: C.muted }}>
        <Src id="POLKU">Callback limit is a Polku design choice, not from a published pathway</Src>
      </div>
      <AiLabel />
    </AbsoluteFill>
  );
};
