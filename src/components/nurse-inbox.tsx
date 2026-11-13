"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDuration, SMOKING_LABEL, SYMPTOM_LABEL } from "@/ontology/labels";
import { lung } from "@/pathways/lung";
import { type Slot, slotsFor } from "@/sim/capacity";
import type { CaseView, ClockView } from "@/server/cases";
import { clockTime, dayAndTime, formatSpan, useNow } from "./time";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Nurse work only: fast-track cases. 112 and advice-only calls never reach the inbox. */
const isNurseCase = (c: CaseView) => c.outcome === "fast_track" && c.status !== "dismissed";
const openClock = (c: CaseView) => c.clocks.find((k) => k.stoppedAt === null);
const step = (id: string) => lung.steps.find((s) => s.id === id)!;
const firstName = (c: CaseView) => c.person?.name.split(" ")[0] ?? "caller";
const facts = (c: CaseView) =>
  [c.intake.age !== undefined ? `${c.intake.age} y` : "age unknown", c.county, SMOKING_LABEL[c.intake.smoking]]
    .filter(Boolean)
    .join(" · ");
const fullDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Whole days a booked time lands after the step's deadline (0 or less = on time). */
const daysLate = (k: ClockView, at: string) => Math.ceil((new Date(at).getTime() - new Date(k.dueAt).getTime()) / DAY_MS);

