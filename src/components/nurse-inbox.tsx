"use client";

import { ConversationProvider } from "@elevenlabs/react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SMOKING_LABEL, STEP_LABEL } from "@/ontology/labels";
import { lung } from "@/pathways/lung";
import { CALLBACK_FIRST_MESSAGE } from "@/server/agent-tools";
import type { CallView } from "@/server/calls";
import type { CaseView } from "@/server/cases";
import type { CalendarView, Priority, WorkItem } from "@/server/schedule";
import { pause, post, useAgentCall } from "./agent-call";
import { clockTime, day, when } from "./time";

const PRIORITY: Record<Priority, { label: string; color: string }> = {
  risk: { label: "At risk", color: "bg-alert" },
  high: { label: "High", color: "bg-warn" },
  routine: { label: "Routine", color: "bg-line-strong" },
};
const firstName = (c: CaseView) => c.person?.name.split(" ")[0] ?? "the patient";

export function NurseInbox() {
  return (
    <ConversationProvider>
      <NurseInner />
    </ConversationProvider>
  );
}

function NurseInner() {
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
          <span>To book, most urgent first</span>
          <span className="text-dim">{items?.length ?? ""}</span>
        </p>
        <div className="flex-1 overflow-y-auto">
          {items?.length === 0 && <p className="p-5 text-sm text-dim">Everyone is booked.</p>}
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
          <Booking
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

function Booking({ item, rank, call, onAct }: { item: WorkItem; rank: number; call: CallView | null; onAct: () => void }) {
  const c = item.case;
  const [fetched, setFetched] = useState<CalendarView | null>(null);
  const cal = rank > 0 ? item.calendar : (fetched ?? item.calendar);
  const [picked, setPicked] = useState<string[]>(item.calendar.suggested);
  const agent = useAgentCall();

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
  const step = STEP_LABEL[cal.stepId];
  const sessions = cal.days.flatMap((d) => d.sessions);
  const booked = sessions.find((s) => s.state === "booked");
  const offered = sessions.filter((s) => s.state === "offered").map((s) => s.at);
  const proposing = offered.length > 0 ? offered : picked;

  function toggle(at: string) {
    setPicked((p) => (p.includes(at) ? p.filter((x) => x !== at) : p.length < 3 ? [...p, at].sort() : p));
  }

  async function propose(simulate: boolean) {
    onAct();
    const r = await post(`/api/cases/${c.id}/propose`, { times: picked });
    if (!r.callId) return console.error(r.error);
    if (simulate || !agent.available) simulateCallback(r.callId, c);
    else agent.start(r.callId, CALLBACK_FIRST_MESSAGE);
  }

  return (
    <div className="flex flex-col gap-8 px-8 py-8">
      <header>
        {rank > 0 && (
          <p className="label flex items-center gap-2">
            <span className={`h-2.5 w-2.5 ${PRIORITY[item.priority].color}`} aria-hidden />
            Priority {rank} · {PRIORITY[item.priority].label}
          </p>
        )}
        <h1 className="mt-2 text-3xl font-light">{c.person?.name ?? "Unknown"}</h1>
        <p className="mt-1 text-muted">
          {[c.intake.age, c.county, SMOKING_LABEL[c.intake.smoking]].filter((x) => x !== undefined && x !== null).join(" · ")}
        </p>
        {criterion && (
          <p className="mt-3 text-sm">
            {criterion.gloss}
            {source && (
              <a href={source.url} target="_blank" rel="noreferrer" className="ml-2 text-info hover:underline">
                {source.spokenName.replace(/^the /, "")}
              </a>
            )}
          </p>
        )}
      </header>

      <section>
        {cal.path && (
          <p className="font-mono text-xs text-muted">
            {step} within {cal.maxDays} days <span className="text-dim">→</span> {cal.path.capability}{" "}
            <span className="text-dim">→</span> {cal.path.resource} <span className="text-dim">→</span> {cal.path.facility},{" "}
            {cal.path.county}
          </p>
        )}
        <Calendar cal={cal} picked={booked || offered.length ? [] : picked} onPick={booked || offered.length ? undefined : toggle} />
        <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-dim">
          <Key className="bg-raised" label="Taken" />
          <Key className="border border-line-strong" label="Free" />
          <Key className="bg-fg" label="Proposed" />
          <Key className="bg-ok" label="Booked" />
          <span>Limit {when(cal.dueAt)}</span>
        </p>
      </section>

      {booked ? (
        <section className="border-t border-line pt-6">
          <p className="label">Booked</p>
          <p className="mt-2 text-2xl font-light">
            {step} {when(booked.at)}, {cal.path?.facility}
          </p>
          <p className={`mt-1 text-sm ${new Date(booked.at) <= new Date(cal.dueAt) ? "text-ok" : "text-warn"}`}>
            {new Date(booked.at) <= new Date(cal.dueAt) ? "Within the time limit." : "After the time limit."} {name} picked it on the call.
          </p>
        </section>
      ) : call && call.status !== "ended" ? null : (
        <section className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-6">
          <button
            onClick={() => propose(false)}
            disabled={picked.length === 0 || agent.live}
            className="h-11 bg-fg px-5 text-sm text-black hover:bg-white disabled:opacity-40"
          >
            Call {name} and propose {picked.length === 1 ? "this time" : `these ${picked.length} times`}
          </button>
          {agent.available && (
            <button onClick={() => propose(true)} disabled={picked.length === 0} className="text-sm text-muted hover:text-fg">
              Play the call
            </button>
          )}
          <p className="basis-full text-sm text-muted">
            Polku calls {c.person?.phone}, checks it is {name} with Mobile ID, reads the times and books the one {name} picks.
          </p>
        </section>
      )}

      {call && <CallProgress call={call} times={proposing} live={agent.live} onHangUp={agent.end} />}
    </div>
  );
}

function Key({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 ${className}`} aria-hidden />
      {label}
    </span>
  );
}

/** Two weeks of the resource's sessions. Click free ones to change what is proposed. */
function Calendar({ cal, picked, onPick }: { cal: CalendarView; picked: string[]; onPick?: (at: string) => void }) {
  const times = [...new Set(cal.days.flatMap((d) => d.sessions.map((s) => clockTime(s.at))))].sort();
  const due = new Date(cal.dueAt);
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full border-collapse font-mono text-xs tabular-nums">
        <thead>
          <tr>
            <th className="w-14" />
            {cal.days.map((d) => {
              const late = new Date(d.date) > due;
              return (
                <th key={d.date} className={`h-9 border-b border-line px-1 text-left font-normal ${late ? "text-dim" : "text-muted"}`}>
                  {day(d.date)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {times.map((t) => (
            <tr key={t}>
              <td className="pr-2 text-dim">{t}</td>
              {cal.days.map((d) => {
                const s = d.sessions.find((x) => clockTime(x.at) === t);
                if (!s) return <td key={d.date} className="h-10 border border-line/40" />;
                const isPicked = picked.includes(s.at);
                const late = new Date(s.at) > due;
                const cls =
                  s.state === "booked"
                    ? "bg-ok text-black"
                    : s.state === "offered" || isPicked
                      ? "bg-fg text-black"
                      : s.state === "free"
                        ? `border border-line-strong ${late ? "text-dim" : "text-muted"} ${onPick ? "cursor-pointer hover:border-fg hover:text-fg" : ""}`
                        : s.state === "taken"
                          ? "bg-raised"
                          : "";
                return (
                  <td key={d.date} className="h-10 p-0.5">
                    <button
                      type="button"
                      disabled={s.state !== "free" || !onPick}
                      onClick={() => onPick?.(s.at)}
                      className={`flex h-full w-full items-center px-2 ${cls}`}
                    >
                      {s.state === "booked" ? "Booked" : s.state === "offered" || isPicked ? "Proposed" : s.state === "free" ? (late ? "late" : "free") : ""}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The callback as it happens: what the agent was allowed to do, and what was said. */
function CallProgress({ call, times, live, onHangUp }: { call: CallView; times: string[]; live: boolean; onHangUp: () => void }) {
  const log = (tool: string) => call.access.filter((e) => e.tool === tool);
  const verify = log("verify_identity").at(-1);
  const read = log("get_case").find((e) => e.verdict === "allowed");
  const book = log("book_time").find((e) => e.verdict === "allowed");
  const steps: { label: string; state: "done" | "now" | "failed" | "todo"; detail?: string }[] = [
    { label: `Calling ${call.case?.person?.phone ?? ""}`, state: call.transcript.length ? "done" : "now" },
    {
      label: "Identity",
      state: call.person ? "done" : call.status === "verifying" ? "now" : verify?.verdict === "refused" ? "failed" : "todo",
      detail: call.person ? "Confirmed with Mobile ID" : call.status === "verifying" ? "Waiting for Mobile ID" : verify?.detail,
    },
    { label: `${times.length} times read out`, state: read ? "done" : "todo", detail: times.map((t) => when(t)).join(", ") },
    { label: "Patient's choice", state: book ? "done" : read ? "now" : "todo", detail: book?.detail },
  ];
  const color = { done: "bg-ok", now: "bg-warn animate-pulse", failed: "bg-alert", todo: "bg-line-strong" };
  return (
    <section className="grid gap-8 border-t border-line pt-6 lg:grid-cols-2">
      <div>
        <div className="flex items-center justify-between">
          <p className="label">Callback {clockTime(call.startedAt)}</p>
          {live && (
            <button onClick={onHangUp} className="text-sm text-alert">
              Hang up
            </button>
          )}
        </div>
        <ol className="mt-3 border-t border-line">
          {steps.map((s) => (
            <li key={s.label} className="flex gap-3 border-b border-line py-3">
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 ${color[s.state]}`} aria-hidden />
              <div>
                <p className={`text-sm ${s.state === "todo" ? "text-dim" : ""}`}>{s.label}</p>
                {s.detail && s.state !== "todo" && (
                  <p className={`mt-0.5 text-sm ${s.state === "failed" ? "text-alert" : "text-muted"}`}>{s.detail}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
      <ol className="flex flex-col gap-2">
        {call.transcript.map((t, i) => (
          <li
            key={i}
            className={`max-w-[90%] px-3 py-2 text-sm ${t.role === "caller" ? "self-end bg-raised" : "border border-line text-muted"}`}
          >
            {t.text}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Scripted callback for demos without a voice: same endpoints and the same gate as a live call. SYNTHETIC. */
async function simulateCallback(callId: string, c: CaseView) {
  const say = (role: "agent" | "caller", text: string) => post(`/api/calls/${callId}/transcript`, { role, text });
  const first = firstName(c);
  await say("agent", CALLBACK_FIRST_MESSAGE);
  await pause(1800);
  await say("caller", `Oh, hello. Yes, it's ${c.person?.hetu}.`);
  await pause(800);
  await post(`/api/calls/${callId}/verify`, { hetu: c.person?.hetu ?? "" });
  await say("agent", `Thank you, ${first}.`);
  await pause(1200);
  const r = await post(`/api/calls/${callId}/case`);
  await say("agent", r.summary ?? r.error);
  await pause(2200);
  await say("caller", "The first one is good for me.");
  await pause(1000);
  const b = await post(`/api/calls/${callId}/book`, { option: 1 });
  await say("agent", `${b.summary ?? b.error} Goodbye, ${first}.`);
  await pause(800);
  await post(`/api/calls/${callId}/end`);
}
