import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, MONO, SANS } from "./theme";

export const ease = Easing.out(Easing.cubic);

/** 0 -> 1 over `dur` frames starting at `start`, ease-out. */
export const useIn = (start: number, dur = 7) => {
  const f = useCurrentFrame();
  return interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
};

/** Fade + 12px rise, the only entrance we use. */
export const Appear: React.FC<{ at: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  at,
  dur = 7,
  children,
  style,
}) => {
  const p = useIn(at, dur);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 12}px)`, ...style }}>{children}</div>;
};

export const Label: React.FC<{ children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({
  children,
  color = C.muted,
  size = 20,
  style,
}) => (
  <div
    style={{
      fontFamily: MONO,
      fontSize: size,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Wordmark: React.FC<{ height?: number }> = ({ height = 28 }) => (
  <Img src={staticFile("polku-lockup.svg")} style={{ height }} />
);

/** Slide frame from docs/design.md: wordmark top left, section bottom left, source bottom right. */
export const Frame: React.FC<{
  section?: string;
  source?: React.ReactNode;
  wordmark?: boolean;
  children: React.ReactNode;
}> = ({ section, source, wordmark = true, children }) => (
  <AbsoluteFill style={{ backgroundColor: C.base, fontFamily: SANS, color: C.fg }}>
    {wordmark && (
      <div style={{ position: "absolute", left: 96, top: 88 }}>
        <Wordmark />
      </div>
    )}
    {children}
    {section && (
      <div style={{ position: "absolute", left: 96, bottom: 80 }}>
        <Label size={18}>{section}</Label>
      </div>
    )}
    {source && (
      <div
        style={{
          position: "absolute",
          right: 96,
          bottom: 80,
          fontSize: 18,
          color: C.muted,
          textAlign: "right",
          lineHeight: 1.5,
          maxWidth: 1100,
        }}
      >
        {source}
      </div>
    )}
  </AbsoluteFill>
);

export const Src: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <div>
    <span style={{ color: C.info, fontFamily: MONO, fontSize: 16 }}>{id}</span> {children}
  </div>
);

/** Burned-in subtitle. Speaker label in mono, line in sans. */
export const Subtitle: React.FC<{
  from: number;
  to: number;
  speaker?: string;
  text: string;
  sub?: string;
  bottom?: number;
}> = ({ from, to, speaker, text, sub, bottom = 150 }) => {
  const f = useCurrentFrame();
  if (f < from || f >= to) return null;
  const o = interpolate(f, [from, from + 5, to - 5, to], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom,
        display: "flex",
        justifyContent: "center",
        opacity: o,
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(10,11,11,0.86)",
          border: `1px solid ${C.line}`,
          padding: "18px 28px",
          maxWidth: 1400,
          textAlign: "center",
        }}
      >
        {speaker && (
          <Label size={16} style={{ marginBottom: 8 }}>
            {speaker}
          </Label>
        )}
        <div style={{ fontFamily: SANS, fontSize: 38, fontWeight: 400, color: C.fg, lineHeight: 1.3 }}>{text}</div>
        {sub && <div style={{ fontFamily: SANS, fontSize: 26, color: C.muted, marginTop: 6 }}>{sub}</div>}
      </div>
    </div>
  );
};

export const Square: React.FC<{ color?: string; size?: number }> = ({ color = C.fg, size = 12 }) => (
  <div style={{ width: size, height: size, backgroundColor: color, flexShrink: 0 }} />
);

/** Clock bar: track in line-strong, fill left to right. */
export const ClockBar: React.FC<{ width: number; fill: number; color?: string; height?: number }> = ({
  width,
  fill,
  color = C.fg,
  height = 10,
}) => (
  <div style={{ width, height, backgroundColor: C.lineStrong, position: "relative" }}>
    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: width * Math.max(0, Math.min(1, fill)), backgroundColor: color }} />
  </div>
);

export const pad2 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, "0");
