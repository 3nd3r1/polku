import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Appear, ClockBar, Frame, Label, Square, Src, Subtitle, Wordmark, ease, pad2, useIn } from "./components";
import { C, FPS, MONO, SANS, s } from "./theme";

/* ------------------------------------------------------------------ */
/* Facts used on screen. Change here, not in the scenes.               */
/* ------------------------------------------------------------------ */
export const FACTS = {
  // UNVERIFIED, see docs/story-and-demo.md "Facts to check". Swap if it doesn't hold.
  heroDays: 155,
  heroSource: "Yle MOT, yle.fi/a/74-20251023",
  promise: "Sunday 21:47",
};

/* ------------------------------------------------------------------ */
/* 1. Cold open: Matti at home, day 49                                 */
/* ------------------------------------------------------------------ */
export const ColdOpen: React.FC = () => {
  const phone = useIn(s(0.6), 12);
  return (
    <Frame wordmark={false} section="Matti, 71 / Keski-Suomi / acted">
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {/* A phone lying on the table, screen dark */}
        <div
          style={{
            opacity: phone * 0.9,
            width: 520,
            height: 250,
            border: `1px solid ${C.lineStrong}`,
            backgroundColor: C.panel,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: "translateY(-80px)",
          }}
        >
          <Label size={18} color={C.dim}>
            No calls
          </Label>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 640,
            height: 1,
            backgroundColor: C.line,
            opacity: phone,
          }}
        />
      </AbsoluteFill>
      <Subtitle from={s(0.8)} to={s(2.6)} text="*coughs*" />
      <Subtitle
        from={s(2.8)}
        to={s(7.4)}
        speaker="Matti"
        text="Se on varmaan ei mitään. En viitsi vaivata ketään."
        sub="It's probably nothing. I don't want to bother anyone."
      />
      <Subtitle from={s(7.8)} to={s(9.6)} text="*coughs*" />
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* 2. The number                                                       */
/* ------------------------------------------------------------------ */
export const TheNumber: React.FC = () => {
  const f = useCurrentFrame();
  const count = Math.round(
    interpolate(f, [s(0.8), s(2.4)], [0, FACTS.heroDays], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
  );
  return (
    <Frame wordmark={false} section="The wait" source={<Src id="SOURCE">{FACTS.heroSource}</Src>}>
      <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 96, paddingRight: 96 }}>
        <Appear at={s(0.2)}>
          <div style={{ fontSize: 44, fontWeight: 300, color: C.muted }}>In Finland, about</div>
        </Appear>
        <Appear at={s(0.6)}>
          <div style={{ fontFamily: MONO, fontSize: 240, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
            {count} days
          </div>
        </Appear>
        <Appear at={s(1.6)}>
          <div style={{ fontSize: 44, fontWeight: 300, color: C.muted, maxWidth: 1400 }}>
            pass from the first symptom of lung cancer to treatment.
          </div>
        </Appear>
        <Appear at={s(5.2)} dur={8}>
          <div style={{ fontSize: 72, fontWeight: 300, marginTop: 64 }}>Nobody counts them.</div>
        </Appear>
      </AbsoluteFill>
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* 3. He dials                                                         */
/* ------------------------------------------------------------------ */
export const Dial: React.FC = () => {
  const f = useCurrentFrame();
  const connected = f >= s(3.4);
  const secs = Math.max(0, Math.floor((f - s(3.4)) / FPS));
  return (
    <Frame wordmark={false} section="Day 49 / first call">
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Appear at={0} dur={8}>
          <div
            style={{
              width: 420,
              height: 620,
              border: `1px solid ${C.lineStrong}`,
              backgroundColor: C.panel,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: 110,
              transform: "translateY(-70px)",
              gap: 28,
            }}
          >
            <Label size={18}>{connected ? `Connected 00:${pad2(secs)}` : "Calling"}</Label>
            <Wordmark height={36} />
            <div style={{ fontSize: 24, color: C.muted, fontWeight: 300 }}>Lung symptom line</div>
            <div style={{ display: "flex", gap: 14, marginTop: 40 }}>
              {[0, 1, 2].map((i) => {
                const on = connected ? 1 : Math.floor(f / 10) % 3 === i ? 1 : 0.25;
                return (
                  <div key={i} style={{ opacity: on }}>
                    <Square size={14} color={connected ? C.ok : C.fg} />
                  </div>
                );
              })}
            </div>
          </div>
        </Appear>
      </AbsoluteFill>
      <RingDots />
      <Subtitle from={s(3.6)} to={s(7.8)} speaker="Polku, AI agent" text="Hello, this is Polku. I'm an AI assistant. A nurse makes every decision." />
    </Frame>
  );
};

const RingDots: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= s(3.4)) return null;
  // Ring pulses: hairline square expanding out from the phone, linear.
  const t = (f % 40) / 40;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      <div style={{ width: 420 + t * 260, height: 620 + t * 260, border: `1px solid ${C.lineStrong}`, opacity: 1 - t, transform: "translateY(-70px)" }} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* 4. The call: words become symptoms, a rule matches                  */
/* ------------------------------------------------------------------ */
type Line = { at: number; who: "agent" | "caller"; text: string; mark?: string; markAt?: number };

const CALL: Line[] = [
  { at: 0, who: "agent", text: "First I need to confirm who you are. What is your identity code?" },
  { at: s(2.4), who: "caller", text: "040355-9018." },
  { at: s(5.6), who: "agent", text: "Thank you, Matti. What has been bothering you?" },
  { at: s(7.6), who: "caller", text: "I've had this cough for about seven weeks. It doesn't go away.", mark: "cough for about seven weeks", markAt: s(9.6) },
  { at: s(12), who: "agent", text: "Do you smoke, or have you smoked?" },
  { at: s(13.6), who: "caller", text: "Thirty years. I quit in 2015.", mark: "I quit in 2015", markAt: s(15.4) },
  { at: s(17.4), who: "agent", text: "Any blood when you cough, or trouble breathing right now?" },
  { at: s(19.6), who: "caller", text: "No, nothing like that.", mark: "nothing like that", markAt: s(21) },
  { at: s(28.4), who: "agent", text: "This matches a published referral criterion. I'll book a nurse to call you." },
];

const TranscriptLine: React.FC<{ line: Line }> = ({ line }) => {
  const f = useCurrentFrame();
  const p = useIn(line.at, 6);
  if (f < line.at) return null;
  const caller = line.who === "caller";
  let body: React.ReactNode = line.text;
  if (line.mark && line.markAt !== undefined) {
    const i = line.text.indexOf(line.mark);
    const m = interpolate(f, [line.markAt, line.markAt + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
    body = (
      <>
        {line.text.slice(0, i)}
        <span style={{ backgroundImage: `linear-gradient(${C.fg}, ${C.fg})`, backgroundSize: `${m * 100}% 2px`, backgroundPosition: "0 100%", backgroundRepeat: "no-repeat", color: m > 0.5 ? C.fg : undefined }}>
          {line.mark}
        </span>
        {line.text.slice(i + line.mark.length)}
      </>
    );
  }
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 10}px)`, marginBottom: 26 }}>
      <Label size={15} color={caller ? C.fg : C.dim} style={{ marginBottom: 6 }}>
        {caller ? "Caller" : "Polku, AI"}
      </Label>
      <div style={{ fontSize: caller ? 34 : 28, color: caller ? C.fg : C.muted, fontWeight: caller ? 400 : 300, lineHeight: 1.3 }}>{body}</div>
    </div>
  );
};

const PanelSection: React.FC<{ title: string; at: number; children: React.ReactNode; right?: React.ReactNode }> = ({ title, at, children, right }) => (
  <Appear at={at} style={{ borderBottom: `1px solid ${C.line}`, padding: "22px 28px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
      <Label size={15}>{title}</Label>
      {right}
    </div>
    {children}
  </Appear>
);

const SymptomObject: React.FC<{ at: number; code: string; fields: [string, string][]; quote: string }> = ({ at, code, fields, quote }) => (
  <Appear at={at} dur={6} style={{ border: `1px solid ${C.lineStrong}`, backgroundColor: C.raised, padding: "14px 18px", marginBottom: 12 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Square size={10} />
      <span style={{ fontFamily: MONO, fontSize: 22 }}>{code}</span>
      {fields.map(([k, v]) => (
        <span key={k} style={{ fontFamily: MONO, fontSize: 18, color: C.muted, marginLeft: 12 }}>
          {k} <span style={{ color: C.fg }}>{v}</span>
        </span>
      ))}
    </div>
    <div style={{ fontSize: 20, color: C.muted, marginTop: 8 }}>"{quote}"</div>
  </Appear>
);

const Cond: React.FC<{ at: number; text: string }> = ({ at, text }) => {
  const f = useCurrentFrame();
  const on = f >= at;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: MONO, fontSize: 19, color: on ? C.fg : C.dim, marginTop: 8 }}>
      <Square size={10} color={on ? C.ok : C.lineStrong} />
      {text}
    </div>
  );
};

export const Call: React.FC = () => {
  const f = useCurrentFrame();
  const verified = f >= s(4.6);
  const matched = f >= s(26.4);
  return (
    <Frame section="Screening / live call / synthetic caller">
      {/* Left: transcript */}
      <div style={{ position: "absolute", left: 96, top: 180, width: 700, bottom: 140, overflow: "hidden" }}>
        <Label size={16} style={{ marginBottom: 28 }}>
          Live transcript
        </Label>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: 60, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          {CALL.map((l, i) => (
            <TranscriptLine key={i} line={l} />
          ))}
        </div>
      </div>
      {/* Right: screening panel */}
      <div style={{ position: "absolute", left: 880, right: 96, top: 160, bottom: 140, border: `1px solid ${C.line}`, backgroundColor: C.panel }}>
        <PanelSection
          title="1 / Identity"
          at={s(2.8)}
          right={
            <Label size={15} color={verified ? C.ok : C.warn}>
              {verified ? "Verified" : "Waiting for Mobile ID"}
            </Label>
          }
        >
          <div style={{ fontSize: 26 }}>
            Matti, 71 <span style={{ color: C.muted }}>/ Keski-Suomi / 040355-9018</span>
          </div>
          <Label size={14} color={C.dim} style={{ marginTop: 6 }}>
            Synthetic register / Mobile ID simulated
          </Label>
        </PanelSection>
        <PanelSection title="2 / Symptoms, in the caller's words" at={s(9.8)}>
          <SymptomObject at={s(10)} code="COUGH_NEW" fields={[["onset", "49 d ago"]]} quote="cough for about seven weeks" />
          <SymptomObject at={s(15.8)} code="SMOKER_FORMER" fields={[["quit", "2015"]]} quote="Thirty years. I quit in 2015." />
        </PanelSection>
        <PanelSection
          title="3 / Criteria check, deterministic"
          at={s(21.2)}
          right={
            matched ? (
              <Label size={15} color={C.fg}>
                Match
              </Label>
            ) : undefined
          }
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: MONO, fontSize: 19 }}>
            <Square size={10} color={C.ok} />
            <span>RF-112</span>
            <span style={{ color: C.muted, fontFamily: SANS }}>No red flags</span>
          </div>
          <Appear at={s(22.6)} style={{ marginTop: 18 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
              <span style={{ fontFamily: MONO, fontSize: 22, whiteSpace: "nowrap" }}>SE-M1</span>
              <span style={{ fontSize: 23 }}>New cough or breathlessness lasting 6 weeks in a smoker or ex-smoker over 40</span>
            </div>
            <Cond at={s(23.6)} text="COUGH_NEW  49 d >= 42 d" />
            <Cond at={s(24.4)} text="age        71 > 40" />
            <Cond at={s(25.2)} text="smoking    former" />
            <Appear at={s(26.4)} style={{ marginTop: 14, fontSize: 18, color: C.muted }}>
              <span style={{ color: C.info, fontFamily: MONO, fontSize: 16 }}>SE-SVF</span> Standardiserat vårdförlopp lungcancer v1.4, RCC i samverkan
            </Appear>
          </Appear>
        </PanelSection>
      </div>
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* 5. The promise. Hold. Silence.                                      */
/* ------------------------------------------------------------------ */
export const PromiseScene: React.FC = () => {
  const f = useCurrentFrame();
  const start = s(1.6);
  const left = 48 * 3600 - Math.max(0, Math.floor((f - start) / FPS)) - 1;
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const sec = left % 60;
  const countIn = useIn(start, 6);
  return (
    <Frame section="Nurse callback / limit 2 d" source={<Src id="POLKU">Polku design choice, not from a published pathway</Src>}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Appear at={s(0.2)} dur={8}>
          <div style={{ fontSize: 84, fontWeight: 300, textAlign: "center" }}>
            "A nurse will call you by <span style={{ color: C.fg }}>{FACTS.promise}</span>."
          </div>
        </Appear>
        <div style={{ opacity: countIn, marginTop: 72, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ fontFamily: MONO, fontSize: 150, fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}>
            {pad2(h)}:{pad2(m)}:{pad2(sec)}
          </div>
          <ClockBar width={900} fill={interpolate(f, [start, s(7)], [0, 0.004], { extrapolateLeft: "clamp" })} />
          <Label size={18}>Clock started / somebody owns the wait</Label>
        </div>
      </AbsoluteFill>
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* 6. Nurse confirms, every step becomes a promise                     */
/* ------------------------------------------------------------------ */
const STEPS: { name: string; limit: number; elapsed: number | null; src: string }[] = [
  { name: "Nurse callback", limit: 2, elapsed: 1.9, src: "POLKU" },
  { name: "Primary-care assessment and imaging", limit: 10, elapsed: null, src: "SE-SVF" },
  { name: "Referral to specialist", limit: 2, elapsed: null, src: "SE-SVF" },
  { name: "First specialist visit", limit: 5, elapsed: null, src: "SE-SVF" },
  { name: "Diagnostics to MDT", limit: 21, elapsed: null, src: "SE-SVF" },
  { name: "MDT decision", limit: 2, elapsed: null, src: "SE-SVF" },
  { name: "Treatment start", limit: 14, elapsed: null, src: "SE-SVF" },
];

export const Nurse: React.FC = () => {
  const f = useCurrentFrame();
  const pressed = f >= s(1.4);
  const kept = f >= s(6.6);
  return (
    <Frame
      section="Nurse / synthetic case"
      source={
        <>
          <Src id="SE-SVF">RCC i samverkan, Standardiserat vårdförlopp lungcancer v1.4 (2024)</Src>
          <Src id="POLKU">Polku design choice, not from a published pathway</Src>
        </>
      }
    >
      <div style={{ position: "absolute", left: 96, right: 96, top: 170 }}>
        <Appear at={0}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${C.line}`, backgroundColor: C.panel, padding: "18px 24px" }}>
            <div style={{ display: "flex", gap: 28, alignItems: "baseline" }}>
              <span style={{ fontSize: 30 }}>Matti, 71</span>
              <span style={{ fontFamily: MONO, fontSize: 20, color: C.muted }}>SE-M1 / Keski-Suomi / callback due Sun 21:47</span>
            </div>
            <div
              style={{
                height: 52,
                padding: "0 28px",
                display: "flex",
                alignItems: "center",
                fontSize: 22,
                backgroundColor: pressed ? C.raised : C.fg,
                color: pressed ? C.ok : "#000",
                border: `1px solid ${pressed ? C.ok : C.fg}`,
              }}
            >
              {pressed ? "Confirmed by nurse" : "Confirm case"}
            </div>
          </div>
        </Appear>
        <div style={{ marginTop: 36 }}>
          {STEPS.map((st, i) => {
            const at = s(2) + i * 5;
            const draw = interpolate(f, [at, at + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
            const w = st.limit * 40;
            const fill = st.elapsed === null ? 0 : interpolate(f, [s(4), s(6.4)], [0, st.elapsed / st.limit], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const first = i === 0;
            return (
              <Appear key={st.name} at={at} dur={6}>
                <div style={{ display: "flex", alignItems: "center", height: 64, borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ fontFamily: MONO, fontSize: 18, color: C.dim, width: 70 }}>0{i + 1}</span>
                  <span style={{ fontSize: 28, width: 560, color: first ? C.fg : C.muted }}>{st.name}</span>
                  <div style={{ width: 880, clipPath: `inset(0 ${(1 - draw) * 100}% 0 0)` }}>
                    <ClockBar width={w} fill={fill} color={first && kept ? C.ok : C.fg} />
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 22, width: 160, color: C.fg }}>
                    {st.elapsed === null ? "-" : first && kept ? "1.9" : (fill * st.limit).toFixed(1)} / {st.limit} d
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 16, color: C.info }}>{st.src}</span>
                </div>
              </Appear>
            );
          })}
        </div>
        <Appear at={s(6.6)} style={{ marginTop: 26 }}>
          <Label size={20} color={C.ok}>
            Nurse callback / promise kept / 2 h 14 min early
          </Label>
        </Appear>
      </div>
      <Subtitle from={s(7.2)} to={s(11.8)} speaker="Voice-over" text="A nurse decides. Every step after that is a promise with a deadline." bottom={150} />
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* 7. The 112 moment                                                   */
/* ------------------------------------------------------------------ */
export const RedFlag: React.FC = () => {
  return (
    <Frame section="Red flag / Seppo, 80 / synthetic caller" source={<Src id="RF-112">Enforced in the engine, not the prompt</Src>}>
      <AbsoluteFill style={{ border: `2px solid ${C.alert}` }} />
      <div style={{ position: "absolute", left: 96, top: 230 }}>
        <Label size={16} color={C.fg} style={{ marginBottom: 10 }}>
          Caller
        </Label>
        <div style={{ fontSize: 40, fontWeight: 300 }}>"I'm coughing up a lot of blood. Right now."</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 30, fontFamily: MONO, fontSize: 22 }}>
          <Square size={12} color={C.alert} />
          <span style={{ color: C.alert }}>HAEMOPTYSIS_MASSIVE</span>
          <span style={{ color: C.muted }}>matches RF-112</span>
        </div>
      </div>
      <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 96, paddingTop: 260 }}>
        <Appear at={s(0.6)} dur={5}>
          <div style={{ fontSize: 220, fontWeight: 300, color: C.alert, lineHeight: 1 }}>Call 112.</div>
        </Appear>
      </AbsoluteFill>
      <Subtitle from={s(2.2)} to={s(6.8)} speaker="Voice-over" text="The AI never decides. Some rules it cannot override." bottom={150} />
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* 8. The blank map fills in                                           */
/* ------------------------------------------------------------------ */
const COUNTIES: { name: string; c: number; r: number; kept: number }[] = [
  { name: "Lappi", c: 3, r: 0, kept: 58 },
  { name: "Pohjois-Pohjanmaa", c: 3, r: 1, kept: 72 },
  { name: "Kainuu", c: 4, r: 1, kept: 66 },
  { name: "Pohjanmaa", c: 1, r: 2, kept: 81 },
  { name: "Keski-Pohjanmaa", c: 2, r: 2, kept: 77 },
  { name: "Pohjois-Savo", c: 4, r: 2, kept: 74 },
  { name: "Pohjois-Karjala", c: 5, r: 2, kept: 69 },
  { name: "Etelä-Pohjanmaa", c: 1, r: 3, kept: 79 },
  { name: "Pirkanmaa", c: 2, r: 3, kept: 84 },
  { name: "Keski-Suomi", c: 3, r: 3, kept: 61 },
  { name: "Etelä-Savo", c: 4, r: 3, kept: 63 },
  { name: "Satakunta", c: 1, r: 4, kept: 76 },
  { name: "Kanta-Häme", c: 2, r: 4, kept: 80 },
  { name: "Päijät-Häme", c: 3, r: 4, kept: 71 },
  { name: "Kymenlaakso", c: 4, r: 4, kept: 68 },
  { name: "Etelä-Karjala", c: 5, r: 4, kept: 75 },
  { name: "Varsinais-Suomi", c: 1, r: 5, kept: 82 },
  { name: "Länsi-Uusimaa", c: 2, r: 5, kept: 78 },
  { name: "Keski-Uusimaa", c: 3, r: 5, kept: 83 },
  { name: "Itä-Uusimaa", c: 4, r: 5, kept: 73 },
  { name: "Helsinki", c: 3, r: 6, kept: 86 },
  { name: "Vantaa-Kerava", c: 4, r: 6, kept: 80 },
];

