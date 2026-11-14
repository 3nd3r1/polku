"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SMOKING_LABEL, STAFF_ONLY_STEPS, STEP_LABEL, SYMPTOM_LABEL, formatDuration } from "@/ontology/labels";
import { lung } from "@/pathways/lung";
import type { CaseView, ClockView } from "@/server/cases";
import { day, formatSpan, shortSpan, useNow, when } from "./time";

const HOUR_MS = 60 * 60 * 1000;
const NO_REPLY_MS = 24 * HOUR_MS;

/** Nurse work only: fast-track cases. 112 and advice-only calls never reach this list. */
const isNurseCase = (c: CaseView) => c.outcome === "fast_track" && (c.status === "pending_review" || c.status === "active");
const running = (c: CaseView) => c.clocks.find((k) => k.stoppedAt === null);
const firstName = (c: CaseView) => c.person?.name.split(" ")[0] ?? "the caller";

type Group = "call" | "schedule" | "waiting" | "booked";
const GROUPS: { id: Group; title: string }[] = [
  { id: "call", title: "Call back" },
  { id: "schedule", title: "Schedule" },
  { id: "waiting", title: "Waiting for reply" },
  { id: "booked", title: "Booked" },
];

function groupOf(c: CaseView): Group {
  const k = running(c);
  if (c.status === "pending_review" || !k) return "call";
  if (k.scheduledAt) return "booked";
  if (k.offeredAt) return "waiting";
  return "schedule";
}

/** When the list sorts this case: the appointment once booked, otherwise the step's due time. */
const sortKey = (c: CaseView) => {
  const k = running(c);
  return k ? new Date(k.scheduledAt ?? k.dueAt).getTime() : 0;
};

async function act(id: string, action: string) {
  const res = await fetch(`/api/cases/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) console.error("Case action failed", action, (await res.json().catch(() => null))?.error);
}

export function NurseInbox() {
  const [cases, setCases] = useState<CaseView[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(useSearchParams().get("case"));
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

  const sorted = [...(cases ?? [])].sort((a, b) => sortKey(a) - sortKey(b));
  const selected = sorted.find((c) => c.id === selectedId) ?? sorted[0];

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-80 shrink-0 flex-col border-r border-line">
        <div className="flex-1 overflow-y-auto">
          {cases?.length === 0 && <p className="p-5 text-sm text-dim">No patients waiting.</p>}
          {GROUPS.map((g) => {
            const rows = sorted.filter((c) => groupOf(c) === g.id);
            if (rows.length === 0) return null;
            return (
              <section key={g.id}>
                <p className="label flex h-11 items-center justify-between border-b border-line px-5">
                  <span>{g.title}</span>
                  <span className="text-dim">{rows.length}</span>
                </p>
                {rows.map((c) => (
                  <Row key={c.id} c={c} now={now} selected={c.id === selected?.id} onClick={() => setSelectedId(c.id)} />
                ))}
              </section>
            );
          })}
        </div>
        <p className="label border-t border-line px-5 py-3">Synthetic patients and slots</p>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        {selected && <CaseDetail key={selected.id} c={selected} now={now} />}
      </main>
    </div>
  );
}

function Row({ c, now, selected, onClick }: { c: CaseView; now: number | null; selected: boolean; onClick: () => void }) {
  const k = running(c);
  if (!k) return null;
  const left = now === null ? null : new Date(k.dueAt).getTime() - now;
  const noReply = k.offeredAt && !k.scheduledAt && now !== null && now - new Date(k.offeredAt).getTime() > NO_REPLY_MS;

  let right: React.ReactNode = null;
  if (k.scheduledAt) right = <span className="text-muted">{when(k.scheduledAt)}</span>;
  else if (noReply) right = <span className="text-warn">No reply</span>;
  else if (left !== null)
    right = <span className={left < 0 ? "text-alert" : left < HOUR_MS * 12 ? "text-warn" : "text-muted"}>{left < 0 ? `${shortSpan(left)} over` : shortSpan(left)}</span>;

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 border-b border-line px-5 py-3 text-left ${
        selected ? "bg-raised" : "hover:bg-panel"
      }`}
    >
      <div className="min-w-0">
        <p className="truncate text-sm">{c.person?.name ?? "Unknown"}</p>
        <p className="text-xs text-muted">{STEP_LABEL[k.stepId]}</p>
      </div>
      <span className="shrink-0 font-mono text-xs tabular-nums">{right}</span>
    </button>
  );
}

