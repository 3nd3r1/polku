"use client";

import { ConversationProvider, useConversation, useConversationClientTool } from "@elevenlabs/react";
import { useState } from "react";
import type { Outcome } from "@/ontology/engine";
import type { Intake } from "@/ontology/schema";
import { OutcomeBadge } from "./outcome-badge";

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
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5">
      <div>
        <h2 className="text-lg font-semibold">Call Polku</h2>
        <p className="text-sm text-zinc-600">
          Describe your symptoms. Polku checks them against published Nordic lung cancer criteria. It never diagnoses.
        </p>
      </div>

      {AGENT_ID ? (
        <button
          onClick={live ? () => conversation.endSession() : start}
          className={`rounded-full px-6 py-4 text-lg font-semibold text-white ${live ? "bg-red-600" : "bg-emerald-600 hover:bg-emerald-700"}`}
        >
          {conversation.status === "connecting" ? "Connecting…" : live ? "End call" : "Start call"}
        </button>
      ) : (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Voice is off: set NEXT_PUBLIC_ELEVENLABS_AGENT_ID. The sample calls below use the same API.
        </p>
      )}
      {live && <p className="text-sm text-zinc-600">{conversation.isSpeaking ? "Polku is speaking" : "Listening"}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      {transcript.length > 0 && (
        <ol className="flex max-h-64 flex-col gap-2 overflow-y-auto text-sm">
          {transcript.map((t, i) => (
            <li key={i} className={t.role === "user" ? "text-zinc-900" : "text-zinc-500"}>
              <span className="font-medium">{t.role === "user" ? "You" : "Polku"}:</span> {t.text}
            </li>
          ))}
        </ol>
      )}

      {result && (
        <div className="rounded-lg bg-zinc-50 p-3 text-sm">
          {"error" in result ? (
            <p className="text-red-700">{result.error}</p>
          ) : (
            <>
              <OutcomeBadge outcome={result.outcome} />
              <p className="mt-2">{result.sayThis}</p>
            </>
          )}
        </div>
      )}

      <div className="border-t border-zinc-100 pt-4">
        <h3 className="text-sm font-medium text-zinc-500">Or play a sample caller</h3>
        <div className="mt-2 flex flex-col gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s.label}
              onClick={async () => setResult(await postIntake(s.intake, "sample"))}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-left text-sm hover:bg-zinc-50"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
