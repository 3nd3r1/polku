"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LINK_TYPES, type LinkTypeDef, linkType, OBJECT_TYPES, objectType, type OntGraph, type OntObject } from "@/ontology/meta";

const LINKS: readonly LinkTypeDef[] = LINK_TYPES;

const COLOR: Record<string, string> = {
  Person: "#3fb37f",
  Call: "#5fc99a",
  Case: "#e07a5f",
  Clock: "#f0a989",
  Appointment: "#f2c6a0",
  County: "#5b9bd5",
  Facility: "#7fb3e8",
  Resource: "#b4a7f0",
  Capability: "#9b8cd9",
  Pathway: "#e6e6e3",
  Step: "#d9a43b",
  Criterion: "#e8c872",
  Symptom: "#8d9294",
  Source: "#6f7577",
};
const PROVENANCE: Record<OntObject["provenance"], { label: string; cls: string }> = {
  real: { label: "Real · public", cls: "border-info text-info" },
  synthetic: { label: "Synthetic", cls: "border-warn text-warn" },
  design: { label: "Polku design", cls: "border-line-strong text-muted" },
};
const LAYER_LABEL = { case: "Patient journey", care: "Care network", pathway: "Pathway definition" } as const;

const W = 180;
const H = 66;

/** Model view: where each object type sits. The top row is the creation chain. */
const MODEL_POS: Record<string, [number, number]> = {
  Person: [100, 110],
  Call: [390, 110],
  Case: [680, 110],
  Clock: [970, 110],
  Appointment: [1260, 110],
  Symptom: [390, 340],
  Criterion: [680, 340],
  Step: [970, 340],
  Resource: [1260, 340],
  Facility: [1530, 340],
  Source: [535, 560],
  Pathway: [825, 560],
  Capability: [1260, 560],
  County: [1530, 560],
};
/** Hand-routed edges that would otherwise cross the whole model. */
const ROUTE: Record<string, [number, number][]> = {
  lives_in: [
    [100, 143],
    [100, 680],
    [1530, 680],
    [1530, 593],
  ],
  step_cites: [
    [940, 373],
    [940, 455],
    [595, 455],
    [595, 527],
  ],
};

type Pt = { x: number; y: number };

/** Where the line from a card's centre towards `to` leaves the card. */
function edgePoint(c: Pt, to: Pt, w = W, h = H): Pt {
  const dx = to.x - c.x;
  const dy = to.y - c.y;
  if (dx === 0 && dy === 0) return c;
  const s = Math.min(Math.abs(w / 2 / (dx || 1e-9)), Math.abs(h / 2 / (dy || 1e-9)));
  return { x: c.x + dx * s, y: c.y + dy * s };
}

