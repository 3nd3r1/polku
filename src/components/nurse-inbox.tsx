"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SMOKING_LABEL, STEP_LABEL } from "@/ontology/labels";
import { lung } from "@/pathways/lung";
import { CALLBACK_FIRST_MESSAGE } from "@/server/agent-tools";
import type { CallView } from "@/server/calls";
import type { CaseView } from "@/server/cases";
import type { CalendarView, Priority, WorkItem } from "@/server/schedule";
import { post, usePhone } from "./agent-call";
import { clockTime, day, when } from "./time";

const PRIORITY: Record<Priority, { label: string; color: string }> = {
  risk: { label: "At risk", color: "bg-alert" },
  high: { label: "High", color: "bg-warn" },
  routine: { label: "Routine", color: "bg-line-strong" },
};
const firstName = (c: CaseView) => c.person?.name.split(" ")[0] ?? "the patient";

/** The task view: one task per patient, one decision each. */
export function NurseInbox() {
  const [items, setItems] = useState<WorkItem[] | null>(null);
  const [calls, setCalls] = useState<CallView[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(useSearchParams().get("case"));
  // Every patient seen, so the selected one stays on screen after booking, when they leave the list.
  const [seen, setSeen] = useState<Record<string, WorkItem>>({});

  const refresh = useCallback(async () => {
    const [w, c] = await Promise.all([fetch("/api/worklist", { cache: "no-store" }), fetch("/api/calls", { cache: "no-store" })]);
    if (w.ok) {
      const list: WorkItem[] = await w.json();
      setItems(list);
      setSeen((prev) => ({ ...prev, ...Object.fromEntries(list.map((i) => [i.case.id, i])) }));
    }
    if (c.ok) setCalls(await c.json());
  }, []);

  useEffect(() => {
    const events = new EventSource("/api/events");
    events.onmessage = () => refresh();
    return () => events.close();
  }, [refresh]);

  const selected = (selectedId && (items?.find((i) => i.case.id === selectedId) ?? seen[selectedId])) || items?.[0];

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-80 shrink-0 flex-col border-r border-line">
        <p className="label flex h-11 shrink-0 items-center justify-between border-b border-line px-5">
          <span>Tasks, most urgent first</span>
          <span className="text-dim">{items?.length ?? ""}</span>
        </p>
        <div className="flex-1 overflow-y-auto">
          {items?.length === 0 && <p className="p-5 text-sm text-dim">No tasks. A call to the line creates one.</p>}
          {items?.map((it) => (
            <button
              key={it.case.id}
              onClick={() => setSelectedId(it.case.id)}
              className={`flex w-full gap-3 border-b border-line px-5 py-3 text-left ${
                it.case.id === selected?.case.id ? "bg-raised" : "hover:bg-panel"
              }`}
            >
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 ${PRIORITY[it.priority].color}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm">{it.case.person?.name ?? "Unknown"}</span>
                  <span className="shrink-0 font-mono text-xs text-muted">
                    {STEP_LABEL[it.calendar.stepId]} by {day(it.calendar.dueAt).slice(4)}
                  </span>
                </div>
                <p className={`mt-0.5 truncate text-xs ${it.priority === "risk" ? "text-alert" : "text-muted"}`}>{it.reason}</p>
              </div>
            </button>
          ))}
        </div>
        <p className="label border-t border-line px-5 py-3">Synthetic patients and calendars</p>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        {selected && (
          <Task
            key={selected.case.id}
            item={selected}
            onAct={() => setSelectedId(selected.case.id)}
            rank={items ? items.findIndex((i) => i.case.id === selected.case.id) + 1 : 0}
            call={calls.find((c) => c.purpose === "callback" && c.case?.id === selected.case.id) ?? null}
          />
        )}
      </main>
    </div>
  );
}

/** Each task opened is a read of the record, logged once per page load. */
const opened = new Set<string>();

type Mode = "accept" | "change" | "self";