function CaseDetail({ c, now }: { c: CaseView; now: number | null }) {
  const p = c.person;
  return (
    <div className="flex max-w-3xl flex-col gap-10 px-8 py-10">
      <header>
        <h1 className="text-3xl font-light">{p?.name ?? "Unknown"}</h1>
        <p className="mt-1 text-muted">
          {[c.intake.age !== undefined && `${c.intake.age}`, c.county, SMOKING_LABEL[c.intake.smoking]].filter(Boolean).join(" · ")}
        </p>
      </header>
      <NextStep c={c} now={now} />
      <Pathway c={c} now={now} />
    </div>
  );
}

/** The one thing to do now, with one button. */
function NextStep({ c, now }: { c: CaseView; now: number | null }) {
  const [busy, setBusy] = useState(false);
  const k = running(c);
  if (!k) return null;
  const run = (action: string) => async () => {
    setBusy(true);
    await act(c.id, action);
    setBusy(false);
  };
  const step = STEP_LABEL[k.stepId];
  const name = firstName(c);

  // 1. Call the patient back and decide.
  if (c.status === "pending_review") {
    const criterion = lung.criteria.find((x) => x.id === c.matches[0]?.criterionId);
    return (
      <Panel title="Now" due={k} now={now}>
        <p className="text-2xl font-light">Call {name} back</p>
        <p className="mt-1 font-mono text-muted">{c.person?.phone}</p>
        <ul className="mt-5 flex flex-col gap-1 text-sm">
          {c.intake.observations.map((o, i) => (
            <li key={i}>
              {SYMPTOM_LABEL[o.code]}
              {o.durationDays !== undefined && <span className="text-muted">, {formatDuration(o.durationDays)}</span>}
            </li>
          ))}
        </ul>
        {criterion && <p className="mt-3 text-sm text-muted">Matched: {criterion.gloss}</p>}
        <Buttons>
          <Primary onClick={run("confirm")} busy={busy}>
            Refer to CT
          </Primary>
          <Secondary onClick={run("dismiss")} busy={busy}>
            Not needed
          </Secondary>
        </Buttons>
      </Panel>
    );
  }

  // 4. Booked: done when it has happened.
  if (k.scheduledAt) {
    return (
      <Panel title="Now" due={k} now={now}>
        <p className="text-2xl font-light">
          {step} {when(k.scheduledAt)}
        </p>
        {k.unit && <p className="mt-1 text-muted">{k.unit}</p>}
        <Buttons>
          <Primary onClick={run("advance")} busy={busy}>
            Mark done
          </Primary>
        </Buttons>
      </Panel>
    );
  }

  // 3. SMS sent, waiting for YES.
  if (k.offeredAt && k.offeredSlot) {
    const noReply = now !== null && now - new Date(k.offeredAt).getTime() > NO_REPLY_MS;
    return (
      <Panel title="Now" due={k} now={now}>
        <p className="text-2xl font-light">{noReply ? `No reply from ${name}` : `Waiting for ${name}`}</p>
        <Sms at={k.offeredAt} text={smsText(step, k.offeredSlot)} />
        <Buttons>
          {noReply && (
            <Primary onClick={run("book")} busy={busy}>
              Book it and call {name}
            </Primary>
          )}
          {noReply ? (
            <Secondary onClick={run("reply")} busy={busy}>
              {name} replied YES
            </Secondary>
          ) : (
            <Primary onClick={run("reply")} busy={busy}>
              {name} replied YES
            </Primary>
          )}
        </Buttons>
        <p className="mt-3 text-xs text-dim">SMS simulated</p>
      </Panel>
    );
  }

  // 2. Pick the time: the system recommends one, the nurse sends it to the patient (or books staff-only steps).
  const slot = c.recommended;
  const staffOnly = STAFF_ONLY_STEPS.includes(k.stepId);
  return (
    <Panel title="Now" due={k} now={now}>
      <p className="label">Recommended {step}</p>
      {slot ? (
        <>
          <p className="mt-3 text-2xl font-light">{when(slot.at)}</p>
          <p className="mt-1 text-muted">{slot.unit}</p>
          <p className={`mt-1 text-sm ${slot.onTime ? "text-ok" : "text-warn"}`}>
            {slot.onTime ? "Within the time limit" : "After the time limit. Earliest free slot."}
          </p>
          <Buttons>
            {staffOnly ? (
              <Primary onClick={run("book")} busy={busy}>
                Book
              </Primary>
            ) : (
              <Primary onClick={run("offer")} busy={busy}>
                Propose to {name}
              </Primary>
            )}
          </Buttons>
        </>
      ) : (
        <p className="mt-3 text-muted">No free slot in the next weeks.</p>
      )}
    </Panel>
  );
}

