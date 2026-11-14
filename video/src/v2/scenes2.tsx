/**
 * Video 2: built strictly to the beat sheet in docs/story-and-demo.md, "Video (2:00 hard cap)".
 * Dialogue is the scripted Matti call from src/components/screening.tsx (synthetic people).
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Appear, ClockBar, Frame, Label, Square, Src, Subtitle, Wordmark, ease, pad2, useIn } from "../components";
import { C, FPS, MONO, SANS, s } from "../theme";
import { COUNTY_SEATS, makeDots } from "./finland";
import { A_TablePeople, CallFootage, DialFootage, E_PromisePeople, usePeople } from "./people";

export const FACTS2 = {
  // UNVERIFIED (docs/story-and-demo.md, "Facts to check"). Swap for the strategy's +14 points if it doesn't hold.
  heroDays: 155,
  heroSource: "Yle MOT, yle.fi/a/74-20251023",
};

const GREETING = "Hi, this is Polku, the lung symptom line. I'm an AI assistant. To identify you, please tell me your personal identity code.";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* A phone, drawn with the shape rules: square, hairline, no device chrome. */
const Phone: React.FC<{ w?: number; h?: number; lit?: number; children?: React.ReactNode; style?: React.CSSProperties }> = ({
  w = 340,
  h = 680,
  lit = 1,
  children,
  style,
}) => (
  <div
    style={{
      width: w,
      height: h,
      border: `1px solid ${C.lineStrong}`,
      backgroundColor: lit > 0 ? `rgba(18,20,20,${0.4 + lit * 0.6})` : C.base,
      position: "relative",
      ...style,
    }}
  >
    <div style={{ position: "absolute", top: 14, left: "50%", width: 56, height: 4, marginLeft: -28, backgroundColor: C.line }} />
    <div style={{ opacity: lit, position: "absolute", inset: 0 }}>{children}</div>
  </div>
);