function Task({ item, rank, call, onAct }: { item: WorkItem; rank: number; call: CallView | null; onAct: () => void }) {
  const c = item.case;
  const [fetched, setFetched] = useState<CalendarView | null>(null);
  const cal = rank > 0 ? item.calendar : (fetched ?? item.calendar);
  const [picked, setPicked] = useState<string[]>(item.calendar.suggested);
  const [mode, setMode] = useState<Mode>("accept");
  const [error, setError] = useState<string | null>(null);
  const phone = usePhone();

  useEffect(() => {
    if (opened.has(c.id)) return;
    opened.add(c.id);
    post(`/api/cases/${c.id}/open`);
  }, [c.id]);

  // Once booked the patient leaves the list; their calendar is fetched directly so the booking shows.
  useEffect(() => {
    if (rank > 0) return;
    fetch(`/api/cases/${c.id}/calendar`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setFetched);
  }, [c.id, rank, call]);

  const criterion = lung.criteria.find((x) => x.id === c.matches[0]?.criterionId);
  const source = criterion && lung.sources.find((s) => s.id === criterion.sourceId);
  const name = firstName(c);
  // One source line for the whole task: the criterion that matched and the step's time limit.
  const limit = `${cal.maxDays} day limit`;
  const sources =
    source?.url === cal.source.url
      ? [{ ...cal.source, what: `criterion, ${limit}` }]
      : [...(source ? [{ name: source.name, url: source.url, what: "criterion" }] : []), { ...cal.source, what: limit }];
  const step = STEP_LABEL[cal.stepId];
  const sessions = cal.days.flatMap((d) => d.sessions);
  const booked = sessions.find((s) => s.state === "booked");
  const offered = sessions.filter((s) => s.state === "offered").map((s) => s.at);
  const proposing = offered.length > 0 ? offered : picked;
  const calling = call && call.status !== "ended";
  const decided = Boolean(booked || offered.length || calling);

  function toggle(at: string) {
    if (mode === "self") return setPicked([at]);
    setPicked((p) => (p.includes(at) ? p.filter((x) => x !== at) : p.length < 3 ? [...p, at].sort() : p));
  }

  async function accept() {
    onAct();
    setError(null);
    const r = await post(`/api/cases/${c.id}/propose`, { times: picked });
    if (!r.callId) return setError(r.error ?? "Could not start the callback");
    if (phone.available && !phone.live) phone.start(r.callId, CALLBACK_FIRST_MESSAGE);
  }

  async function bookMyself() {
    onAct();
    setError(null);
    const r = await post(`/api/cases/${c.id}/book`, { at: picked[0] });
    if (!r.ok) setError(r.error ?? "Could not book");
  }

  return (
    <div className="flex max-w-4xl flex-col gap-8 px-8 py-8">
      <header>
        {rank > 0 && (
          <p className="label flex items-center gap-2">
            <span className={`h-2.5 w-2.5 ${PRIORITY[item.priority].color}`} aria-hidden />
            Priority {rank} · {PRIORITY[item.priority].label}
          </p>
        )}
        <h1 className="mt-2 text-3xl font-light">
          {booked ? `${step} booked for ${c.person?.name}` : `Book ${step.toLowerCase()} for ${c.person?.name ?? "the patient"}`}
        </h1>
        <p className="mt-1 text-muted">
          {[c.intake.age, c.county, SMOKING_LABEL[c.intake.smoking]].filter((x) => x !== undefined && x !== null).join(" · ")}
        </p>
        {criterion && <p className="mt-3 text-sm">{criterion.gloss}.</p>}
      </header>

      {booked ? (
        <section className="border-t border-line pt-6">
          <p className="label">Booked</p>
          <p className="mt-2 text-2xl font-light">
            {step} {when(booked.at)}, {cal.path?.facility}
          </p>
          <p className={`mt-1 text-sm ${new Date(booked.at) <= new Date(cal.dueAt) ? "text-ok" : "text-warn"}`}>
            {new Date(booked.at) <= new Date(cal.dueAt) ? "Within the time limit." : "After the time limit."}{" "}
            {call?.access.some((e) => e.tool === "book_time" && e.verdict === "allowed") ? `${name} picked it on the callback.` : "Booked by the nurse."}
          </p>
          <p className="mt-4 text-sm text-muted">
            The {step} unit has {name} now, with the same record.{" "}
            <Link href="/handoffs" className="hover:text-fg">
              See the handoff →
            </Link>
          </p>
        </section>
      ) : (
        <section className="border-t border-line pt-6">
          <p className="label">
            {offered.length ? `Offered to ${name}` : mode === "self" ? "Pick the time you agreed" : mode === "change" ? "Pick up to three times" : "Proposed times"}
          </p>
          <p className="mt-2 text-sm text-muted">
            {step} at {cal.path?.facility ?? "the unit"}, by {when(cal.dueAt)}.
          </p>
          {mode === "accept" || decided ? (
            <ul className="mt-4 border-t border-line">
              {proposing.map((at) => (
                <li key={at} className="flex items-baseline gap-4 border-b border-line py-3">
                  <span className="text-xl font-light">{when(at)}</span>
                  {new Date(at) > new Date(cal.dueAt) && <span className="text-sm text-warn">after the limit</span>}
                </li>
              ))}
              {proposing.length === 0 && <li className="py-3 text-sm text-alert">No free time. Call {name} yourself.</li>}
            </ul>
          ) : (
            <FreeTimes cal={cal} picked={picked} onPick={toggle} />
          )}

          {!decided && (
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              {mode === "self" ? (
                <>
                  <button
                    onClick={bookMyself}
                    disabled={picked.length !== 1}
                    className="h-11 bg-fg px-5 text-sm text-black hover:bg-white disabled:opacity-40"
                  >
                    {picked.length === 1 ? `Book ${when(picked[0])}` : "Pick one time"}
                  </button>
                  <span className="text-sm text-muted">Call {name} on {c.person?.phone}</span>
                  <button onClick={() => setMode("accept")} className="text-sm text-muted hover:text-fg">
                    Back
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={accept}
                    disabled={picked.length === 0 || phone.live}
                    className="h-11 bg-fg px-5 text-sm text-black hover:bg-white disabled:opacity-40"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => {
                      setPicked(picked.slice(0, 1));
                      setMode("self");
                    }}
                    className="text-sm text-muted hover:text-fg"
                  >
                    I&apos;ll call {name} myself
                  </button>
                  {mode === "accept" ? (
                    <button onClick={() => setMode("change")} className="text-sm text-muted hover:text-fg">
                      Other times
                    </button>
                  ) : (
                    <button onClick={() => setMode("accept")} className="text-sm text-muted hover:text-fg">
                      Done
                    </button>
                  )}
                  <p className="basis-full text-sm text-muted">
                    On Accept, Polku calls {name}, checks it is them with Mobile ID, reads out the times and books the one {name} picks.
                  </p>
                </>
              )}
              {error && <p className="basis-full text-sm text-alert">{error}</p>}
            </div>
          )}
        </section>
      )}

      {call && !booked && <CallStatus call={call} name={name} live={phone.live && phone.callId === call.id} onHangUp={phone.end} />}

      {sources.length > 0 && (
        <p className="border-t border-line pt-4 text-xs text-dim">
          Sources:{" "}
          {sources.map((x, i) => (
            <span key={x.url}>
              {i > 0 && ", "}
              <a href={x.url} target="_blank" rel="noreferrer" className="hover:text-fg">
                {x.name}
              </a>{" "}
              ({x.what})
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

/** Free times as plain buttons, one row per day. On-time ones only, unless there are none. */
function FreeTimes({ cal, picked, onPick }: { cal: CalendarView; picked: string[]; onPick: (at: string) => void }) {
  const due = new Date(cal.dueAt);
  const free = cal.days.map((d) => ({ date: d.date, sessions: d.sessions.filter((x) => x.state === "free") }));
  const onTime = free.map((d) => ({ ...d, sessions: d.sessions.filter((x) => new Date(x.at) <= due) }));
  const days = (onTime.some((d) => d.sessions.length) ? onTime : free).filter((d) => d.sessions.length);
  return (
    <ul className="mt-4 border-t border-line">
      {days.map((d) => (
        <li key={d.date} className="flex items-center gap-4 border-b border-line py-2">
          <span className="w-24 shrink-0 text-sm text-muted">{day(d.date)}</span>
          <div className="flex flex-wrap gap-2">
            {d.sessions.map((x) => (
              <button
                key={x.at}
                type="button"
                onClick={() => onPick(x.at)}
                className={`h-9 px-3 font-mono text-sm ${
                  picked.includes(x.at) ? "bg-fg text-black" : "border border-line-strong text-muted hover:border-fg hover:text-fg"
                }`}
              >
                {clockTime(x.at)}
              </button>
            ))}
          </div>
        </li>
      ))}
      {days.length === 0 && <li className="py-3 text-sm text-alert">No free time.</li>}
    </ul>
  );
}

/** Where the callback is right now, in one line. */
function CallStatus({ call, name, live, onHangUp }: { call: CallView; name: string; live: boolean; onHangUp: () => void }) {
  const allowed = (tool: string) => call.access.some((e) => e.tool === tool && e.verdict === "allowed");
  const refused = call.access.filter((e) => e.tool === "verify_identity").at(-1)?.verdict === "refused";
  const ended = call.status === "ended";
  const [text, tone] = ended
    ? [!call.person && refused ? "The call ended. Identity was not confirmed." : `The call ended without a booking. Call ${name} yourself.`, "text-alert"]
    : allowed("get_case")
      ? [`Reading the times out to ${name}.`, ""]
      : call.person
        ? ["Identity confirmed with Mobile ID.", ""]
        : call.status === "verifying"
          ? [`Waiting for ${name} to confirm with Mobile ID.`, ""]
          : call.transcript.length
            ? [`${name} answered. Checking identity.`, ""]
            : [`Polku is calling ${name} on ${call.case?.person?.phone ?? "their phone"}.`, ""];
  return (
    <section className="flex items-center justify-between gap-4 border-t border-line pt-6">
      <p className={`flex items-center gap-3 text-sm ${tone}`}>
        <span className={`h-2.5 w-2.5 shrink-0 ${ended ? "bg-alert" : "animate-pulse bg-warn"}`} aria-hidden />
        {text}
      </p>
      {live && (
        <button onClick={onHangUp} className="text-sm text-alert">
          Hang up
        </button>
      )}
    </section>
  );
}