const smsText = (step: string, slot: { at: string; unit: string }) =>
  `Your ${step} time: ${when(slot.at)}, ${slot.unit}. Reply YES to confirm, or call us to change it.`;

function Sms({ at, text }: { at: string; text: string }) {
  return (
    <div className="mt-5 max-w-md border border-line px-4 py-3">
      <p className="label">SMS sent {when(at)}</p>
      <p className="mt-2 text-sm">{text}</p>
    </div>
  );
}

function Panel({ title, due, now, children }: { title: string; due: ClockView; now: number | null; children: React.ReactNode }) {
  const left = now === null ? null : new Date(due.dueAt).getTime() - now;
  return (
    <section className="border border-line bg-panel p-6">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <p className="label">{title}</p>
        <p className="font-mono text-sm tabular-nums">
          <span className="text-muted">Due {when(due.dueAt)} </span>
          {left !== null && <span className={left < 0 ? "text-alert" : "text-ok"}>{formatSpan(left)} {left < 0 ? "over" : "left"}</span>}
        </p>
      </div>
      {children}
    </section>
  );
}

const Buttons = ({ children }: { children: React.ReactNode }) => <div className="mt-6 flex flex-wrap gap-3">{children}</div>;

function Primary({ onClick, busy, children }: { onClick: () => void; busy: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={busy} className="h-11 bg-fg px-5 text-sm text-black hover:bg-white disabled:opacity-50">
      {children}
    </button>
  );
}

function Secondary({ onClick, busy, children }: { onClick: () => void; busy: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={busy} className="h-11 border border-line-strong px-5 text-sm hover:bg-raised disabled:opacity-50">
      {children}
    </button>
  );
}

/** The whole pathway as a schedule: what happened, what is booked, what is due. */
function Pathway({ c, now }: { c: CaseView; now: number | null }) {
  return (
    <section>
      <p className="label">Pathway</p>
      <ol className="mt-3 border-t border-line">
        {lung.steps.map((s) => {
          const k = c.clocks.find((x) => x.stepId === s.id);
          const kept = k?.stoppedAt ? k.stoppedAt <= k.dueAt : null;
          const late = k && !k.stoppedAt && now !== null && new Date(k.dueAt).getTime() < now;
          const marker = !k ? "bg-line-strong" : k.stoppedAt ? (kept ? "bg-ok" : "bg-alert") : late ? "bg-alert" : "bg-fg";
          return (
            <li key={s.id} className="flex h-11 items-center gap-4 border-b border-line text-sm">
              <span className={`h-2.5 w-2.5 shrink-0 ${marker}`} aria-hidden />
              <span className={`flex-1 ${k ? "" : "text-muted"}`}>{STEP_LABEL[s.id]}</span>
              <span className="font-mono text-xs tabular-nums">
                {!k ? (
                  <span className="text-dim">within {s.maxDays} d</span>
                ) : k.stoppedAt ? (
                  <>
                    <span className="text-muted">Done {day(k.stoppedAt)} </span>
                    <span className={kept ? "text-ok" : "text-alert"}>{kept ? "kept" : "broken"}</span>
                  </>
                ) : k.scheduledAt ? (
                  <span>Booked {when(k.scheduledAt)}</span>
                ) : (
                  <span className={late ? "text-alert" : ""}>Due {when(k.dueAt)}</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