/* Voice level as a row of small squares. Deterministic pseudo-noise. */
const Voice: React.FC<{ active: boolean; color?: string }> = ({ active, color = C.fg }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", height: 60 }}>
      {Array.from({ length: 18 }).map((_, i) => {
        const n = Math.abs(Math.sin(f * 0.55 + i * 1.7) * Math.cos(f * 0.31 + i * 0.9));
        const hgt = active ? 6 + n * 48 : 4;
        return <div key={i} style={{ width: 8, height: hgt, backgroundColor: active ? color : C.lineStrong }} />;
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 0:00-0:12  Kitchen table, a phone. Cough. "I don't want to bother."  */
/* ------------------------------------------------------------------ */
export const A_Table: React.FC = () => (usePeople() ? <A_TablePeople /> : <A_TableDrawn />);

const A_TableDrawn: React.FC = () => {
  const f = useCurrentFrame();
  const inP = useIn(s(0.4), 18);
  // The phone's screen flickers on near the end: he looks at it, then doesn't.
  const lit = interpolate(f, [s(9.6), s(9.9), s(11.2), s(11.6)], [0, 0.5, 0.5, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: C.base, fontFamily: SANS, color: C.fg }}>
      {/* table edge */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, height: 1, backgroundColor: C.line, opacity: inP }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, bottom: 0, backgroundColor: C.panel, opacity: inP * 0.5 }} />
      {/* phone lying flat, screen down-ish */}
      <div style={{ position: "absolute", left: 1180, top: 430, opacity: inP, transform: "rotate(-8deg)" }}>
        <Phone w={190} h={380} lit={lit}>
          <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center" }}>
            <Label size={13}>Polku</Label>
            <div style={{ fontFamily: MONO, fontSize: 13, color: C.muted, marginTop: 6 }}>Lung symptom line</div>
          </div>
        </Phone>
      </div>
      {/* a cup: one square outline, nothing more */}
      <div style={{ position: "absolute", left: 640, top: 470, width: 110, height: 110, border: `1px solid ${C.line}`, opacity: inP }} />
      <div style={{ position: "absolute", left: 96, top: 96, opacity: inP }}>
        <Label size={18}>Matti, 71 / Keski-Suomi / lives alone</Label>
        <Label size={14} color={C.dim} style={{ marginTop: 8 }}>
          Acted / synthetic person
        </Label>
      </div>
      <Subtitle from={s(1.0)} to={s(3.0)} text="*coughs*" />
      <Subtitle
        from={s(3.4)}
        to={s(8.6)}
        speaker="Matti"
        text="Ei se varmaan mitään ole. En viitsi vaivata ketään."
        sub="It's probably nothing. I don't want to bother anyone."
      />
      <Subtitle from={s(9.2)} to={s(11.4)} text="*coughs*" />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* 0:12-0:22  Text on black                                             */
/* ------------------------------------------------------------------ */
export const B_Text: React.FC = () => {
  const f = useCurrentFrame();
  const n = Math.round(interpolate(f, [s(1.0), s(2.6)], [0, FACTS2.heroDays], { ...clamp, easing: ease }));
  const out = interpolate(f, [s(9.5), s(10)], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: C.base, fontFamily: SANS, color: C.fg, alignItems: "center", justifyContent: "center", opacity: out }}>
      <div style={{ textAlign: "center", maxWidth: 1400 }}>
        <Appear at={s(0.3)} dur={9}>
          <div style={{ fontSize: 52, fontWeight: 300, lineHeight: 1.35, color: C.muted }}>In Finland, about</div>
        </Appear>
        <Appear at={s(0.8)} dur={9}>
          <div style={{ fontFamily: MONO, fontSize: 200, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{n}</div>
        </Appear>
        <Appear at={s(1.6)} dur={9}>
          <div style={{ fontSize: 52, fontWeight: 300, lineHeight: 1.35, color: C.muted }}>
            days pass from the first symptom of lung cancer to treatment.
          </div>
        </Appear>
        <Appear at={s(5.4)} dur={10} style={{ marginTop: 70 }}>
          <div style={{ fontSize: 76, fontWeight: 300 }}>Nobody counts them.</div>
        </Appear>
      </div>
      <div style={{ position: "absolute", right: 96, bottom: 80, fontSize: 18, color: C.muted }}>
        <Src id="SOURCE">{FACTS2.heroSource}</Src>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* 0:22-0:30  He dials. Ring. The agent answers and says it is an AI.   */
/* ------------------------------------------------------------------ */
export const C_Dial: React.FC = () => {
  const f = useCurrentFrame();
  const people = usePeople();
  const answered = s(3.6);
  const on = f >= answered;
  const secs = Math.max(0, Math.floor((f - answered) / FPS));
  const ring = !on && f >= s(0.6);
  return (
    <AbsoluteFill style={{ backgroundColor: C.base, fontFamily: SANS, color: C.fg, alignItems: "center", justifyContent: "center" }}>
      <Appear at={0} dur={7} style={{ transform: "translateY(-60px)" }}>
        <Phone>
          <div style={{ position: "absolute", top: 120, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
            <Label size={16} color={on ? C.ok : C.muted}>
              {on ? `On the line 00:${pad2(secs)}` : ring ? "Ringing" : "Calling"}
            </Label>
            <Wordmark height={34} />
            <div style={{ fontSize: 22, color: C.muted, fontWeight: 300 }}>Lung symptom line</div>
            <div style={{ marginTop: 50 }}>
              <Voice active={on && f < s(7.8)} />
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 60, width: "100%", display: "flex", justifyContent: "center" }}>
            <div style={{ width: 64, height: 64, border: `1px solid ${C.alert}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 22, height: 4, backgroundColor: C.alert }} />
            </div>
          </div>
        </Phone>
      </Appear>
      {people && <DialFootage until={answered} />}
      <Subtitle from={s(3.8)} to={s(8)} speaker="Polku / AI agent" text={GREETING} bottom={110} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* 0:30-1:05  The call. Phone left, Screening right.                    */
/* Words fly from the subtitle into the symptom they become.            */
/* ------------------------------------------------------------------ */
type Say = { from: number; to: number; who: "agent" | "caller"; text: string };
const SAYS: Say[] = [
  { from: s(0.2), to: s(2.4), who: "caller", text: "It's 040355-9018." },
  { from: s(4.6), to: s(6.8), who: "agent", text: "Thank you, Matti. You're identified." },
  { from: s(7.0), to: s(9.2), who: "agent", text: "What symptoms have you been having?" },
  { from: s(9.5), to: s(14.6), who: "caller", text: "I've had this cough for about seven weeks now. It just won't go away." },
  { from: s(15.0), to: s(18.2), who: "agent", text: "Did it start after a cold, or anything else you know of?" },
  { from: s(18.5), to: s(20.8), who: "caller", text: "No, nothing like that." },
  { from: s(21.2), to: s(23.6), who: "agent", text: "Do you smoke, or have you smoked before?" },
  { from: s(24.0), to: s(27.0), who: "caller", text: "I quit about ten years ago." },
  { from: s(31.0), to: s(34.8), who: "agent", text: "Thank you. I have what I need." },
];

/** A phrase that leaves the subtitle and lands in the Screening panel. */
const Fly: React.FC<{ at: number; text: string; from: [number, number]; to: [number, number] }> = ({ at, text, from, to }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 14], [0, 1], { ...clamp, easing: ease });
  if (f < at || f > at + 18) return null;
  const o = interpolate(f, [at, at + 2, at + 14, at + 18], [0, 1, 1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: from[0] + (to[0] - from[0]) * p,
        top: from[1] + (to[1] - from[1]) * p,
        fontSize: 30 - p * 8,
        color: C.fg,
        borderBottom: `2px solid ${C.fg}`,
        whiteSpace: "nowrap",
        opacity: o,
      }}
    >
      {text}
    </div>
  );
};

const Row: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div style={{ display: "flex", borderBottom: `1px solid ${C.line}`, padding: "16px 24px", alignItems: "baseline", gap: 20 }}>
    <Label size={14} style={{ width: 210, flexShrink: 0 }}>
      {k}
    </Label>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

export const D_Call: React.FC = () => {
  const f = useCurrentFrame();
  const people = usePeople();
  const say = SAYS.find((x) => f >= x.from && f < x.to);
  const verifyAt = s(1.4);
  const verifiedAt = s(3.6);
  const coughAt = s(12.6) + 14;
  const unexplainedAt = s(19.6);
  const smokeAt = s(25.4) + 14;
  const ruleAt = s(27.6);
  const matchAt = s(30.2);
  const secs = 8 + Math.floor(f / FPS);
  return (
    <Frame section="Screening / live call / synthetic person">
      {people && <CallFootage speaking={say ? (say.who === "caller" ? "Matti speaking" : "Polku / AI speaking") : null} secs={8 + Math.floor(f / FPS)} />}
      {/* Phone, left */}
      <div style={{ position: "absolute", left: 120, top: 190, display: people ? "none" : undefined }}>
        <Phone w={300} h={600}>
          <div style={{ position: "absolute", top: 90, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Label size={15} color={C.ok}>
              On the line {pad2(Math.floor(secs / 60))}:{pad2(secs % 60)}
            </Label>
            <Wordmark height={28} />
            <div style={{ marginTop: 40 }}>
              <Voice active={!!say} color={say?.who === "caller" ? C.fg : C.muted} />
            </div>
            <Label size={13} color={C.dim} style={{ marginTop: 6 }}>
              {say ? (say.who === "caller" ? "Matti" : "Polku / AI") : " "}
            </Label>
          </div>
        </Phone>
      </div>
      {/* Subtitle under the phone, left column */}
      <div style={{ position: "absolute", left: 96, top: 830, width: 700 }}>
        {say && (
          <div key={say.from}>
            <Label size={15} color={say.who === "caller" ? C.fg : C.dim} style={{ marginBottom: 8 }}>
              {say.who === "caller" ? "Matti" : "Polku / AI agent"}
            </Label>
            <div style={{ fontSize: 32, lineHeight: 1.3, color: say.who === "caller" ? C.fg : C.muted, fontWeight: say.who === "caller" ? 400 : 300 }}>
              {say.text}
            </div>
          </div>
        )}
      </div>

      {/* Screening, right */}
      <div style={{ position: "absolute", left: 840, right: 96, top: 170, bottom: 140, border: `1px solid ${C.line}`, backgroundColor: C.panel }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: `1px solid ${C.lineStrong}` }}>
          <div style={{ fontSize: 24 }}>
            {f >= verifiedAt ? "Matti Virtanen" : "Unknown caller"}{" "}
            <span style={{ color: C.muted }}>{f >= verifiedAt ? "/ 71 / Keski-Suomi" : ""}</span>
          </div>
          <Label size={14} color={C.ok}>
            On the line
          </Label>
        </div>
        <Row k="Identify caller">
          {f < verifyAt ? (
            <span style={{ color: C.muted, fontSize: 22 }}>The caller is not identified.</span>
          ) : f < verifiedAt ? (
            <span style={{ color: C.warn, fontSize: 22 }}>Waiting for Mobile ID.</span>
          ) : (
            <span style={{ fontSize: 22 }}>
              <span style={{ color: C.ok }}>Identified</span> <span style={{ color: C.muted }}>/ Mobile ID, simulated</span>
            </span>
          )}
        </Row>
        <Row k="What the agent can see">
          <span style={{ fontSize: 22, color: f >= verifiedAt ? C.fg : C.muted }}>{f >= verifiedAt ? "Own record only." : "Nothing."}</span>
        </Row>
        <Row k="Symptoms">
          {f < coughAt ? (
            <span style={{ color: C.dim, fontSize: 22 }}>Nothing recorded yet.</span>
          ) : (
            <div>
              <Appear at={coughAt} dur={6}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Square size={10} />
                  <span style={{ fontSize: 24 }}>New cough</span>
                  <span style={{ fontFamily: MONO, fontSize: 20, color: C.muted }}>7 weeks</span>
                  {f >= unexplainedAt && (
                    <span style={{ fontFamily: MONO, fontSize: 15, color: C.fg, border: `1px solid ${C.lineStrong}`, padding: "2px 8px", letterSpacing: "0.08em" }}>
                      NO OTHER CAUSE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 19, color: C.muted, margin: "4px 0 0 22px" }}>"cough for about seven weeks now"</div>
              </Appear>
              {f >= smokeAt && (
                <Appear at={smokeAt} dur={6} style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Square size={10} />
                    <span style={{ fontSize: 24 }}>Ex-smoker</span>
                  </div>
                  <div style={{ fontSize: 19, color: C.muted, margin: "4px 0 0 22px" }}>"I quit about ten years ago."</div>
                </Appear>
              )}
            </div>
          )}
        </Row>
        <Row k="Result">
          {f < ruleAt ? (
            <span style={{ color: C.dim, fontSize: 22 }}>Nothing decided yet.</span>
          ) : (
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: MONO, fontSize: 18 }}>
                {[
                  ["New cough, 7 weeks", ">= 6 weeks"],
                  ["Age 71", "over 40"],
                  ["Ex-smoker", "smoker or ex-smoker"],
                ].map(([a, b], i) => {
                  const on = f >= ruleAt + i * 16;
                  return (
                    <div key={a} style={{ display: "flex", gap: 12, alignItems: "center", color: on ? C.fg : C.dim }}>
                      <Square size={9} color={on ? C.ok : C.lineStrong} />
                      <span style={{ width: 280 }}>{a}</span>
                      <span style={{ color: C.muted }}>{b}</span>
                    </div>
                  );
                })}
              </div>
              {f >= matchAt && (
                <Appear at={matchAt} dur={6} style={{ marginTop: 18 }}>
                  <div style={{ fontSize: 28 }}>Fast track: nurse callback</div>
                  <div style={{ fontSize: 18, color: C.muted, marginTop: 6 }}>
                    <span style={{ color: C.info, fontFamily: MONO, fontSize: 16 }}>SE-SVF</span> Standardiserat vårdförlopp lungcancer v1.4: new cough lasting 6 weeks in an ex-smoker over 40
                  </div>
                </Appear>
              )}
            </div>
          )}
        </Row>
        <div style={{ position: "absolute", bottom: 14, left: 24 }}>
          <Label size={13} color={C.dim}>
            The model only extracts. A rule decides. Synthetic people only.
          </Label>
        </div>
      </div>

      <Fly at={s(12.6)} text="cough for about seven weeks" from={[300, 900]} to={[1100, 385]} />
      <Fly at={s(19.6)} text="nothing like that" from={[260, 880]} to={[1480, 385]} />
      <Fly at={s(25.4)} text="I quit about ten years ago" from={[96, 880]} to={[1100, 460]} />
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* 1:05-1:12  Hold on the promise. Countdown starts. 2 s of silence.    */
/* ------------------------------------------------------------------ */
export const PROMISE_CLOCK_START = s(2.2);

export const E_Promise: React.FC = () => (usePeople() ? <E_PromisePeople clockStart={PROMISE_CLOCK_START} /> : <E_PromiseDrawn />);

const E_PromiseDrawn: React.FC = () => {
  const f = useCurrentFrame();
  const started = f >= PROMISE_CLOCK_START;
  const left = 48 * 3600 - Math.max(0, Math.floor((f - PROMISE_CLOCK_START) / FPS)) - (started ? 1 : 0);
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const sec = left % 60;
  const words = "A nurse will call you by Sunday 21:47.".split(" ");
  return (
    <AbsoluteFill style={{ backgroundColor: C.base, fontFamily: SANS, color: C.fg }}>
      <div style={{ position: "absolute", left: 96, top: 250 }}>
        <Label size={18} style={{ marginBottom: 20 }}>
          Polku / AI agent
        </Label>
        <div style={{ fontSize: 100, fontWeight: 300, lineHeight: 1.1, maxWidth: 1700 }}>
          {words.map((w, i) => {
            const at = s(0.1) + i * 4;
            const o = interpolate(f, [at, at + 5], [0, 1], clamp);
            return (
              <span key={i} style={{ opacity: o }}>
                {w}{" "}
              </span>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: 96, right: 96, top: 640, opacity: started ? 1 : 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ fontFamily: MONO, fontSize: 120, fontVariantNumeric: "tabular-nums" }}>
            {pad2(h)}:{pad2(m)}:{pad2(sec)}
          </div>
          <Label size={18}>Nurse callback / limit 48 h</Label>
        </div>
        <div style={{ marginTop: 24 }}>
          <ClockBar width={1728} fill={interpolate(f, [PROMISE_CLOCK_START, s(7)], [0, 5 / (48 * 3600)], clamp)} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontFamily: MONO, fontSize: 16, color: C.dim }}>
          <span>Fri 21:47</span>
          <span>Sat 21:47</span>
          <span>Sun 21:47</span>
        </div>
      </div>
      <div style={{ position: "absolute", right: 96, bottom: 80, fontSize: 18, color: C.muted }}>
        <Src id="POLKU">Callback limit is a Polku design choice, not from a published pathway</Src>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* 1:12-1:25  Nurse confirms. Steps unfold, each with a deadline.       */
/* ------------------------------------------------------------------ */
const STEPS2: { name: string; days: number; src: string }[] = [
  { name: "Nurse callback", days: 2, src: "POLKU" },
  { name: "CT scan", days: 10, src: "SE-SVF" },
  { name: "Referral", days: 2, src: "SE-SVF" },
  { name: "Lung specialist", days: 5, src: "SE-SVF" },
  { name: "Further tests", days: 21, src: "SE-SVF" },
  { name: "Team decision", days: 2, src: "SE-SVF" },
  { name: "Treatment starts", days: 14, src: "SE-SVF" },
];

// Latest dates if every step used its full limit, starting Fri 13.11.2026 21:47.
const DEADLINES = (() => {
  const out: string[] = [];
  const d = new Date(Date.UTC(2026, 10, 13));
  for (const st of STEPS2) {
    d.setUTCDate(d.getUTCDate() + st.days);
    out.push(`${d.getUTCDate()}.${d.getUTCMonth() + 1}.`);
  }
  return out;
})();

export const F_Nurse: React.FC = () => {
  const f = useCurrentFrame();
  const doneAt = s(1.6);
  const done = f >= doneAt;
  const lineStart = s(2.4);
  const nodeX = (i: number) => i * 254;
  const lineP = interpolate(f, [lineStart, lineStart + s(3.2)], [0, 1], clamp);
  return (
    <Frame
      section="Nurse / synthetic case"
      source={
        <>
          <Src id="SE-SVF">Standardiserat vårdförlopp lungcancer v1.4 (2024): step limits</Src>
          <Src id="POLKU">Callback limit: Polku design choice</Src>
        </>
      }
    >
      <div style={{ position: "absolute", left: 96, right: 96, top: 180 }}>
        <Appear at={0}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${C.line}`, backgroundColor: C.panel, padding: "18px 24px" }}>
            <div>
              <div style={{ fontSize: 30 }}>Matti Virtanen, 71</div>
              <div style={{ fontFamily: MONO, fontSize: 18, color: C.muted, marginTop: 4 }}>New cough 7 weeks / ex-smoker / Keski-Suomi</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              {done && (
                <Label size={17} color={C.ok}>
                  Promise kept / 2 h 14 min early
                </Label>
              )}
              <div
                style={{
                  height: 52,
                  padding: "0 28px",
                  display: "flex",
                  alignItems: "center",
                  fontSize: 22,
                  backgroundColor: done ? "transparent" : C.fg,
                  color: done ? C.fg : "#000",
                  border: `1px solid ${done ? C.lineStrong : C.fg}`,
                }}
              >
                {done ? "Called back Sun 19:33" : "Call back"}
              </div>
            </div>
          </div>
        </Appear>
        <Appear at={s(1.9)} style={{ marginTop: 60 }}>
          <Label size={16}>Pathway / every step is a promise with a deadline</Label>
        </Appear>
        {/* The relay: one thin line through seven nodes */}
        <div style={{ position: "relative", marginTop: 70, height: 250 }}>
          <div style={{ position: "absolute", left: 6, top: 6, height: 1, width: nodeX(6) * lineP, backgroundColor: C.fg }} />
          {STEPS2.map((st, i) => {
            const at = lineStart + (i / 6) * s(3.2);
            const on = f >= at;
            const p = interpolate(f, [at, at + 6], [0, 1], { ...clamp, easing: ease });
            const first = i === 0;
            const second = i === 1;
            const booked = second && f >= s(7.4);
            return (
              <div key={st.name} style={{ position: "absolute", left: nodeX(i), top: 0, width: 236 }}>
                <Square size={13} color={first && done ? C.ok : on ? C.fg : C.lineStrong} />
                <div style={{ opacity: p, transform: `translateY(${(1 - p) * 10}px)`, marginTop: 22 }}>
                  <div style={{ fontSize: 25, color: first ? C.fg : C.fg }}>{st.name}</div>
                  <div style={{ fontFamily: MONO, fontSize: 22, color: C.muted, marginTop: 8 }}>
                    {first ? "Done" : `by ${DEADLINES[i]}`}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 15, color: C.dim, marginTop: 6 }}>
                    {st.days} d / <span style={{ color: C.info }}>{st.src}</span>
                  </div>
                  {booked && (
                    <Appear at={s(7.4)} style={{ marginTop: 14 }}>
                      <Label size={14} color={C.fg}>
                        Booked Tue 17.11 08:20
                      </Label>
                      <Label size={12} color={C.dim} style={{ marginTop: 4 }}>
                        Offered by SMS / simulated
                      </Label>
                    </Appear>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Subtitle from={s(8.4)} to={s(12.8)} speaker="Voice-over" text="A nurse decides. Every step after that is a promise with a deadline." bottom={150} />
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* 1:25-1:32  Hard cut. Call 112.                                       */
/* ------------------------------------------------------------------ */
export const G_112: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.base, fontFamily: SANS, color: C.fg }}>
      {/* The frame itself carries the alert: status on a border, not a fill. */}
      <AbsoluteFill style={{ border: `6px solid ${C.alert}` }} />
      <div style={{ position: "absolute", left: 96, top: 110 }}>
        <Label size={17}>Seppo Laine, 80 / synthetic person</Label>
        <div style={{ fontSize: 38, fontWeight: 300, marginTop: 14 }}>"I'm coughing up a lot of blood. Right now."</div>
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 330, fontWeight: 300, color: C.alert, lineHeight: 1, letterSpacing: "-0.02em" }}>Call 112</div>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 30, opacity: f >= s(0.8) ? 1 : 0 }}>
          <Square size={11} color={C.alert} />
          <span style={{ fontSize: 26 }}>Heavy bleeding when coughing</span>
          <span style={{ fontFamily: MONO, fontSize: 18, color: C.muted }}>RF-112 / enforced in the engine, not the prompt</span>
        </div>
      </AbsoluteFill>
      <Subtitle from={s(1.8)} to={s(6.8)} speaker="Voice-over" text="The AI never decides. Some rules it cannot override." bottom={120} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* 1:32-1:47  The blank map fills in. One tile ticks.                   */
/* ------------------------------------------------------------------ */
const MAP_H = 820;
const { dots: DOTS, width: MAP_W, project } = makeDots(MAP_H, 11);
const KS = COUNTY_SEATS.findIndex((c) => c.name === "Keski-Suomi");
const statusOf = (k: number) => (k >= 75 ? C.ok : k >= 65 ? C.warn : C.alert);

export const H_Map: React.FC = () => {
  const f = useCurrentFrame();
  const fillAt = s(4.6);
  const sweep = s(2.4);
  const tickAt = s(8.4);
  const recAt = s(10.2);
  const filled = f >= fillAt;
  const ks = COUNTY_SEATS[KS];
  const ksPt = project(ks.lon, ks.lat);
  const ticked = f >= tickAt;
  const pulse = ticked ? interpolate(f, [tickAt, tickAt + 20], [1, 0], clamp) : 0;
  const MAP_LEFT = 1400;
  const MAP_TOP = 120;
  return (
    <Frame
      section={filled ? "County cockpit / synthetic" : "Finland today / real"}
      source={
        <>
          <Src id="STRATEGY">Goal 3: "treatment within target times", national cancer strategy 2026-2035, p.5</Src>
          <div>{filled ? "Map values are SYNTHETIC" : "No public per-county access-time data"}</div>
        </>
      }
    >
      <div style={{ position: "absolute", left: 96, top: 200, width: 1000 }}>
        <div style={{ fontSize: 66, fontWeight: 300, lineHeight: 1.1 }}>
          {filled ? "Promises kept, per wellbeing county." : "Is lung cancer care on time in your county?"}
        </div>
        <div style={{ marginTop: 30, display: "flex", alignItems: "baseline", gap: 18 }}>
          <span style={{ fontFamily: MONO, fontSize: 60, color: filled ? C.fg : C.dim }}>{filled ? "22 / 22" : "0 / 22"}</span>
          <Label size={18}>{filled ? "counties measured / with Polku" : "counties measured / today"}</Label>
        </div>
        {ticked && (
          <Appear at={tickAt} style={{ marginTop: 50 }}>
            <Label size={15} style={{ marginBottom: 8 }}>
              Keski-Suomi / Matti's call just landed here
            </Label>
            <div style={{ fontFamily: MONO, fontSize: 30 }}>
              {ks.kept} % <span style={{ color: C.muted }}>{"->"}</span> {ks.kept + 1} % promises kept
            </div>
          </Appear>
        )}
        {f >= recAt && (
          <Appear at={recAt} style={{ marginTop: 40, border: `1px solid ${C.line}`, backgroundColor: C.panel, padding: "20px 24px", width: 820 }}>
            <Label size={14} style={{ marginBottom: 10 }}>
              Recommendation / roadmap measure 2.5.2
            </Label>
            <div style={{ fontSize: 26, lineHeight: 1.35 }}>The wait is at the first specialist visit: median 24 d against 5 d. Open a direct CT route from primary care.</div>
            <div style={{ fontSize: 19, color: C.muted, marginTop: 8 }}>Simulated: 9 days saved / SYNTHETIC</div>
          </Appear>
        )}
      </div>
      {/* Dot map */}
      <div style={{ position: "absolute", left: MAP_LEFT, top: MAP_TOP, width: MAP_W, height: MAP_H }}>
        {DOTS.map((d, i) => {
          const c = COUNTY_SEATS[d.county];
          // fill sweeps south to north
          const at = fillAt + (1 - d.y / MAP_H) * sweep;
          const on = f >= at;
          const kept = d.county === KS && ticked ? c.kept + 1 : c.kept;
          const color = on ? statusOf(kept) : C.lineStrong;
          const hot = d.county === KS && pulse > 0;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: d.x - 3.5,
                top: d.y - 3.5,
                width: 7,
                height: 7,
                backgroundColor: hot ? C.fg : color,
                opacity: on ? 1 : 0.7,
              }}
            />
          );
        })}
        {!filled && (
          <div style={{ position: "absolute", left: MAP_W * 0.08, top: MAP_H * 0.55 }}>
            <Label size={18} color={C.fg} style={{ backgroundColor: C.base, padding: "6px 10px", border: `1px solid ${C.line}` }}>
              Not measured
            </Label>
          </div>
        )}
        {ticked && (
          <>
            <div style={{ position: "absolute", left: ksPt.x - 14, top: ksPt.y - 14, width: 28, height: 28, border: `1px solid ${C.fg}` }} />
            <div style={{ position: "absolute", left: ksPt.x + 24, top: ksPt.y - 12 }}>
              <span style={{ fontFamily: MONO, fontSize: 16, color: C.fg, backgroundColor: C.base, padding: "2px 6px" }}>+1</span>
            </div>
          </>
        )}
      </div>
      {filled && (
        <div style={{ position: "absolute", left: MAP_LEFT - 170, top: MAP_TOP + MAP_H - 150, display: "flex", flexDirection: "column", gap: 12, fontFamily: MONO, fontSize: 14, color: C.muted }}>
          {[
            [C.ok, ">= 75 %"],
            [C.warn, "65-74 %"],
            [C.alert, "< 65 %"],
          ].map(([c, t]) => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Square size={9} color={c} /> {t}
            </span>
          ))}
        </div>
      )}
      <Subtitle from={s(0.8)} to={s(4.4)} speaker="Voice-over" text="Today Finland cannot measure this per county." bottom={150} />
      <Subtitle from={s(4.8)} to={s(8.2)} speaker="Voice-over" text="With Polku it is a by-product of care." bottom={150} />
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* 1:47-1:53  Pathway-as-code flash                                     */
/* ------------------------------------------------------------------ */
const CODE2 = [
  "steps: [",
  '  { id: "callback",          maxDays: 2,  sourceId: "POLKU"  },',
  '  { id: "primary_assessment", maxDays: 10, sourceId: "SE-SVF", requires: "ct" },',
  '  { id: "referral",          maxDays: 2,  sourceId: "SE-SVF" },',
  '  { id: "first_visit",       maxDays: 5,  sourceId: "SE-SVF", requires: "pulmonology" },',
  '  { id: "diagnostics",       maxDays: 21, sourceId: "SE-SVF" },',
  '  { id: "mdt_decision",      maxDays: 2,  sourceId: "SE-SVF" },',
  '  { id: "treatment_start",   maxDays: 14, sourceId: "SE-SVF" },',
  "]",
];

export const I_Code: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.base, fontFamily: SANS, color: C.fg }}>
      <div style={{ position: "absolute", left: 96, top: 150 }}>
        <Label size={18} style={{ marginBottom: 20 }}>
          src/pathways/lung.ts
        </Label>
        {CODE2.map((l, i) => {
          const o = interpolate(f, [2 + i * 2, 6 + i * 2], [0, 1], clamp);
          const parts = l.split(/(sourceId: "[A-Z-]+")/);
          return (
            <pre key={i} style={{ margin: 0, fontFamily: MONO, fontSize: 27, lineHeight: 1.6, opacity: o, color: C.fg }}>
              {parts.map((p, j) => (
                <span key={j} style={{ color: p.startsWith("sourceId") ? C.info : undefined }}>
                  {p}
                </span>
              ))}
            </pre>
          );
        })}
      </div>
      <Appear at={s(1.4)} dur={8} style={{ position: "absolute", left: 96, top: 760 }}>
        <Label size={30} color={C.fg}>
          open · cited · runs in Europe
        </Label>
      </Appear>
      <Subtitle from={s(1.6)} to={s(5.8)} speaker="Voice-over" text="One typed, cited definition per cancer. A sovereign ontology." bottom={120} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* 1:53-1:58  Logo. "Every cancer pathway, on the clock."               */
/* ------------------------------------------------------------------ */
export const J_Logo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.base, fontFamily: SANS, color: C.fg, alignItems: "center", justifyContent: "center" }}>
      <Appear at={0} dur={8}>
        <Wordmark height={120} />
      </Appear>
      <Appear at={s(0.5)} dur={8} style={{ marginTop: 60 }}>
        <div style={{ fontSize: 62, fontWeight: 300 }}>Every cancer pathway, on the clock.</div>
      </Appear>
      <Subtitle from={s(1.0)} to={s(4.9)} speaker="Voice-over" text="By 2028, says the strategy. We built one this weekend." bottom={150} />
      <div style={{ position: "absolute", left: 96, bottom: 70 }}>
        <Label size={16}>Junction 2026 / AstraZeneca: Equal Care Across Finland / synthetic data only</Label>
      </div>
    </AbsoluteFill>
  );
};
