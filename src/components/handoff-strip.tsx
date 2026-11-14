"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { HOLDER_LABEL, HOLDERS, MAY_OPEN, PART_LABEL } from "@/ontology/record";
import { STEP_LABEL } from "@/ontology/labels";
import type { HandoffCell, HandoffLine } from "@/server/handoffs";
import { day, useNow, when } from "./time";

const HOUR = 60 * 60 * 1000;

/**
 * The handoff strip: one line per patient. Who has the patient now, the
 * deadline for that handoff, and which parts of the one record each step
 * has opened. Click a line for every logged access.
 */
export function HandoffStrip() {
  const [lines, setLines] = useState<HandoffLine[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/handoffs", { cache: "no-store" });
    if (res.ok) setLines(await res.json());
  }, []);

  useEffect(() => {
    const events = new EventSource("/api/events");
    events.onmessage = () => refresh();
    return () => events.close();
  }, [refresh]);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className="flex items-baseline justify-between gap-6 border-b border-line px-6 py-4">
        <p className="text-sm text-muted">
          One record per patient, written once on the call. Each step opens only the parts it needs, and every open is logged.
        </p>
        <p className="label shrink-0">Synthetic patients</p>
      </div>
      <div className="grid grid-cols-[14rem_repeat(4,minmax(0,1fr))]">
        <p className="label flex h-11 items-center border-b border-line px-6">Patient</p>
        {HOLDERS.map((h) => (
          <p key={h} className="label flex h-11 items-center border-b border-l border-line px-4">
            {HOLDER_LABEL[h]}
          </p>
        ))}
        {lines?.length === 0 && <p className="col-span-5 p-6 text-sm text-dim">No patients on a pathway.</p>}
        {lines?.map((l) => (
          <Fragment key={l.key}>
            <button
              onClick={() => setOpen(open === l.key ? null : l.key)}
              className={`border-b border-line px-6 py-3 text-left ${open === l.key ? "bg-panel" : "hover:bg-panel"}`}
            >
              <p className="truncate text-sm">{l.name}</p>
              <p className="mt-0.5 truncate text-xs text-muted">{l.county}</p>
              <p className="mt-1 font-mono text-xs text-dim">{l.log.length ? `${l.log.length} logged` : ""}</p>
            </button>
            {l.cells.map((cell) => (
              <Cell key={cell.holder} cell={cell} onClick={() => setOpen(open === l.key ? null : l.key)} />
            ))}
            {open === l.key && <Log line={l} />}
          </Fragment>
        ))}
      </div>
    </main>
  );
}

function Cell({ cell, onClick }: { cell: HandoffCell; onClick: () => void }) {
  const now = useNow();
  let square = "bg-line-strong";
  let main: React.ReactNode = <span className="text-dim">Not yet</span>;
  let sub: React.ReactNode = null;

  if (cell.state === "now") {
    const left = cell.dueAt && now !== null ? new Date(cell.dueAt).getTime() - now : null;
    square = left === null ? "bg-warn" : left < 0 ? "bg-alert" : left < 24 * HOUR ? "bg-warn" : "bg-ok";
    if (cell.holder === "call") main = "On the line";
    else if (cell.scheduledAt) main = `Booked ${when(cell.scheduledAt)}`;
    else if (cell.offered) main = "Calling to book";
    else if (cell.dueAt) main = <span className={left !== null && left < 0 ? "text-alert" : ""}>Due {when(cell.dueAt)}</span>;
    const parts = [
      cell.holder === "specialist" && cell.stepId ? STEP_LABEL[cell.stepId] : null,
      cell.scheduledAt || cell.offered ? (cell.dueAt ? `due ${day(cell.dueAt)}` : null) : null,
      left !== null && left < 0 ? "promise broken" : null,
    ].filter(Boolean);
    sub = parts.join(", ") || null;
  } else if (cell.state === "done") {
    if (cell.holder === "call") {
      square = "bg-ok";
      main = <span className="text-muted">Handed on {when(cell.stoppedAt!)}</span>;
    } else {
      square = cell.kept ? "bg-ok" : "bg-alert";
      main = (
        <span className={cell.kept ? "text-muted" : "text-alert"}>
          {cell.kept ? "Kept" : "Broken"} {day(cell.stoppedAt!)}
        </span>
      );
    }
  }

  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-1 border-b border-l border-line px-4 py-3 text-left text-sm ${
        cell.state === "now" ? "bg-raised" : ""
      }`}
    >
      <span className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 shrink-0 ${square}`} aria-hidden />
        {cell.state === "now" && <span className="label text-fg">Has the patient</span>}
        {cell.state !== "now" && main}
      </span>
      {cell.state === "now" && <span>{main}</span>}
      {sub && <span className="text-xs text-muted">{sub}</span>}
      {cell.state !== "later" && (
        <span className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5 font-mono text-[11px]">
          {MAY_OPEN[cell.holder].map((p) => {
            const done = cell.opened.includes(p);
            return (
              <span key={p} className={`flex items-center gap-1 ${done ? "text-muted" : "text-dim"}`}>
                <span className={`h-1.5 w-1.5 ${done ? "bg-muted" : "border border-line-strong"}`} aria-hidden />
                {PART_LABEL[p]}
              </span>
            );
          })}
        </span>
      )}
    </button>
  );
}

function Log({ line }: { line: HandoffLine }) {
  return (
    <div className="col-span-5 border-b border-line bg-panel px-6 py-4">
      <p className="label">Record access log, {line.name}</p>
      {line.log.length === 0 ? (
        <p className="mt-2 text-sm text-dim">Nothing opened yet.</p>
      ) : (
        <ol className="mt-2">
          {line.log.map((e, i) => (
            <li key={i} className="grid grid-cols-[9rem_6rem_10rem_1fr] gap-3 border-t border-line py-2 text-sm">
              <span className="font-mono text-xs text-dim">{when(e.at)}</span>
              <span>{HOLDER_LABEL[e.holder]}</span>
              <span className="text-muted">{e.actor}</span>
              <span className="text-muted">
                {e.mode === "write" ? "Wrote" : "Opened"} {e.parts.map((p) => PART_LABEL[p].toLowerCase()).join(", ")}
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-3 text-xs text-dim">Each step can only open the parts it needs. The CT unit gets the referral reason, not the symptom story.</p>
    </div>
  );
}
