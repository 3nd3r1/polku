"use client";

import { ConversationProvider, useConversation, useConversationClientTool } from "@elevenlabs/react";
import { useState } from "react";
import type { Outcome } from "@/ontology/engine";
import type { Intake } from "@/ontology/schema";
import { OutcomeBadge } from "./outcome-badge";
import { SectionHeader } from "./section-header";

type Result = { outcome: Outcome; sayThis: string } | { error: string };

async function postIntake(intake: unknown, channel: "web_call" | "sample"): Promise<Result> {
  const res = await fetch(`/api/intake?channel=${channel}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(intake),
  });
  return res.json();
}

/** Scripted callers, for demos without a microphone. Synthetic. */
const SAMPLES: { label: string; intake: Intake }[] = [
  {
    label: "Matti, 58, ex-smoker, cough for 7 weeks",
    intake: {
      age: 58,
      smoking: "former",
      observations: [{ code: "COUGH_NEW", durationDays: 49, quote: "I've had this cough for about seven weeks now" }],
    },
  },
  {
    label: "Aino, 30, never smoked, cough for 25 days",
    intake: {
      age: 30,
      smoking: "never",
      observations: [{ code: "COUGH_NEW", durationDays: 25, quote: "a cough that won't go away, almost four weeks" }],
    },
  },
  {
    label: "Red flag: coughing up a lot of blood now",
    intake: {
      age: 66,
      smoking: "current",
      observations: [{ code: "HAEMOPTYSIS_MASSIVE", quote: "I'm coughing up a lot of blood right now" }],
    },
  },
];

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

export function CallPanel() {
  return (
    <ConversationProvider>
      <CallPanelInner />
    </ConversationProvider>
  );
}

function CallPanelInner() {
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    onMessage: (m) => setTranscript((t) => [...t, { role: m.role, text: m.message }]),
    onError: (message) => setError(message),
  });

  // The agent calls this mid-conversation; whatever we return is what it reads back.
  useConversationClientTool("record_intake", async (params) => {
    const r = await postIntake(params, "web_call");
    setResult(r);
    return "error" in r ? `Could not record the intake: ${r.error}. Ask for what is missing and try again.` : r.sayThis;
  });

  const live = conversation.status === "connected" || conversation.status === "connecting";

  async function start() {
    setError(null);
    setTranscript([]);
    setResult(null);
    conversation.startSession({ agentId: AGENT_ID!, connectionType: "webrtc" });
  }

  return (
    <section className="flex flex-col border-line lg:border-r">
      <SectionHeader index="01" title="Intake" right={live ? "Call live" : "Idle"} />

      <div className="flex flex-col gap-6 p-6">
        <p className="text-sm text-muted">
          Describe your symptoms. Polku checks them against published criteria and never diagnoses.
        </p>

        {AGENT_ID ? (
          <button
            onClick={live ? () => conversation.endSession() : start}
            className={`flex h-20 items-center justify-between px-6 text-left text-lg font-medium transition-colors ${
              live ? "bg-alert text-black" : "bg-fg text-black hover:bg-white"
            }`}
          >
            <span>{conversation.status === "connecting" ? "Connecting" : live ? "End call" : "Call Polku"}</span>
            <span className="font-mono text-sm">{live ? (conversation.isSpeaking ? "SPEAKING" : "LISTENING") : "VOICE →"}</span>
          </button>
        ) : (
          <div className="border border-warn/40 bg-warn/5 p-4 text-sm text-warn">
            Voice is off. Set NEXT_PUBLIC_ELEVENLABS_AGENT_ID to enable calling. Sample callers below use the same API.
          </div>
        )}
        {error && <p className="font-mono text-xs text-alert">{error}</p>}

        {transcript.length > 0 && (
          <ol className="flex max-h-72 flex-col gap-3 overflow-y-auto border-l border-line pl-4 text-sm">
            {transcript.map((t, i) => (
              <li key={i}>
                <span className="label">{t.role === "user" ? "Caller" : "Polku"}</span>
                <p className={t.role === "user" ? "text-fg" : "text-muted"}>{t.text}</p>
              </li>
            ))}
          </ol>
        )}

        {result && (
          <div className="border border-line bg-panel p-4">
            {"error" in result ? (
              <p className="font-mono text-xs text-alert">{result.error}</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="label">Polku says</span>
                  <OutcomeBadge outcome={result.outcome} />
                </div>
                <p className="mt-3 text-sm leading-relaxed">{result.sayThis}</p>
              </>
            )}
          </div>
        )}

        <div>
          <p className="label">Sample callers · synthetic</p>
          <ul className="mt-3 border-t border-line">
            {SAMPLES.map((s) => (
              <li key={s.label} className="border-b border-line">
                <button
                  onClick={async () => setResult(await postIntake(s.intake, "sample"))}
                  className="flex w-full items-center justify-between px-1 py-3 text-left text-sm text-muted transition-colors hover:bg-raised hover:text-fg"
                >
                  {s.label}
                  <span className="font-mono">→</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
