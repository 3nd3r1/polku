"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { lung } from "@/pathways/lung";
import type { CaseAction, CaseView, ClockView } from "@/server/cases";
import { OutcomeBadge } from "./outcome-badge";
import { SectionHeader } from "./section-header";

const STATUS_LABEL: Record<CaseView["status"], string> = {
  pending_review: "Awaiting nurse callback",
  active: "In pathway",
  completed: "Pathway complete",
  dismissed: "Dismissed by nurse",
  advised: "Advice given · no case",
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
  return `${d}d ${hms}`;
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

  const open = cases?.filter((c) => c.status === "pending_review" || c.status === "active").length ?? 0;

  return (
    <section className="flex min-w-0 flex-col">
      <SectionHeader index="02" title="Nurse console" right={cases ? `${open} open · ${cases.length} total · live` : "Connecting"} />
      {cases?.length === 0 && (
        <p className="p-6 text-sm text-muted">No calls yet. Call Polku or play a sample caller.</p>
      )}
      <div className="flex flex-col">
        {cases?.map((c) => <CaseRow key={c.id} c={c} now={now} onAction={(a) => act(c.id, a)} />)}
      </div>
    </section>
  );
}

function CaseRow({ c, now, onAction }: { c: CaseView; now: number | null; onAction: (a: CaseAction) => void }) {
  const top = c.matches[0];
  const criterion = top && lung.criteria.find((k) => k.id === top.criterionId);
  const source = criterion && lung.sources.find((s) => s.id === criterion.sourceId);
  const open = c.clocks.find((k) => k.stoppedAt === null);
  const openStep = open && lung.steps.find((s) => s.id === open.stepId);

  return (
    <article className="border-b border-line">
      <header className="flex flex-wrap items-center gap-3 bg-panel px-6 py-3">
        <OutcomeBadge outcome={c.outcome} />
        <span className="text-sm">{STATUS_LABEL[c.status]}</span>
        <span className="label ml-auto">
          {time(c.createdAt)} · {c.channel.replace("_", " ")} · #{c.id.slice(0, 6)}
        </span>
      </header>

      <div className="grid gap-6 px-6 py-5 md:grid-cols-2">
        <div>
          <p className="label">Caller</p>
          <p className="mt-2 font-mono text-sm">
            {c.intake.age !== undefined ? `${c.intake.age} y` : "age ?"} · smoking {c.intake.smoking}
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {c.intake.observations.map((o, i) => (
              <li key={i} className="text-sm">
                <span className="font-mono text-xs text-fg">{o.code}</span>
                {o.durationDays !== undefined && <span className="font-mono text-xs text-dim"> · {o.durationDays}d</span>}
                <p className="text-muted">&ldquo;{o.quote}&rdquo;</p>
                {o.knownCause && <p className="text-xs text-dim">Cause given: {o.knownCause}</p>}
              </li>
            ))}
          </ul>
        </div>

        {criterion && (
          <div className="border-l border-line-strong pl-4">
            <p className="label">Matched criterion · {criterion.id}</p>
            <p className="mt-2 text-sm">{criterion.gloss}</p>
            <p className="mt-2 text-sm text-muted italic">&ldquo;{criterion.quote}&rdquo;</p>
            {source && (
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block font-mono text-[11px] text-info hover:underline"
              >
                {source.title} ↗
              </a>
            )}
          </div>
        )}
      </div>

      {open && openStep && (
        <div className="flex flex-wrap items-end gap-4 px-6 pb-4">
          <Countdown clock={open} now={now} label={openStep.name} maxDays={openStep.maxDays} />
          <div className="ml-auto flex">
            {c.status === "pending_review" && (
              <>
                <Button onClick={() => onAction("confirm")} primary>
                  Callback done · confirm
                </Button>
                <Button onClick={() => onAction("dismiss")}>Dismiss</Button>
              </>
            )}
            {c.status === "active" && (
              <Button onClick={() => onAction("advance")} primary>
                Step done →
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
      <p className="label">
        {label} · target {maxDays}d · {left < 0 ? "overdue" : "remaining"}
      </p>
      <p className={`mt-1 font-mono text-3xl font-light tabular-nums ${left < 0 ? "text-alert" : "text-fg"}`}>
        {left < 0 && "−"}
        {formatSpan(left)}
      </p>
    </div>
  );
}

function Timeline({ clocks, now }: { clocks: ClockView[]; now: number | null }) {
  return (
    <ol className="grid grid-cols-7 border-t border-line">
      {lung.steps.map((step, i) => {
        const k = clocks.find((c) => c.stepId === step.id);
        const end = k ? (k.stoppedAt ? new Date(k.stoppedAt).getTime() : (now ?? 0)) : 0;
        const late = k && end > new Date(k.dueAt).getTime();
        const color = !k ? "bg-raised" : late ? "bg-alert" : k.stoppedAt ? "bg-ok" : "bg-warn";
        return (
          <li key={step.id} title={`${step.name}: target ${step.maxDays} days`} className="border-r border-line last:border-r-0">
            <div className={`h-1 ${color}`} />
            <p className="truncate px-2 py-2 font-mono text-[10px] text-dim uppercase">
              {String(i).padStart(2, "0")} {step.name}
            </p>
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
      className={`h-10 border px-4 text-sm transition-colors ${
        primary ? "border-fg bg-fg text-black hover:bg-white" : "border-line-strong text-fg hover:bg-raised"
      }`}
    >
      {children}
    </button>
  );
}