async function caseAction(id: string, body: object) {
  await fetch(`/api/cases/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

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

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="w-80 shrink-0 overflow-y-auto border-r border-line">
        <p className="label border-b border-line px-5 py-3">Patients · {cases?.length ?? 0}</p>
        {cases?.length === 0 && <p className="p-5 text-sm text-muted">No patients waiting.</p>}
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
                <span className="text-sm">{c.person?.name ?? "Unverified caller"}</span>
                <span className="text-xs text-dim">{clockTime(c.createdAt)}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-2 text-xs">
                <span className="text-muted">{k ? step(k.stepId).name : "Pathway complete"}</span>
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
        {selected && <CaseDetail key={selected.id} c={selected} now={now} />}
      </main>
    </div>
  );
}

function CaseDetail({ c, now }: { c: CaseView; now: number | null }) {
  const criterion = lung.criteria.find((k) => k.id === c.matches[0]?.criterionId);
  const k = openClock(c);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-8 py-10">
      <header>
        <h1 className="text-3xl font-light">{c.person?.name ?? "Unverified caller"}</h1>
        <p className="mt-1 text-muted">{facts(c)}</p>
        <p className="mt-1 text-sm text-dim">
          Called {dayAndTime(c.createdAt)}
          {c.person && ` · ${c.person.phone} · identity verified (simulated)`}
        </p>
      </header>

      <NextAction c={c} clock={k} now={now} />

      <section className="grid gap-8 md:grid-cols-2">
        <div>
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
        </div>
        {criterion && (
          <div>
            <h2 className="label">Why fast track</h2>
            <p className="mt-3">{criterion.gloss}</p>
            {c.notes && (
              <>
                <h2 className="label mt-6">Callback notes</h2>
                <p className="mt-2 text-sm whitespace-pre-wrap text-muted">{c.notes}</p>
              </>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="label">Pathway</h2>
        <ol className="mt-3 border-l border-line">
          {lung.steps.map((s) => (
            <Step
              key={s.id}
              name={s.name}
              maxDays={s.maxDays}
              clock={c.clocks.find((x) => x.stepId === s.id)}
              now={now}
            />
          ))}
        </ol>
      </section>
    </div>
  );
}

/** The one thing the nurse should do now. */
function NextAction({ c, clock, now }: { c: CaseView; clock?: ClockView; now: number | null }) {
  if (c.status === "pending_review") return <Callback c={c} />;
  if (c.status === "completed" || !clock) {
    return <Panel title="Pathway complete">All steps are done.</Panel>;
  }
  const s = step(clock.stepId);
  if (!clock.scheduledAt) return <Booking key={clock.stepId} c={c} clock={clock} />;

  const late = daysLate(clock, clock.scheduledAt);
  const happened = now !== null && new Date(clock.scheduledAt).getTime() <= now;
  return (
    <Panel title={`${s.name}: booked`}>
      <p className="text-xl">{fullDate(clock.scheduledAt)}</p>
      <p className="text-muted">{clock.unit}</p>
      <p className={`mt-1 text-sm ${late > 0 ? "text-alert" : "text-ok"}`}>
        {late > 0 ? `Misses the ${s.maxDays}-day target by ${late} days` : `Within the ${s.maxDays}-day target`}
      </p>
      <button
        onClick={() => caseAction(c.id, { action: "advance" })}
        className="mt-5 h-11 bg-fg px-5 text-sm text-black hover:bg-white"
      >
        {happened ? `Mark ${s.name.toLowerCase()} done` : "Mark done (demo: skip ahead)"}
      </button>
    </Panel>
  );
}

function Callback({ c }: { c: CaseView }) {
  const [phase, setPhase] = useState<"idle" | "dialing" | "connected">("idle");
  const [confirmed, setConfirmed] = useState(false);
  const [informed, setInformed] = useState(false);
  const [notes, setNotes] = useState("");

  function dial() {
    setPhase("dialing");
    setTimeout(() => setPhase("connected"), 1800);
  }

  if (phase === "idle") {
    return (
      <Panel title="Next: nurse callback">
        <p className="text-muted">Confirm the symptoms with {firstName(c)} and decide on referral.</p>
        <button onClick={dial} className="mt-5 h-11 bg-fg px-5 text-sm text-black hover:bg-white">
          Call {firstName(c)} · {c.person?.phone ?? "number unknown"}
        </button>
      </Panel>
    );
  }
  if (phase === "dialing") {
    return (
      <Panel title="Calling">
        <p className="animate-pulse text-xl">Calling {c.person?.phone}…</p>
        <p className="text-xs text-dim">Simulated call</p>
      </Panel>
    );
  }
  return (
    <Panel title={`On call with ${firstName(c)} · simulated`}>
      <div className="flex flex-col gap-3">
        <Check checked disabled label="Identity verified with Mobile ID" />
        <Check checked={confirmed} onChange={setConfirmed} label="Symptoms and duration confirmed with the caller" />
        <Check checked={informed} onChange={setInformed} label="Caller told what happens next" />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
          rows={3}
          className="mt-2 border border-line-strong bg-base p-3 text-sm outline-none focus:border-fg"
        />
      </div>
      <div className="mt-5 flex gap-3">
        <button
          disabled={!confirmed || !informed}
          onClick={() => caseAction(c.id, { action: "confirm", notes })}
          className="h-11 bg-fg px-5 text-sm text-black hover:bg-white disabled:opacity-30"
        >
          Refer to imaging
        </button>
        <button
          onClick={() => caseAction(c.id, { action: "dismiss", notes })}
          className="h-11 border border-line-strong px-5 text-sm hover:bg-raised"
        >
          No referral
        </button>
      </div>
    </Panel>
  );
}

function Booking({ c, clock }: { c: CaseView; clock: ClockView }) {
  const s = step(clock.stepId);
  const slots: Slot[] = slotsFor(c.county, clock.stepId);
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <Panel title={`Next: book ${s.name.toLowerCase()}`}>
      <p className="text-sm text-muted">
        Target {s.maxDays} days, due {fullDate(clock.dueAt)}. Free slots at {slots[0]?.unit} (synthetic availability):
      </p>
      <ul className="mt-4 flex flex-col border-t border-line">
        {slots.map((slot) => {
          const late = daysLate(clock, slot.at);
          return (
            <li key={slot.id} className="border-b border-line">
              <button
                onClick={() => setPicked(slot.id)}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm ${
                  picked === slot.id ? "bg-fg text-black" : "hover:bg-raised"
                }`}
              >
                <span>{fullDate(slot.at)}</span>
                <span className={picked === slot.id ? "" : late > 0 ? "text-alert" : "text-ok"}>
                  {late > 0 ? `${late} days over target` : "within target"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        disabled={!picked}
        onClick={() => picked && caseAction(c.id, { action: "book", slotId: picked })}
        className="mt-5 h-11 bg-fg px-5 text-sm text-black hover:bg-white disabled:opacity-30"
      >
        Book slot
      </button>
    </Panel>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-line-strong bg-panel p-6">
      <h2 className="label text-fg">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Check({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className={`flex items-center gap-3 text-sm ${disabled ? "text-muted" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="h-4 w-4 accent-[#e6e6e3]"
      />
      {label}
    </label>
  );
}

function Step({ name, maxDays, clock, now }: { name: string; maxDays: number; clock?: ClockView; now: number | null }) {
  const running = clock && clock.stoppedAt === null;
  const due = clock && new Date(clock.dueAt).getTime();
  const took = clock?.stoppedAt ? new Date(clock.stoppedAt).getTime() - new Date(clock.startedAt).getTime() : null;
  const late = clock && due !== undefined && (clock.stoppedAt ? new Date(clock.stoppedAt).getTime() : (now ?? 0)) > due;
  const marker = !clock ? "bg-line-strong" : late ? "bg-alert" : running ? "bg-warn" : "bg-ok";

  return (
    <li className="relative py-3 pl-8">
      <span className={`absolute top-5 -left-[5px] h-2.5 w-2.5 ${marker}`} aria-hidden />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <div className="min-w-48 flex-1">
          <p className={clock ? "text-fg" : "text-dim"}>{name}</p>
          <p className="text-xs text-dim">
            {!clock && `Target ${maxDays} days`}
            {running && `Target ${maxDays} days · due ${dayAndTime(clock.dueAt)}`}
            {running && clock.scheduledAt && ` · booked ${fullDate(clock.scheduledAt)}`}
            {took !== null && `Done in ${formatSpan(took)}${late ? " · late" : ""}`}
          </p>
        </div>
        {running && now !== null && due !== undefined && (
          <span className={`font-mono text-xl font-light tabular-nums ${due - now < 0 ? "text-alert" : "text-muted"}`}>
            {due - now < 0 && "−"}
            {formatSpan(due - now)}
          </span>
        )}
      </div>
    </li>
  );
}