const statusOf = (k: number) => (k >= 75 ? C.ok : k >= 65 ? C.warn : C.alert);

export const Cockpit: React.FC = () => {
  const f = useCurrentFrame();
  const fillAt = s(4.2);
  const filled = f >= fillAt;
  const tickAt = s(7.4);
  const TILE_W = 180;
  const TILE_H = 86;
  const GAP = 6;
  return (
    <Frame
      section={filled ? "County cockpit / synthetic" : "Finland today / real"}
      source={
        <>
          <Src id="STRATEGY">Goal 3 indicator "treatment within target times", national cancer strategy 2026-2035, p.5</Src>
          {filled ? <div>Filled values are SYNTHETIC</div> : <div>No public per-county access-time data found</div>}
        </>
      }
    >
      <div style={{ position: "absolute", left: 96, top: 190, width: 680 }}>
        <Appear at={0}>
          <div style={{ fontSize: 64, fontWeight: 300, lineHeight: 1.1 }}>Promises kept, per wellbeing county.</div>
        </Appear>
        <Appear at={s(0.8)} style={{ marginTop: 28 }}>
          <Label size={22} color={filled ? C.fg : C.muted}>
            {filled ? "With Polku / lung / last 90 d" : "Finland today / not measured"}
          </Label>
        </Appear>
        <Appear at={s(9)} style={{ marginTop: 60, border: `1px solid ${C.line}`, backgroundColor: C.panel, padding: "22px 26px" }}>
          <Label size={15} style={{ marginBottom: 12 }}>
            Keski-Suomi / where the wait is
          </Label>
          <div style={{ fontSize: 26, lineHeight: 1.35 }}>
            First specialist visit: median 24 d against a 5 d target.
          </div>
          <div style={{ height: 1, backgroundColor: C.line, margin: "18px 0" }} />
          <Label size={15} style={{ marginBottom: 10 }}>
            Recommendation / roadmap 2.5.2
          </Label>
          <div style={{ fontSize: 26, lineHeight: 1.35 }}>Direct CT route from primary care.</div>
          <div style={{ fontSize: 20, color: C.muted, marginTop: 8 }}>Simulated: 9 days saved / SYNTHETIC</div>
        </Appear>
      </div>
      {/* Tile map */}
      <div style={{ position: "absolute", left: 820, top: 130 }}>
        {COUNTIES.map((co, i) => {
          const at = fillAt + (co.r * 2 + co.c) * 1.5;
          const p = interpolate(f, [at, at + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
          const ks = co.name === "Keski-Suomi";
          const ticked = ks && f >= tickAt;
          const kept = ticked ? co.kept + 1 : co.kept;
          const tilesIn = useInSafe(f, i * 1.2, 6);
          return (
            <div
              key={co.name}
              style={{
                position: "absolute",
                left: (co.c - 1) * (TILE_W + GAP),
                top: co.r * (TILE_H + GAP),
                width: TILE_W,
                height: TILE_H,
                opacity: tilesIn,
                border: `1px solid ${ticked && f < tickAt + s(2.5) ? C.fg : C.line}`,
                backgroundColor: p > 0 ? C.panel : "transparent",
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, color: C.muted, whiteSpace: "nowrap" }}>
                <span>{co.name}</span>
                {ticked && <span style={{ fontFamily: MONO, color: C.fg }}>+1 call</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {p > 0 ? (
                  <>
                    <Square size={10} color={statusOf(kept)} />
                    <span style={{ fontFamily: MONO, fontSize: 28, opacity: p, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{kept} %</span>
                  </>
                ) : (
                  <span style={{ fontFamily: MONO, fontSize: 22, color: C.dim }}>not measured</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Subtitle
        from={s(1.2)}
        to={s(4)}
        speaker="Voice-over"
        text="Today Finland cannot measure this per county."
        bottom={140}
      />
      <Subtitle from={s(4.4)} to={s(8.6)} speaker="Voice-over" text="With Polku it is a by-product of care." bottom={140} />
      <Subtitle from={s(10.4)} to={s(14.6)} speaker="Voice-over" text="And it tells the county where the wait is, and what to change." bottom={140} />
    </Frame>
  );
};

function useInSafe(f: number, start: number, dur: number) {
  return interpolate(f, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
}

/* ------------------------------------------------------------------ */
/* 9. Pathway as code                                                  */
/* ------------------------------------------------------------------ */
const CODE = [
  "{",
  '  id: "SE-M1",',
  '  level: "suspicion",',
  '  sourceId: "SE-SVF",',
  '  quote: "nytillkomna luftvägssymtom ... med en varaktighet',
  '         av 6 veckor hos rökare eller före detta rökare över 40 år",',
  "  when: {",
  '    anyOf: ["COUGH_NEW", "DYSPNOEA_NEW"],',
  "    minDays: 42,",
  "    ageOver: 40,",
  '    smoking: ["current", "former"],',
  "  },",
  "},",
];

export const Code: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Frame section="How / sovereign ontology" source={<Src id="MIT">github.com/3nd3r1/polku</Src>}>
      <div style={{ position: "absolute", left: 96, top: 190 }}>
        <Label size={18} style={{ marginBottom: 24 }}>
          src/pathways/lung.ts
        </Label>
        <div style={{ border: `1px solid ${C.line}`, backgroundColor: C.panel, padding: "28px 36px", width: 1300 }}>
          {CODE.map((l, i) => {
            const at = 4 + i * 3;
            const o = interpolate(f, [at, at + 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const isSrc = l.includes("sourceId");
            return (
              <pre key={i} style={{ margin: 0, fontFamily: MONO, fontSize: 23, lineHeight: 1.45, color: isSrc ? C.info : l.includes("quote") || l.includes("av 6") ? C.muted : C.fg, opacity: o }}>
                {l}
              </pre>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", right: 96, top: 300, textAlign: "right" }}>
        {["Typed", "Cited", "Open"].map((w, i) => (
          <Appear key={w} at={s(1.6) + i * 8}>
            <div style={{ fontSize: 72, fontWeight: 300, lineHeight: 1.25 }}>{w}.</div>
          </Appear>
        ))}
      </div>
      <Subtitle from={s(0.6)} to={s(5.8)} speaker="Voice-over" text="One typed, cited file per cancer. The next cancer is the next file." bottom={140} />
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* 10. End card                                                        */
/* ------------------------------------------------------------------ */
export const End: React.FC = () => {
  const f = useCurrentFrame();
  const fadeOut = interpolate(f, [s(6.4), s(7)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Frame wordmark={false} section="Junction 2026 / AstraZeneca: Equal Care Across Finland" source={<Src id="SOURCE">github.com/3nd3r1/polku</Src>}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: fadeOut }}>
        <Appear at={0} dur={8}>
          <Wordmark height={110} />
        </Appear>
        <Appear at={s(0.6)} dur={8} style={{ marginTop: 56 }}>
          <div style={{ fontSize: 60, fontWeight: 300 }}>Every cancer pathway, on the clock.</div>
        </Appear>
      </AbsoluteFill>
      <Subtitle from={s(1.8)} to={s(6.4)} speaker="Voice-over" text="Pathways by 2028, says the strategy. We built one this weekend." bottom={150} />
    </Frame>
  );
};