export function OntologyView() {
  const [graph, setGraph] = useState<OntGraph | null>(null);
  const [openType, setOpenType] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/ontology", { cache: "no-store" });
    if (res.ok) setGraph(await res.json());
  }, []);

  useEffect(() => {
    const events = new EventSource("/api/events");
    events.onmessage = () => refresh();
    return () => events.close();
  }, [refresh]);

  const byKey = useMemo(() => new Map((graph?.objects ?? []).map((o) => [o.key, o])), [graph]);
  const ofType = useMemo(() => {
    const m: Record<string, OntObject[]> = {};
    for (const o of graph?.objects ?? []) (m[o.type] ??= []).push(o);
    return m;
  }, [graph]);

  const q = query.trim().toLowerCase();
  const matches = q && graph ? graph.objects.filter((o) => `${o.title} ${o.subtitle ?? ""}`.toLowerCase().includes(q)).slice(0, 10) : [];
  const focused = focus ? byKey.get(focus) : undefined;

  const open = (k: string) => {
    setFocus(k);
    setOpenType(byKey.get(k)?.type ?? null);
    setQuery("");
  };

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-r border-line">
        <div className="relative border-b border-line p-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a hospital, person, case…"
            className="h-9 w-full border border-line bg-base px-3 text-sm outline-none placeholder:text-dim focus:border-line-strong"
          />
          {matches.length > 0 && (
            <ul className="absolute inset-x-3 top-12 z-10 border border-line-strong bg-panel">
              {matches.map((o) => (
                <li key={o.key}>
                  <button onClick={() => open(o.key)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-raised">
                    <Swatch type={o.type} />
                    <span className="truncate">{o.title}</span>
                    <span className="ml-auto shrink-0 text-xs text-dim">{objectType(o.type)?.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={() => {
            setFocus(null);
            setOpenType(null);
          }}
          className={`flex h-10 items-center gap-3 border-b border-line px-4 text-left text-sm ${!focus ? "bg-raised text-fg" : "text-muted hover:text-fg"}`}
        >
          Whole model
        </button>
        {(["case", "care", "pathway"] as const).map((layer) => (
          <div key={layer} className="border-b border-line py-2">
            <p className="label px-4 py-1.5">{LAYER_LABEL[layer]}</p>
            {OBJECT_TYPES.filter((t) => t.layer === layer).map((t) => (
              <div key={t.id}>
                <button
                  onClick={() => setOpenType(openType === t.id ? null : t.id)}
                  title={t.description}
                  className={`flex w-full items-center gap-3 px-4 py-1.5 text-left text-sm hover:bg-raised ${openType === t.id ? "text-fg" : ""}`}
                >
                  <Swatch type={t.id} />
                  {t.plural}
                  <span className="ml-auto font-mono text-xs text-muted">{ofType[t.id]?.length ?? 0}</span>
                </button>
                {openType === t.id && (
                  <ul className="mb-1 max-h-64 overflow-y-auto border-y border-line bg-base">
                    {(ofType[t.id] ?? []).map((o) => (
                      <li key={o.key}>
                        <button
                          onClick={() => setFocus(o.key)}
                          className={`block w-full truncate py-1.5 pr-4 pl-10 text-left text-sm ${focus === o.key ? "bg-raised text-fg" : "text-muted hover:text-fg"}`}
                        >
                          {o.title}
                          {o.subtitle && <span className="text-dim"> · {o.subtitle}</span>}
                        </button>
                      </li>
                    ))}
                    {(ofType[t.id] ?? []).length === 0 && <li className="py-1.5 pl-10 text-sm text-dim">None yet</li>}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ))}
        <p className="mt-auto p-4 text-xs leading-relaxed text-dim">
          {OBJECT_TYPES.length} object types, {LINK_TYPES.length} link types. Bright arrows: what creates what.
        </p>
      </aside>

      <div className="relative min-w-0 flex-1 overflow-auto bg-base">
        {!graph && <p className="p-6 text-sm text-muted">Loading ontology…</p>}
        {graph && !focused && <ModelGraph ofType={ofType} onType={(t) => setOpenType(t)} />}
        {graph && focused && <ObjectGraph o={focused} graph={graph} byKey={byKey} onOpen={open} />}
      </div>

      {focused && (
        <aside className="w-88 shrink-0 overflow-y-auto border-l border-line bg-panel">
          <ObjectDetails o={focused} />
        </aside>
      )}
    </div>
  );
}

function Swatch({ type }: { type: string }) {
  return <span className="h-2.5 w-2.5 shrink-0" style={{ background: COLOR[type] }} />;
}

function Markers() {
  return (
    <defs>
      {[
        ["arrow-create", "#e6e6e3"],
        ["arrow-relate", "#5b6062"],
      ].map(([id, fill]) => (
        <marker key={id} id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={fill} />
        </marker>
      ))}
    </defs>
  );
}

function Edge({ pts, kind, label, sub }: { pts: Pt[]; kind: "creates" | "relates"; label: string; sub?: string }) {
  const creates = kind === "creates";
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  // Label on the middle segment.
  const i = Math.floor((pts.length - 1) / 2);
  const mx = (pts[i].x + pts[i + 1].x) / 2;
  const my = (pts[i].y + pts[i + 1].y) / 2;
  const horizontal = Math.abs(pts[i].y - pts[i + 1].y) < 1;
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={creates ? "#e6e6e3" : "#4a5052"}
        strokeWidth={creates ? 1.8 : 1}
        markerEnd={`url(#arrow-${creates ? "create" : "relate"})`}
      />
      <text
        x={mx + (horizontal ? 0 : 8)}
        y={my + (horizontal ? -8 : 4)}
        textAnchor={horizontal ? "middle" : "start"}
        className={creates ? "fill-fg text-[12px] font-medium" : "fill-muted text-[11px]"}
        style={{ paintOrder: "stroke", stroke: "#0a0b0b", strokeWidth: 4 }}
      >
        {label}
      </text>
      {sub && (
        <text
          x={mx + (horizontal ? 0 : 8)}
          y={my + (horizontal ? 14 : 18)}
          textAnchor={horizontal ? "middle" : "start"}
          className="fill-dim text-[10px]"
          style={{ paintOrder: "stroke", stroke: "#0a0b0b", strokeWidth: 4 }}
        >
          {sub}
        </text>
      )}
    </g>
  );
}

function Card({
  x,
  y,
  type,
  title,
  lines,
  onClick,
  strong,
}: {
  x: number;
  y: number;
  type: string;
  title: string;
  lines: string[];
  onClick?: () => void;
  strong?: boolean;
}) {
  return (
    <g transform={`translate(${x - W / 2} ${y - H / 2})`} onClick={onClick} className={onClick ? "cursor-pointer" : ""}>
      <rect width={W} height={H} fill={strong ? "#1b1e1f" : "#121414"} stroke={strong ? "#e6e6e3" : "#3a3f41"} />
      <rect width={4} height={H} fill={COLOR[type]} />
      <text x={16} y={22} className="fill-muted font-mono text-[10px] uppercase tracking-wider">
        {objectType(type)?.label ?? type}
      </text>
      <text x={16} y={42} className="fill-fg text-[14px]">
        {title.length > 21 ? `${title.slice(0, 20)}…` : title}
      </text>
      {lines[0] && (
        <text x={16} y={58} className="fill-dim text-[11px]">
          {lines[0].length > 27 ? `${lines[0].slice(0, 26)}…` : lines[0]}
        </text>
      )}
    </g>
  );
}

function ModelGraph({ ofType, onType }: { ofType: Record<string, OntObject[]>; onType: (t: string) => void }) {
  const at = (t: string): Pt => ({ x: MODEL_POS[t][0], y: MODEL_POS[t][1] });
  return (
    <svg viewBox="-10 30 1650 680" className="h-full min-h-[560px] w-full min-w-[900px]">
      <Markers />
      <text x={100 - W / 2} y={58} className="fill-dim font-mono text-[11px] uppercase tracking-widest">
        Patient journey: each object creates the next
      </text>
      {LINKS.filter((l) => l.from !== l.to).map((l) => {
        const route = ROUTE[l.id];
        const a = at(l.from);
        const b = at(l.to);
        const pts = route ? route.map(([x, y]) => ({ x, y })) : [edgePoint(a, b), edgePoint(b, a)];
        return (
          <Edge
            key={l.id}
            pts={pts}
            kind={l.kind}
            label={l.kind === "creates" ? (l.action ?? l.label) : l.label}
            sub={l.kind === "creates" ? l.actor : undefined}
          />
        );
      })}
      {OBJECT_TYPES.map((t) => {
        const objs = ofType[t.id] ?? [];
        const sample = objs
          .slice(0, 2)
          .map((o) => o.title)
          .join(", ");
        return (
          <Card
            key={t.id}
            x={MODEL_POS[t.id][0]}
            y={MODEL_POS[t.id][1]}
            type={t.id}
            title={`${t.plural} · ${objs.length}`}
            lines={[objs.length > 2 ? `${sample} +${objs.length - 2}` : sample || "None yet"]}
            onClick={() => onType(t.id)}
            strong={LINK_TYPES.some((l) => l.kind === "creates" && (l.from === t.id || l.to === t.id))}
          />
        );
      })}
    </svg>
  );
}

const MAX_PER_GROUP = 6;

function ObjectGraph({
  o,
  graph,
  byKey,
  onOpen,
}: {
  o: OntObject;
  graph: OntGraph;
  byKey: Map<string, OntObject>;
  onOpen: (k: string) => void;
}) {
  type Group = { linkId: string; items: OntObject[]; more: number };
  const groups = (dir: "in" | "out"): Group[] => {
    const by = new Map<string, OntObject[]>();
    for (const l of graph.links) {
      const other = dir === "in" ? (l.to === o.key ? l.from : null) : l.from === o.key ? l.to : null;
      const obj = other ? byKey.get(other) : undefined;
      if (obj) by.set(l.type, [...(by.get(l.type) ?? []), obj]);
    }
    return [...by].map(([linkId, items]) => ({ linkId, items: items.slice(0, MAX_PER_GROUP), more: Math.max(0, items.length - MAX_PER_GROUP) }));
  };
  const inGroups = groups("in");
  const outGroups = groups("out");

  const ROW = 84;
  const GAP = 36;
  const place = (gs: Group[]) => {
    let y = 0;
    return gs.map((g) => {
      const top = y;
      y += g.items.length * ROW + (g.more ? 24 : 0) + GAP;
      return { ...g, top };
    });
  };
  const left = place(inGroups);
  const right = place(outGroups);
  const height = (gs: ReturnType<typeof place>) => (gs.length ? gs[gs.length - 1].top + gs[gs.length - 1].items.length * ROW + 40 : 0);
  const total = Math.max(height(left), height(right), 300) + 80;
  const cx = 600;
  const cy = total / 2;
  const LX = 140;
  const RX = 1060;
  const offset = (gs: ReturnType<typeof place>) => (total - height(gs)) / 2 + 20;

  const side = (gs: ReturnType<typeof place>, x: number, dir: "in" | "out") => {
    const off = offset(gs);
    return gs.map((g) => {
      const lt = linkType(g.linkId);
      const kind = lt?.kind ?? "relates";
      return (
        <g key={`${dir}-${g.linkId}`}>
          {g.items.map((item, i) => {
            const y = off + g.top + i * ROW + H / 2 + 14;
            const from = dir === "in" ? { x: x + W / 2, y } : edgePoint({ x: cx, y: cy }, { x, y }, W + 40, H + 40);
            const to = dir === "in" ? edgePoint({ x: cx, y: cy }, { x, y }, W + 40, H + 40) : { x: x - W / 2, y };
            return (
              <g key={item.key}>
                <Edge pts={[from, to]} kind={kind} label={i === 0 ? (kind === "creates" ? (lt?.action ?? g.linkId) : (lt?.label ?? g.linkId)) : ""} />
                <Card x={x} y={y} type={item.type} title={item.title} lines={[item.subtitle ?? ""]} onClick={() => onOpen(item.key)} />
              </g>
            );
          })}
          {g.more > 0 && (
            <text x={x - W / 2} y={off + g.top + g.items.length * ROW + 20} className="fill-dim text-[11px]">
              +{g.more} more
            </text>
          )}
        </g>
      );
    });
  };

  return (
    <svg viewBox={`-20 0 1240 ${total}`} className="w-full min-w-[900px]" style={{ height: Math.max(total * 0.75, 560) }}>
      <Markers />
      <text x={LX - W / 2} y={28} className="fill-dim font-mono text-[11px] uppercase tracking-widest">
        Points to {o.title.length > 20 ? "this" : o.title}
      </text>
      <text x={RX - W / 2} y={28} className="fill-dim font-mono text-[11px] uppercase tracking-widest">
        {o.title.length > 20 ? "This" : o.title} points to
      </text>
      {side(left, LX, "in")}
      {side(right, RX, "out")}
      <g transform={`translate(${cx - (W + 40) / 2} ${cy - (H + 40) / 2})`}>
        <rect width={W + 40} height={H + 40} fill="#1b1e1f" stroke="#e6e6e3" strokeWidth={1.5} />
        <rect width={5} height={H + 40} fill={COLOR[o.type]} />
        <text x={20} y={28} className="fill-muted font-mono text-[11px] uppercase tracking-wider">
          {objectType(o.type)?.label}
        </text>
        <text x={20} y={56} className="fill-fg text-[18px]">
          {o.title.length > 22 ? `${o.title.slice(0, 21)}…` : o.title}
        </text>
        {o.subtitle && (
          <text x={20} y={80} className="fill-muted text-[12px]">
            {o.subtitle.length > 32 ? `${o.subtitle.slice(0, 31)}…` : o.subtitle}
          </text>
        )}
      </g>
    </svg>
  );
}

function ObjectDetails({ o }: { o: OntObject }) {
  const prov = PROVENANCE[o.provenance];
  const props = Object.entries(o.props).filter(([, v]) => v !== null && v !== "");
  return (
    <div className="p-6">
      <div className="flex items-center gap-2">
        <Swatch type={o.type} />
        <p className="label">{objectType(o.type)?.label}</p>
        <span className={`ml-auto border px-2 py-0.5 text-[11px] ${prov.cls}`}>{prov.label}</span>
      </div>
      <h2 className="mt-3 text-lg leading-snug">{o.title}</h2>
      {o.subtitle && <p className="mt-1 text-sm text-muted">{o.subtitle}</p>}
      {props.length > 0 && (
        <dl className="mt-6 border-t border-line text-sm">
          {props.map(([k, v]) => (
            <div key={k} className="flex gap-4 border-b border-line py-2">
              <dt className="w-24 shrink-0 text-muted">{k}</dt>
              <dd className="min-w-0 break-words">{typeof v === "boolean" ? (v ? "yes" : "no") : String(v)}</dd>
            </div>
          ))}
        </dl>
      )}
      {o.sourceUrl && (
        <a href={o.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 block truncate text-sm text-info hover:underline">
          Source: {o.sourceUrl.replace(/^https?:\/\//, "")}
        </a>
      )}
    </div>
  );
}
