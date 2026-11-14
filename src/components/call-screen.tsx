"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { gapLabel, isRedFlag } from "@/ontology/clarity";
import { formatDuration, SMOKING_LABEL, STEP_LABEL, SYMPTOM_LABEL } from "@/ontology/labels";
import { lung } from "@/pathways/lung";
import type { AccessEntry, CallView } from "@/server/calls";
import { ageOf } from "@/sim/people";
import { clockTime, formatSpan, useNow, when } from "./time";

/**
 * The phone line's number, and "Call me": Polku rings the demo phone and the
 * call runs exactly like an inbound one (free for us, unlike calling the US).
 */
function CallMe({ line }: { line: string }) {
  const [state, setState] = useState<string | null>(null);
  async function ring() {
    setState("Ringing");
    const res = await fetch("/api/calls/ring", { method: "POST" });
    const r = (await res.json().catch(() => ({}))) as { error?: string };
    setState(res.ok ? "Ringing. Answer, press any key." : (r.error ?? "Could not ring the phone"));
  }
  return (
    <div className="border-t border-line px-5 py-4">
      <p className="label">Phone line</p>
      <p className="mt-1 font-mono text-sm">{line}</p>
      <button
        onClick={ring}
        disabled={state === "Ringing"}
        className="mt-3 h-9 w-full border border-line text-sm hover:border-fg disabled:opacity-50"
      >
        Call me
      </button>
      {state && <p className="mt-2 text-xs text-muted">{state}</p>}
    </div>
  );
}

/**
 * The call. Inbound calls arrive here; the handoff packet fills while the
 * patient talks, and the call ends with who has the patient next.
 */
