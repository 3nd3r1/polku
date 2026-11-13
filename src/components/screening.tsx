"use client";

import { ConversationProvider, useConversation, useConversationClientTool } from "@elevenlabs/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatDuration, SMOKING_LABEL, SYMPTOM_LABEL } from "@/ontology/labels";
import type { Intake } from "@/ontology/schema";
import { lung } from "@/pathways/lung";
import { ageOf } from "@/sim/people";
import type { CallView } from "@/server/calls";
import { clockTime, dayAndTime } from "./time";

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

const post = async (url: string, body?: unknown) =>
  (
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  ).json();

type Turn = { agent: string } | { caller: string } | { tool: "verify" } | { tool: "intake"; intake: Intake };

/** Scripted calls for demos without a phone. Synthetic people and words; the tools hit the real API. */
const SAMPLES: { label: string; personId: string; script: Turn[] }[] = [
  {
    label: "Matti",
    personId: "matti",
    script: [
      {
        agent:
          "Hi, this is Polku, the lung symptom line. I'm an AI assistant. First I'll send an identification request to your phone.",
      },
      { tool: "verify" },
      { agent: "Thank you, Matti. What symptoms have you been having?" },
      { caller: "I've had this cough for about seven weeks now. It just won't go away." },
      { agent: "Did it start after a cold, or anything else you know of?" },
      { caller: "No, nothing like that." },
      { agent: "Do you smoke, or have you smoked before?" },
      { caller: "I quit about ten years ago." },
      {
        tool: "intake",
        intake: {
          smoking: "former",
          observations: [
            { code: "COUGH_NEW", durationDays: 49, quote: "I've had this cough for about seven weeks now" },
          ],
        },
      },
    ],
  },
  {
    label: "Aino",
    personId: "aino",
    script: [
      {
        agent:
          "Hi, this is Polku, the lung symptom line. I'm an AI assistant. First I'll send an identification request to your phone.",
      },
      { tool: "verify" },
      { agent: "Thank you, Aino. What symptoms have you been having?" },
      { caller: "A cough that won't go away, almost four weeks now." },
      { agent: "Do you smoke, or have you smoked before?" },
      { caller: "No, never." },
      {
        tool: "intake",
        intake: {
          smoking: "never",
          observations: [
            { code: "COUGH_NEW", durationDays: 25, quote: "a cough that won't go away, almost four weeks now" },
          ],
        },
      },
    ],
  },
  {
    label: "Seppo (emergency)",
    personId: "seppo",
    script: [
      {
        agent:
          "Hi, this is Polku, the lung symptom line. I'm an AI assistant. First I'll send an identification request to your phone.",
      },
      { tool: "verify" },
      { agent: "Thank you, Seppo. What symptoms have you been having?" },
      { caller: "I'm coughing up a lot of blood right now." },
      {
        tool: "intake",
        intake: {
          smoking: "current",
          observations: [{ code: "HAEMOPTYSIS_MASSIVE", quote: "I'm coughing up a lot of blood right now" }],
        },
      },
    ],
  },
];

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Plays a script at roughly speaking pace, through the same endpoints a live call uses. */
async function simulateCall(s: (typeof SAMPLES)[number], onStarted: (id: string) => void) {
  const { callId } = await post("/api/calls");
  onStarted(callId);
  const say = (role: "agent" | "caller", text: string) => post(`/api/calls/${callId}/transcript`, { role, text });
  for (const turn of s.script) {
    await pause(1600);
    if ("agent" in turn) await say("agent", turn.agent);
    else if ("caller" in turn) await say("caller", turn.caller);
    else if (turn.tool === "verify") await post(`/api/calls/${callId}/verify`, { personId: s.personId });
    else {
      const r = await post(`/api/intake?channel=sample&call=${callId}`, turn.intake);
      await pause(800);
      await say("agent", r.sayThis);
    }
  }
}

export function Screening() {
  return (
    <ConversationProvider>
      <ScreeningInner />
    </ConversationProvider>
  );
}

