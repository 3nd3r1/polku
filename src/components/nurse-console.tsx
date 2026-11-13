"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { lung } from "@/pathways/lung";
import type { CaseAction, CaseView, ClockView } from "@/server/cases";
import { OutcomeBadge } from "./outcome-badge";

const STATUS_LABEL: Record<CaseView["status"], string> = {
  pending_review: "Waiting for nurse callback",
  active: "In pathway",
  completed: "Pathway complete",
  dismissed: "Dismissed by nurse",
  advised: "Advice given, no case opened",
};

const subscribeSeconds = (tick: () => void) => {
  const t = setInterval(tick, 1000);
  return () => clearInterval(t);
};

/** Current time, rounded to the second. Null during server render. */
function useNow() {
  return useSyncExternalStore(
    subscribeSeconds,
    () => Math.floor(Date.now() / 1000) * 1000,
    () => null,
  );
}

function formatSpan(ms: number) {
  const s = Math.floor(Math.abs(ms) / 1000);
  const d = Math.floor(s / 86400);
  const hms = [Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
  return `${d} d ${hms}`;
}

const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export function NurseConsole() {
  const [cases, setCases] = useState<CaseView[] | null>(null);
  const now = useNow();

  const refresh = useCallback(async () => {
    const res = await fetch("/api/cases", { cache: "no-store" });
    if (res.ok) setCases(await res.json());
  }, []);

  useEffect(() => {
    const events = new EventSource("/api/events");
    events.onmessage = () => refresh(); // "ready" on (re)connect, "change" after any action
    return () => events.close();
  }, [refresh]);

  async function act(id: string, action: CaseAction) {
    await fetch(`/api/cases/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Nurse console</h2>
        <span className="text-xs text-zinc-500">Live · synthetic and demo callers only</span>
      </div>
      {cases === null && <p className="text-sm text-zinc-500">Loading…</p>}
      {cases?.length === 0 && <p className="text-sm text-zinc-500">No calls yet. Start a call or play a sample caller.</p>}
      {cases?.map((c) => <CaseCard key={c.id} c={c} now={now} onAction={(a) => act(c.id, a)} />)}
    </section>
  );
}

function CaseCard({ c, now, onAction }: { c: CaseView; now: number | null; onAction: (a: CaseAction) => void }) {
  const top = c.matches[0];
  const criterion = top && lung.criteria.find((k) => k.id === top.criterionId);
  const source = criterion && lung.sources.find((s) => s.id === criterion.sourceId);
  const open = c.clocks.find((k) => k.stoppedAt === null);
  const openStep = open && lung.steps.find((s) => s.id === open.stepId);

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
      <header className="flex flex-wrap items-center gap-2">
        <OutcomeBadge outcome={c.outcome} />
        <span className="font-medium">{STATUS_LABEL[c.status]}</span>
        <span className="ml-auto text-xs text-zinc-500">
          {time(c.createdAt)} · {c.channel.replace("_", " ")}
        </span>
      </header>

      <p className="mt-2 text-zinc-600">
        {c.intake.age ?? "Age unknown"}
        {c.intake.age !== undefined && " y"} · smoking: {c.intake.smoking}
      </p>
      <ul className="mt-1 flex flex-col gap-0.5">
        {c.intake.observations.map((o, i) => (
          <li key={i}>
            <span className="font-mono text-xs">{o.code}</span>
            {o.durationDays !== undefined && <span className="text-zinc-500"> · {o.durationDays} d</span>}
            <span className="text-zinc-600"> &ldquo;{o.quote}&rdquo;</span>
            {o.knownCause && <span className="text-zinc-500"> (cause given: {o.knownCause})</span>}
          </li>
        ))}
      </ul>

      {criterion && (
        <div className="mt-3 rounded-lg bg-zinc-50 p-3">
          <p>
            <span className="font-mono text-xs">{criterion.id}</span> {criterion.gloss}
          </p>
          <p className="mt-1 italic text-zinc-600">&ldquo;{criterion.quote}&rdquo;</p>
          {source && (
            <a href={source.url} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-sky-700 underline">
              {source.title}
            </a>
          )}
        </div>
      )}

      {open && openStep && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Countdown clock={open} now={now} label={openStep.name} maxDays={openStep.maxDays} />
          <div className="ml-auto flex gap-2">
            {c.status === "pending_review" && (
              <>
                <Button onClick={() => onAction("confirm")} primary>
                  Callback done, confirm
                </Button>
                <Button onClick={() => onAction("dismiss")}>Dismiss</Button>
              </>
            )}
            {c.status === "active" && (
              <Button onClick={() => onAction("advance")} primary>
                Step done
              </Button>
            )}
          </div>
        </div>
      )}

      {c.clocks.length > 0 && <Timeline clocks={c.clocks} now={now} />}
    </article>
  );
}

function Countdown({ clock, now, label, maxDays }: { clock: ClockView; now: number | null; label: string; maxDays: number }) {
  if (now === null) return null;
  const left = new Date(clock.dueAt).getTime() - now;
  return (
    <div>
      <p className="text-xs text-zinc-500">
        {label} · target {maxDays} d
      </p>
      <p className={`font-mono text-lg ${left < 0 ? "text-red-600" : "text-zinc-900"}`}>
        {left < 0 ? "overdue " : ""}
        {formatSpan(left)}
      </p>
    </div>
  );
}

function Timeline({ clocks, now }: { clocks: ClockView[]; now: number | null }) {
  return (
    <ol className="mt-3 grid grid-cols-7 gap-1">
      {lung.steps.map((step) => {
        const k = clocks.find((c) => c.stepId === step.id);
        const end = k ? (k.stoppedAt ? new Date(k.stoppedAt).getTime() : (now ?? 0)) : 0;
        const late = k && end > new Date(k.dueAt).getTime();
        const color = !k ? "bg-zinc-200" : late ? "bg-red-500" : k.stoppedAt ? "bg-emerald-500" : "bg-amber-400";
        return (
          <li key={step.id} title={`${step.name}: target ${step.maxDays} d`}>
            <div className={`h-1.5 rounded-full ${color}`} />
            <p className="mt-1 truncate text-[10px] text-zinc-500">{step.name}</p>
          </li>
        );
      })}
    </ol>
  );
}

function Button({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${primary ? "bg-zinc-900 text-white hover:bg-zinc-700" : "border border-zinc-300 hover:bg-zinc-50"}`}
    >
      {children}
    </button>
  );
}