export function CallScreen({ line }: { line: string | null }) {
  const [calls, setCalls] = useState<CallView[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/calls", { cache: "no-store" });
    if (res.ok) setCalls(((await res.json()) as CallView[]).filter((c) => c.purpose === "inbound"));
  }, []);

  useEffect(() => {
    const events = new EventSource("/api/events");
    events.onmessage = () => refresh();
    return () => events.close();
  }, [refresh]);

  // Follow the newest call unless one was picked.
  const selected = calls?.find((c) => c.id === selectedId) ?? calls?.[0];

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-72 shrink-0 flex-col border-r border-line">
        <p className="label flex h-11 shrink-0 items-center border-b border-line px-5">Calls to the line</p>
        <div className="flex-1 overflow-y-auto">
          {calls?.length === 0 && <p className="p-5 text-sm text-dim">No calls yet.</p>}
          {calls?.map((c) => {
            const [text, tone] = callState(c);
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`block w-full border-b border-line px-5 py-3 text-left ${
                  selected?.id === c.id ? "bg-raised" : "hover:bg-panel"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm">{c.person?.name ?? "Not identified"}</span>
                  <span className="font-mono text-xs text-dim">{clockTime(c.startedAt)}</span>
                </div>
                <p className={`mt-0.5 text-xs ${tone}`}>{text}</p>
              </button>
            );
          })}
        </div>
        {line && <CallMe line={line} />}
        <p className="label border-t border-line px-5 py-3">Synthetic callers</p>
      </aside>

      {selected ? (
        <CallDetail key={selected.id} c={selected} />
      ) : (
        <main className="flex flex-1 items-center justify-center text-sm text-dim">Waiting for a call.</main>
      )}
    </div>
  );
}

function callState(c: CallView): [string, string] {
  const existing = c.case !== null && c.case.callId !== c.id;
  if (c.outcome === "call_112") return ["Call 112", "text-alert"];
  if (c.outcome && existing) return ["Added to open case", "text-ok"];
  if (c.outcome === "fast_track") return ["Handed to the nurse", "text-ok"];
  if (c.outcome === "see_gp") return ["Told to see a GP", "text-muted"];
  if (c.outcome === "no_match") return ["Not handed on", "text-muted"];
  if (c.status === "verifying") return ["Identifying", "text-warn"];
  if (!c.person && c.access.some((e) => e.verdict === "refused")) return ["Refused", "text-alert"];
  if (existing) return ["Told case status", "text-ok"];
  if (c.status === "ended") return ["Ended", "text-dim"];
  return ["On the line", "text-warn"];
}

function CallDetail({ c }: { c: CallView }) {
  const [showCall, setShowCall] = useState(false);
  if (c.outcome === "call_112" && !showCall) return <RedFlag c={c} onShowCall={() => setShowCall(true)} />;
  return (
    <main className="grid min-w-0 flex-1 grid-cols-1 overflow-y-auto xl:grid-cols-[1fr_1.3fr_1fr] xl:overflow-hidden">
      <Transcript c={c} />
      <Packet c={c} />
      <AccessLog c={c} />
    </main>
  );
}

function Column({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex min-h-0 flex-col border-b border-line xl:border-b-0 xl:border-l xl:first:border-l-0">
      <p className="label flex h-11 shrink-0 items-center justify-between border-b border-line px-5">
        <span>{title}</span>
        {right}
      </p>
      {children}
    </section>
  );
}

function Transcript({ c }: { c: CallView }) {
  const end = useRef<HTMLLIElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [c.transcript.length]);
  return (
    <Column title="Call" right={c.status !== "ended" && <span className="text-warn">Live</span>}>
      <ol className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
        {c.transcript.length === 0 && <li className="text-sm text-dim">Ringing</li>}
        {c.transcript.map((t, i) => (
          <li
            key={i}
            className={`max-w-[85%] px-4 py-2.5 text-sm ${t.role === "caller" ? "self-end bg-raised" : "border border-line text-muted"}`}
          >
            {t.text}
          </li>
        ))}
        <li ref={end} aria-hidden />
      </ol>
    </Column>
  );
}

type FieldState = "filled" | "missing" | "waiting";
const FIELD_COLOR: Record<FieldState, string> = { filled: "bg-ok", missing: "bg-warn", waiting: "bg-line-strong" };

function Field({ label, state, children }: { label: string; state: FieldState; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-line py-3">
      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 ${FIELD_COLOR[state]}`} aria-hidden />
      <p className="label w-24 shrink-0 pt-0.5">{label}</p>
      <div className={`min-w-0 flex-1 text-sm ${state === "filled" ? "" : "text-muted"}`}>{children}</div>
    </div>
  );
}

