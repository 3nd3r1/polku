"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SAMPLES, simulateCall, simulateCallback } from "@/demo/scripts";
import type { CallView } from "@/server/calls";
import { ageOf, syntheticPeople } from "@/sim/people";
import { post, usePhone } from "./agent-call";
import { clockTime, useNow } from "./time";

/** What each role-card person should say to get each outcome. */
const ROLE_CARDS: Record<string, string> = {
  matti: "Cough for seven weeks, quit smoking ten years ago. Handed to the nurse.",
  aino: "Cough for almost four weeks, never smoked. Told to see a GP.",
  seppo: "Coughing up a lot of blood right now. Call 112.",
  liisa: "Has an open case with a CT booked. Hears where it stands.",
};

/**
 * Demo tooling, kept off the product screens. Everything here stands in for
 * the outside world: the patient's phone, the patient's voice, the reset.
 */
export function DemoTools() {
  const router = useRouter();
  const phone = usePhone();
  const [calls, setCalls] = useState<CallView[]>([]);
  const [token, setToken] = useState("");
  const [resetState, setResetState] = useState<string | null>(null);
  const people = syntheticPeople(4);
  // Ages depend on today: computed on the client only, so the page can prerender.
  const now = useNow();

  const refresh = useCallback(async () => {
    const res = await fetch("/api/calls", { cache: "no-store" });
    if (res.ok) setCalls(await res.json());
  }, []);

  useEffect(() => {
    const events = new EventSource("/api/events");
    events.onmessage = () => refresh();
    return () => events.close();
  }, [refresh]);

  const waiting = calls.filter((c) => c.purpose === "callback" && c.status !== "ended" && c.transcript.length === 0 && c.case);

  async function callTheLine() {
    const { callId } = await post("/api/calls");
    phone.start(callId);
    router.push("/");
  }

  async function reset() {
    setResetState("Resetting");
    const res = await fetch("/api/admin/reset", { method: "POST", headers: { authorization: `Bearer ${token}` } });
    setResetState(res.ok ? "Reset to the seeded synthetic state." : `Reset failed (${res.status}).`);
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-8 py-8">
        <header>
          <p className="label">Demo tools · synthetic</p>
          <h1 className="mt-2 text-3xl font-light">Stand-ins for the outside world</h1>
          <p className="mt-2 text-sm text-muted">
            The patient&apos;s phone, the patient&apos;s voice and the reset. Nothing here is part of Polku itself. Every scripted call goes through
            the same API and the same access gate as a real one.
          </p>
        </header>

        <Section title="Call the line" note="A browser call stands in for the phone line. Say one of these identity codes when asked.">
          {phone.available ? (
            <button
              onClick={phone.live ? phone.end : callTheLine}
              className={`h-11 px-5 text-sm ${phone.live ? "border border-alert text-alert" : "bg-fg text-black hover:bg-white"}`}
            >
              {phone.live ? "Hang up" : "Call the line from this browser"}
            </button>
          ) : (
            <p className="text-sm text-dim">No voice agent configured (NEXT_PUBLIC_ELEVENLABS_AGENT_ID). Use the scripted calls below.</p>
          )}
          <table className="mt-5 w-full text-sm">
            <tbody>
              {people.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="py-3 pr-4">{p.name}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{p.hetu}</td>
                  <td className="py-3 pr-4 text-muted">
                    {now !== null && `${ageOf(p, new Date(now))}, `}
                    {p.county}
                  </td>
                  <td className="py-3 text-muted">{ROLE_CARDS[p.id]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Play a scripted call" note="Opens the call screen and plays the call at speaking pace.">
          <div className="flex flex-wrap gap-3">
            {SAMPLES.map((s) => (
              <button
                key={s.label}
                onClick={() => {
                  simulateCall(s, () => router.push("/"));
                }}
                className="h-11 border border-line-strong px-4 text-sm hover:border-fg"
              >
                {s.label}
              </button>
            ))}
          </div>
        </Section>

        <Section
          title="Answer a callback"
          note="When the nurse accepts and there is no voice agent, the callback waits here. The scripted patient picks the first time."
        >
          {waiting.length === 0 ? (
            <p className="text-sm text-dim">No callback waiting.</p>
          ) : (
            <ul className="border-t border-line">
              {waiting.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-4 border-b border-line py-3">
                  <span className="text-sm">
                    {c.case!.person?.name} <span className="font-mono text-xs text-dim">{clockTime(c.startedAt)}</span>
                  </span>
                  <button
                    onClick={() => {
                      simulateCallback(c.id, c.case!);
                      router.push(`/nurse?case=${c.case!.id}`);
                    }}
                    className="h-9 border border-line-strong px-4 text-sm hover:border-fg"
                  >
                    Answer as {c.case!.person?.name.split(" ")[0]}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Reset" note="Wipes every call and case and reseeds the synthetic register and calendars. Needs the admin token.">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Admin token"
              className="h-11 w-64 border border-line-strong bg-raised px-3 text-sm outline-none focus:border-fg"
            />
            <button onClick={reset} disabled={!token} className="h-11 border border-line-strong px-4 text-sm hover:border-fg disabled:opacity-40">
              Reset the demo
            </button>
            {resetState && <span className="text-sm text-muted">{resetState}</span>}
          </div>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-6">
      <h2 className="text-lg">{title}</h2>
      <p className="mt-1 mb-4 text-sm text-muted">{note}</p>
      {children}
    </section>
  );
}
