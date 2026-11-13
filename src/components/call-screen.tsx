"use client";

import { ConversationProvider, useConversation, useConversationClientTool } from "@elevenlabs/react";
import { useState } from "react";
import type { Outcome } from "@/ontology/engine";
import type { Intake } from "@/ontology/schema";
import { dayAndTime } from "./time";

type Result = { outcome: Outcome; sayThis: string; callbackDueAt: string | null } | { error: string };

async function postIntake(intake: unknown, channel: "web_call" | "sample"): Promise<Result> {
  const res = await fetch(`/api/intake?channel=${channel}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(intake),
  });
  return res.json();
}

/** Scripted callers for demos without a microphone. Synthetic. */
const SAMPLES: { name: string; intake: Intake }[] = [
  {
    name: "Matti, 58",
    intake: {
      age: 58,
      smoking: "former",
      observations: [{ code: "COUGH_NEW", durationDays: 49, quote: "I've had this cough for about seven weeks now" }],
    },
  },
  {
    name: "Aino, 30",
    intake: {
      age: 30,
      smoking: "never",
      observations: [{ code: "COUGH_NEW", durationDays: 25, quote: "a cough that won't go away, almost four weeks" }],
    },
  },
  {
    name: "Emergency",
    intake: {
      age: 66,
      smoking: "current",
      observations: [{ code: "HAEMOPTYSIS_MASSIVE", quote: "I'm coughing up a lot of blood right now" }],
    },
  },
];

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

export function CallScreen() {
  return (
    <ConversationProvider>
      <Call />
    </ConversationProvider>
  );
}

function Call() {
  const [caption, setCaption] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    onMessage: (m) => m.role === "agent" && setCaption(m.message),
    onError: (message) => setError(message),
  });

  // The agent calls this mid-conversation; whatever we return is what it reads back.
  useConversationClientTool("record_intake", async (params) => {
    const r = await postIntake(params, "web_call");
    setResult(r);
    return "error" in r ? `Could not record the intake: ${r.error}. Ask for what is missing and try again.` : r.sayThis;
  });

  const live = conversation.status === "connected" || conversation.status === "connecting";

  function start() {
    setError(null);
    setCaption(null);
    setResult(null);
    conversation.startSession({ agentId: AGENT_ID!, connectionType: "webrtc" });
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-10 px-6 py-16">
      {result && !("error" in result) && !live ? (
        <Answer result={result} onDone={() => setResult(null)} />
      ) : (
        <>
          <div>
            <h1 className="text-4xl font-light tracking-tight">Worried about a cough?</h1>
            <p className="mt-3 text-muted">
              Talk to Polku for two minutes. If your symptoms match the fast-track criteria, a nurse calls you back.
            </p>
          </div>

          <button
            onClick={live ? () => conversation.endSession() : start}
            disabled={!AGENT_ID}
            className={`h-20 text-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
              live ? "bg-alert text-black" : "bg-fg text-black hover:bg-white"
            }`}
          >
            {conversation.status === "connecting" ? "Connecting…" : live ? "End call" : "Call Polku"}
          </button>

          {live && (
            <p className="min-h-16 text-lg text-muted">{caption ?? "Polku is listening."}</p>
          )}
          {error && <p className="text-sm text-alert">{error}</p>}
          {result && "error" in result && <p className="text-sm text-alert">{result.error}</p>}
        </>
      )}

      <div className="mt-auto flex flex-col gap-3 border-t border-line pt-4">
        <p className="text-xs text-dim">Not a diagnosis. In an emergency, call 112.</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-dim">
          <span>Demo, no microphone:</span>
          {SAMPLES.map((s) => (
            <button
              key={s.name}
              onClick={async () => setResult(await postIntake(s.intake, "sample"))}
              className="text-muted underline-offset-4 hover:text-fg hover:underline"
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const ANSWER: Record<Outcome, { title: string; tone: string }> = {
  call_112: { title: "Call 112 now", tone: "border-alert text-alert" },
  fast_track: { title: "A nurse will call you", tone: "border-ok text-fg" },
  see_gp: { title: "Book a GP appointment", tone: "border-info text-fg" },
  no_match: { title: "No fast-track needed", tone: "border-line-strong text-fg" },
};

function Answer({ result, onDone }: { result: Exclude<Result, { error: string }>; onDone: () => void }) {
  const a = ANSWER[result.outcome];
  return (
    <div className="flex flex-col gap-8">
      <div className={`border-l-4 pl-6 ${a.tone}`}>
        <h1 className="text-4xl font-light tracking-tight">{a.title}</h1>
        {result.callbackDueAt && (
          <p className="mt-2 font-mono text-lg text-fg">by {dayAndTime(result.callbackDueAt)}</p>
        )}
      </div>
      <p className="text-muted">{result.sayThis}</p>
      <button onClick={onDone} className="h-12 border border-line-strong text-sm hover:bg-raised">
        Done
      </button>
    </div>
  );
}