/** What the nurse will get, filling up as the patient talks. */
function Packet({ c }: { c: CallView }) {
  const p = c.person;
  const k = c.case;
  const ownCase = k !== null && k.callId === c.id;
  const intake = c.draft?.intake ?? (ownCase ? k.intake : null);
  const gaps = c.outcome ? [] : (c.draft?.gaps ?? []);
  const smokingGap = gaps.some((g) => g.kind === "smoking");
  const criterion = ownCase ? lung.criteria.find((x) => x.id === k.matches[0]?.criterionId) : undefined;
  const source = criterion && lung.sources.find((s) => s.id === criterion.sourceId);

  return (
    <Column title="Handoff packet" right={<span className="text-dim">Synthetic</span>}>
      <div className="flex flex-1 flex-col overflow-y-auto p-5">
        <div>
          <p className="text-3xl font-light">{p ? p.name : c.status === "verifying" ? "Identifying" : "Not identified"}</p>
          <p className="mt-1 text-sm text-muted">
            {p
              ? `${ageOf(p)} · ${p.county} · ${p.phone}`
              : c.status === "verifying"
                ? "Mobile ID request sent to the registered phone."
                : "Nothing is collected or shown before identification."}
          </p>
        </div>

        <div className="mt-6 border-t border-line">
          <Field label="Identity" state={p ? "filled" : c.status === "verifying" ? "missing" : "waiting"}>
            {p ? "Confirmed with Mobile ID (simulated)" : c.status === "verifying" ? "Waiting for Mobile ID" : "Not yet"}
          </Field>
          <Field label="Age" state={p ? "filled" : "waiting"}>
            {p ? (
              <>
                {ageOf(p)} <span className="text-muted">from the identity check, not asked</span>
              </>
            ) : (
              "Not yet"
            )}
          </Field>
          <Field label="Symptoms" state={intake?.observations.length ? "filled" : p ? "missing" : "waiting"}>
            {intake?.observations.length ? (
              <ul className="flex flex-col gap-3">
                {intake.observations.map((o, i) => {
                  const noDuration = gaps.some((g) => g.kind === "duration" && g.code === o.code);
                  return (
                    <li key={i}>
                      <p>
                        {SYMPTOM_LABEL[o.code]}
                        {o.durationDays !== undefined && <span className="text-muted">, {formatDuration(o.durationDays)}</span>}
                        {noDuration && <span className="text-warn">, how long?</span>}
                        {o.knownCause && <span className="text-muted">, caller says: {o.knownCause}</span>}
                      </p>
                      <p className="mt-0.5 text-muted">&ldquo;{o.quote}&rdquo;</p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              "Not yet"
            )}
          </Field>
          <Field label="Smoking" state={intake && !smokingGap && intake.smoking !== "unknown" ? "filled" : p ? "missing" : "waiting"}>
            {intake && intake.smoking !== "unknown" ? SMOKING_LABEL[intake.smoking] : "Not yet"}
          </Field>
        </div>

        {gaps.length > 0 && (
          <div className="mt-6">
            <p className="label text-warn">Still missing, the agent is asking</p>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {gaps.map((g) => (
                <li key={g.kind + ("code" in g ? g.code : "")} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 border border-warn" aria-hidden />
                  {gapLabel(g)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {criterion && (
          <div className="mt-6 border-t border-line pt-4 text-sm">
            <p className="label">Criterion matched by the rules</p>
            <p className="mt-2">{criterion.gloss}.</p>
            {source && (
              <a href={source.url} target="_blank" rel="noreferrer" className="mt-1 block text-info hover:underline">
                Source: {source.name}
              </a>
            )}
          </div>
        )}

        <div className="mt-auto pt-8">
          <Handover c={c} />
        </div>
      </div>
    </Column>
  );
}

/** How the call ended: who has the patient next, and by when. */
function Handover({ c }: { c: CallView }) {
  const now = useNow();
  const k = c.case;
  const existing = k !== null && k.callId !== c.id;
  const running = k?.clocks.find((x) => !x.stoppedAt);

  if (c.outcome === "fast_track" && k && !existing) {
    const callback = k.clocks.find((x) => x.stepId === "callback");
    const left = callback && now !== null ? new Date(callback.dueAt).getTime() - now : null;
    return (
      <div className="border-t border-line pt-5">
        <p className="text-3xl font-light">
          Handed to the nurse{callback && <>, due {when(callback.dueAt)}</>}
        </p>
        {left !== null && !callback?.stoppedAt && (
          <p className={`mt-2 font-mono text-sm tabular-nums ${left < 0 ? "text-alert" : "text-ok"}`}>
            {formatSpan(left)} {left < 0 ? "over the promise" : "left on the promise"}
          </p>
        )}
        {callback?.stoppedAt && <p className="mt-2 text-sm text-ok">The nurse has taken it.</p>}
        <Link href={`/nurse?case=${k.id}`} className="mt-4 inline-block text-sm text-muted hover:text-fg">
          Open the nurse task →
        </Link>
      </div>
    );
  }
  if (existing && running) {
    const where = `${STEP_LABEL[running.stepId]} ${running.scheduledAt ? `booked ${when(running.scheduledAt)}` : `due ${when(running.dueAt)}`}`;
    return (
      <div className="border-t border-line pt-5">
        <p className="text-3xl font-light">{c.outcome ? "Added to the open case" : "Told where the case stands"}</p>
        <p className="mt-2 text-sm text-muted">{where}. Nothing was asked twice.</p>
      </div>
    );
  }
  if (c.outcome === "see_gp" || c.outcome === "no_match") {
    return (
      <div className="border-t border-line pt-5">
        <p className="text-3xl font-light">Not handed on</p>
        <p className="mt-2 text-sm text-muted">
          {c.outcome === "see_gp"
            ? "No fast-track criterion matched. The caller was told to book a GP appointment."
            : "No criterion matched. The caller was told to contact their health centre if worried."}
        </p>
      </div>
    );
  }
  return null;
}

/** Red flag: the engine decided, whatever the model said. Fills the screen. */
function RedFlag({ c, onShowCall }: { c: CallView; onShowCall: () => void }) {
  const o = c.draft?.intake.observations.find((x) => isRedFlag(x.code));
  const rule = lung.criteria.find((x) => x.level === "emergency")!;
  const source = lung.sources.find((s) => s.id === rule.sourceId)!;
  const first = c.person?.name.split(" ")[0] ?? "The caller";
  return (
    <main className="flex min-w-0 flex-1 flex-col justify-center border border-alert px-16 py-12">
      <p className="label text-alert">Emergency rule · {clockTime(c.startedAt)}</p>
      <p className="mt-4 text-[10rem] leading-none font-light text-alert">Call 112</p>
      <p className="mt-8 text-2xl font-light">{first} was told to hang up and call 112 now.</p>
      {o && (
        <p className="mt-3 text-muted">
          {SYMPTOM_LABEL[o.code]}: &ldquo;{o.quote}&rdquo;
        </p>
      )}
      <p className="mt-8 text-sm text-muted">Decided by the rules engine, not the language model. Not handed to the nurse queue.</p>
      <a href={source.url} target="_blank" rel="noreferrer" className="mt-1 text-sm text-info hover:underline">
        Source: {source.name}
      </a>
      <button onClick={onShowCall} className="mt-10 self-start text-sm text-muted hover:text-fg">
        Show the call →
      </button>
    </main>
  );
}

const TOOL_LABEL: Record<string, string> = {
  verify_identity: "Identify caller",
  get_case: "Read case",
  record_intake: "Record symptoms",
  book_time: "Book time",
};
const VERDICT_COLOR: Record<AccessEntry["verdict"], string> = { allowed: "bg-ok", refused: "bg-alert", ask: "bg-warn" };

/** Every tool call the agent made, and what the server let it see. */
function AccessLog({ c }: { c: CallView }) {
  return (
    <Column title="Access log">
      <div className="flex-1 overflow-y-auto p-5">
        <p className="text-sm text-muted">
          {c.person
            ? "The agent can reach this caller's own record and nothing else."
            : "The agent can reach nothing: the caller is not identified."}{" "}
          Decided by the server on every request, not by the prompt.
        </p>
        <ol className="mt-4 border-t border-line">
          {c.access.map((e, i) => (
            <li key={i} className="flex gap-3 border-b border-line py-3">
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 ${VERDICT_COLOR[e.verdict]}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm">{TOOL_LABEL[e.tool] ?? e.tool}</span>
                  <span className="font-mono text-xs text-dim">{clockTime(e.at, true)}</span>
                </div>
                <p className={`mt-0.5 text-sm ${e.verdict === "refused" ? "text-alert" : "text-muted"}`}>{e.detail}</p>
              </div>
            </li>
          ))}
          {c.status === "verifying" && (
            <li className="flex gap-3 border-b border-line py-3">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 animate-pulse bg-warn" aria-hidden />
              <div>
                <p className="text-sm">Identify caller</p>
                <p className="mt-0.5 text-sm text-muted">Mobile ID request sent to the registered phone</p>
              </div>
            </li>
          )}
        </ol>
      </div>
    </Column>
  );
}