function ScreeningInner() {
  const [calls, setCalls] = useState<CallView[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const liveCallId = useRef<string | null>(null); // read by the agent's tools

  const refresh = useCallback(async () => {
    const res = await fetch("/api/calls", { cache: "no-store" });
    if (res.ok) setCalls(await res.json());
  }, []);

  useEffect(() => {
    const events = new EventSource("/api/events");
    events.onmessage = () => refresh();
    return () => events.close();
  }, [refresh]);

  // Browser call stands in for the phone line in the demo.
  const conversation = useConversation({
    onMessage: (m) =>
      liveCallId.current &&
      post(`/api/calls/${liveCallId.current}/transcript`, {
        role: m.role === "user" ? "caller" : "agent",
        text: m.message,
      }),
  });
  useConversationClientTool("verify_identity", async () => {
    const r = await post(`/api/calls/${liveCallId.current}/verify`);
    return r.sayThis ?? r.error;
  });
  useConversationClientTool("record_intake", async (params) => {
    const r = await post(`/api/intake?channel=web_call&call=${liveCallId.current}`, params);
    // On a gap the server says exactly what to ask next; the agent asks and calls again.
    return r.sayThis ?? r.error;
  });
  const live = conversation.status === "connected" || conversation.status === "connecting";

  async function startVoiceCall() {
    const { callId } = await post("/api/calls");
    liveCallId.current = callId;
    setSelectedId(callId);
    conversation.startSession({ agentId: AGENT_ID!, connectionType: "webrtc" });
  }

  const selected = calls?.find((c) => c.id === selectedId) ?? calls?.[0];

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-80 shrink-0 flex-col border-r border-line">
        <div className="border-b border-line p-5">
          <p className="label">Demo</p>
          {AGENT_ID && (
            <button
              onClick={live ? () => conversation.endSession() : startVoiceCall}
              className={`mt-3 h-11 w-full text-sm font-medium ${live ? "bg-alert text-black" : "bg-fg text-black hover:bg-white"}`}
            >
              {live ? "Hang up" : "Call from this browser"}
            </button>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span className="text-dim">Simulate:</span>
            {SAMPLES.map((s) => (
              <button key={s.label} onClick={() => simulateCall(s, setSelectedId)} className="text-muted hover:text-fg">
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <p className="label border-b border-line px-5 py-3">Incoming calls · {calls?.length ?? 0}</p>
        <div className="flex-1 overflow-y-auto">
          {calls?.length === 0 && <p className="p-5 text-sm text-muted">No calls yet.</p>}
          {calls?.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`block w-full border-b border-line px-5 py-4 text-left ${
                selected?.id === c.id ? "bg-raised" : "hover:bg-panel"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm">{c.person?.name ?? "Unknown caller"}</span>
                <span className="text-xs text-dim">{clockTime(c.startedAt)}</span>
              </div>
              <CallState c={c} />
            </button>
          ))}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">{selected && <CallDetail c={selected} />}</main>
    </div>
  );
}

function CallState({ c }: { c: CallView }) {
  const [text, tone] =
    c.status === "ringing"
      ? ["Connected", "text-muted"]
      : c.status === "verifying"
        ? ["Identifying…", "text-warn"]
        : c.status === "verified"
          ? ["Collecting symptoms…", "text-warn"]
          : c.case?.outcome === "fast_track"
            ? ["Nurse callback booked", "text-ok"]
            : c.case?.outcome === "call_112"
              ? ["Told to call 112", "text-alert"]
              : c.case?.outcome === "see_gp"
                ? ["Advised: see GP", "text-info"]
                : ["No criteria matched", "text-muted"];
  return <p className={`mt-1 text-xs ${tone}`}>{text}</p>;
}

function CallDetail({ c }: { c: CallView }) {
  const k = c.case;
  const criterion = k && lung.criteria.find((x) => x.id === k.matches[0]?.criterionId);
  const source = criterion && lung.sources.find((s) => s.id === criterion.sourceId);
  const callback = k?.clocks.find((x) => x.stepId === "callback");

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <header>
        <p className="label">Call {clockTime(c.startedAt)}</p>
        <h1 className="mt-2 text-3xl font-light">{c.person?.name ?? "Unknown caller"}</h1>
      </header>

      <div className="grid gap-10 xl:grid-cols-2">
        <section>
          <p className="label">Conversation</p>
          {c.transcript.length === 0 && <p className="mt-3 text-sm text-dim">Ringing…</p>}
          <ol className="mt-3 flex flex-col gap-3">
            {c.transcript.map((t, i) => (
              <li
                key={i}
                className={`max-w-[85%] px-4 py-2.5 text-sm ${t.role === "caller" ? "self-end bg-raised" : "border border-line text-muted"}`}
              >
                {t.text}
              </li>
            ))}
          </ol>
        </section>

        <section>
          <p className="label">AI screening</p>
          <ol className="mt-3 border-l border-line">
            <Stage title="Strong identification" done={c.person !== null} active={c.status === "verifying"}>
              {c.person ? (
                <>
                  <p>
                    {ageOf(c.person)} y · {c.person.county} · {c.person.phone}
                  </p>
                  <p className="text-xs text-dim">Mobile ID · simulated, synthetic person</p>
                </>
              ) : c.status === "verifying" ? (
                <p className="text-warn">Mobile ID request sent to the caller&rsquo;s phone…</p>
              ) : null}
            </Stage>

            <Stage title="Symptoms" done={k !== null} active={c.status === "verified"}>
              {k ? (
                <ul className="flex flex-col gap-2">
                  {k.intake.observations.map((o, i) => (
                    <li key={i}>
                      <p>
                        {SYMPTOM_LABEL[o.code]}
                        {o.durationDays !== undefined && (
                          <span className="text-muted">, {formatDuration(o.durationDays)}</span>
                        )}
                      </p>
                      <p className="text-sm text-muted">&ldquo;{o.quote}&rdquo;</p>
                    </li>
                  ))}
                  <li className="text-muted">{SMOKING_LABEL[k.intake.smoking]}</li>
                </ul>
              ) : c.status === "verified" ? (
                <p className="text-warn">Listening…</p>
              ) : null}
            </Stage>

            <Stage title="Criteria check" done={k !== null}>
              {k &&
                (criterion ? (
                  <>
                    <p>{criterion.gloss}</p>
                    {source && <p className="text-xs text-dim">{source.spokenName.replace(/^the /, "Source: ")}</p>}
                  </>
                ) : (
                  <p className="text-muted">No pathway criterion matched.</p>
                ))}
            </Stage>

            <Stage title="Outcome" done={k !== null} last>
              {k?.outcome === "fast_track" && callback && (
                <div className="flex flex-wrap items-center gap-4">
                  <p className="text-lg">Nurse callback by {dayAndTime(callback.dueAt)}</p>
                  <Link href="/nurse" className="text-sm text-muted hover:text-fg">
                    Open in nurse view →
                  </Link>
                </div>
              )}
              {k?.outcome === "call_112" && <p className="text-lg text-alert">Told to hang up and call 112</p>}
              {k?.outcome === "see_gp" && <p className="text-lg">Advised to book a GP appointment</p>}
              {k?.outcome === "no_match" && (
                <p className="text-lg text-muted">No fast track. Told to contact their health centre if worried.</p>
              )}
            </Stage>
          </ol>
        </section>
      </div>
    </div>
  );
}

function Stage({
  title,
  done,
  active,
  last,
  children,
}: {
  title: string;
  done: boolean;
  active?: boolean;
  last?: boolean;
  children?: React.ReactNode;
}) {
  const marker = done ? "bg-ok" : active ? "bg-warn animate-pulse" : "bg-line-strong";
  return (
    <li className={`relative pl-8 ${last ? "" : "pb-8"}`}>
      <span className={`absolute top-1.5 -left-[5px] h-2.5 w-2.5 ${marker}`} aria-hidden />
      <p className={`label ${done || active ? "text-fg" : ""}`}>{title}</p>
      <div className="mt-2">{children}</div>
    </li>
  );
}
