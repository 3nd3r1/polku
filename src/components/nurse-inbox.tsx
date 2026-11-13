"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDuration, SMOKING_LABEL, SYMPTOM_LABEL } from "@/ontology/labels";
import { lung } from "@/pathways/lung";
import type { CaseAction, CaseView, ClockView } from "@/server/cases";
import { clockTime, dayAndTime, formatSpan, useNow } from "./time";

/** Nurse work only: fast-track cases. 112 and advice-only calls never reach the inbox. */
const isNurseCase = (c: CaseView) => c.outcome === "fast_track" && c.status !== "dismissed";
const openClock = (c: CaseView) => c.clocks.find((k) => k.stoppedAt === null);
const stepName = (id: string) => lung.steps.find((s) => s.id === id)?.name ?? id;
const who = (c: CaseView) => c.person?.name ?? "Unverified caller";
const facts = (c: CaseView) =>
  [c.intake.age !== undefined ? `${c.intake.age} y` : "age unknown", c.person?.county, SMOKING_LABEL[c.intake.smoking]]
    .filter(Boolean)
    .join(" · ");

export function NurseInbox() {
  const [cases, setCases] = useState<CaseView[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const now = useNow();

  const refresh = useCallback(async () => {
    const res = await fetch("/api/cases", { cache: "no-store" });
    if (res.ok) setCases((await res.json()).filter(isNurseCase));
  }, []);

  useEffect(() => {
    const events = new EventSource("/api/events");
    events.onmessage = () => refresh();
    return () => events.close();
  }, [refresh]);

  const selected = cases?.find((c) => c.id === selectedId) ?? cases?.[0];

  async function act(id: string, action: CaseAction) {
    await fetch(`/api/cases/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
  }

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="w-80 shrink-0 overflow-y-auto border-r border-line">
        <p className="label border-b border-line px-5 py-3">Callbacks · {cases?.length ?? 0}</p>
        {cases?.length === 0 && <p className="p-5 text-sm text-muted">No callbacks waiting.</p>}
        {cases?.map((c) => {
          const k = openClock(c);
          const left = k && now !== null ? new Date(k.dueAt).getTime() - now : null;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`block w-full border-b border-line px-5 py-4 text-left ${
                selected?.id === c.id ? "bg-raised" : "hover:bg-panel"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm">{who(c)}</span>
                <span className="text-xs text-dim">{clockTime(c.createdAt)}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-2 text-xs">
                <span className="text-muted">{k ? stepName(k.stepId) : "Pathway complete"}</span>
                {left !== null && (
                  <span className={`font-mono ${left < 0 ? "text-alert" : "text-muted"}`}>
                    {left < 0 ? "overdue" : formatSpan(left)}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        {selected && <CaseDetail c={selected} now={now} onAction={(a) => act(selected.id, a)} />}
      </main>
    </div>
  );
}

function CaseDetail({ c, now, onAction }: { c: CaseView; now: number | null; onAction: (a: CaseAction) => void }) {
  const criterion = lung.criteria.find((k) => k.id === c.matches[0]?.criterionId);
  const source = criterion && lung.sources.find((s) => s.id === criterion.sourceId);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-8 py-10">
      <header>
        <h1 className="text-3xl font-light">{who(c)}</h1>
        <p className="mt-1 text-muted">{facts(c)}</p>
        <p className="mt-1 text-sm text-dim">
          Called {dayAndTime(c.createdAt)}
          {c.person && ` · ${c.person.phone} · identity verified (simulated)`}
        </p>
      </header>

      <section>
        <h2 className="label">Caller said</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {c.intake.observations.map((o, i) => (
            <li key={i}>
              <p>
                {SYMPTOM_LABEL[o.code]}
                {o.durationDays !== undefined && <span className="text-muted">, {formatDuration(o.durationDays)}</span>}
              </p>
              <p className="text-sm text-muted">&ldquo;{o.quote}&rdquo;</p>
            </li>
          ))}
        </ul>
      </section>

      {criterion && (
        <section>
          <h2 className="label">Why fast track</h2>
          <p className="mt-3">{criterion.gloss}</p>
          {source && (
            <a href={source.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-dim hover:text-fg">
              Source: {source.spokenName.replace(/^the /, "")} ↗
            </a>
          )}
        </section>
      )}

      <section>
        <h2 className="label">Pathway</h2>
        <ol className="mt-3 border-l border-line">
          {lung.steps.map((step) => (
            <Step
              key={step.id}
              name={step.name}
              maxDays={step.maxDays}
              clock={c.clocks.find((k) => k.stepId === step.id)}
              now={now}
              action={
                c.status === "pending_review" && step.id === "callback"
                  ? { label: "Callback done", run: () => onAction("confirm") }
                  : c.status === "active"
                    ? { label: "Mark done", run: () => onAction("advance") }
                    : undefined
              }
            />
          ))}
        </ol>
        {c.status === "pending_review" && (
          <button onClick={() => onAction("dismiss")} className="mt-6 text-sm text-dim hover:text-alert">
            Dismiss case
          </button>
        )}
      </section>
    </div>
  );
}

function Step({
  name,
  maxDays,
  clock,
  now,
  action,
}: {
  name: string;
  maxDays: number;
  clock?: ClockView;
  now: number | null;
  action?: { label: string; run: () => void };
}) {
  const running = clock && clock.stoppedAt === null;
  const due = clock && new Date(clock.dueAt).getTime();
  const took = clock?.stoppedAt ? new Date(clock.stoppedAt).getTime() - new Date(clock.startedAt).getTime() : null;
  const late = clock && due !== undefined && (clock.stoppedAt ? new Date(clock.stoppedAt).getTime() : (now ?? 0)) > due;

  const marker = !clock ? "bg-line-strong" : late ? "bg-alert" : running ? "bg-warn" : "bg-ok";

  return (
    <li className={`relative py-4 pl-8 ${running ? "" : "opacity-90"}`}>
      <span className={`absolute top-6 -left-[5px] h-2.5 w-2.5 ${marker}`} aria-hidden />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="min-w-48 flex-1">
          <p className={clock ? "text-fg" : "text-dim"}>{name}</p>
          <p className="text-xs text-dim">
            {!clock && `Target ${maxDays} days`}
            {running && `Target ${maxDays} days · due ${dayAndTime(clock.dueAt)}`}
            {took !== null && `Done in ${formatSpan(took)}${late ? " · late" : ""}`}
          </p>
        </div>
        {running && now !== null && due !== undefined && (
          <span className={`font-mono text-2xl font-light tabular-nums ${due - now < 0 ? "text-alert" : ""}`}>
            {due - now < 0 && "−"}
            {formatSpan(due - now)}
          </span>
        )}
        {running && action && (
          <button onClick={action.run} className="h-10 bg-fg px-5 text-sm text-black hover:bg-white">
            {action.label}
          </button>
        )}
      </div>
    </li>
  );
}
