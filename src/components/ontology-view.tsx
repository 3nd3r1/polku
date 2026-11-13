"use client";

import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationNodeDatum } from "d3-force";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LINK_TYPES, OBJECT_TYPES, type OntGraph, type OntObject } from "@/ontology/meta";

const COLOR: Record<string, string> = {
  County: "#5b9bd5",
  Facility: "#7fb3e8",
  Capability: "#9b8cd9",
  Resource: "#b4a7f0",
  Pathway: "#e6e6e3",
  Step: "#d9a43b",
  Criterion: "#e8c872",
  Source: "#8d9294",
  Symptom: "#5b6062",
  Person: "#3fb37f",
  Case: "#e07a5f",
  Clock: "#f0a989",
};
const SIZE: Record<string, number> = { County: 14, Pathway: 16, Facility: 11, Case: 12, Step: 10, Person: 10 };
const LAYER_X = { care: -420, pathway: 0, case: 420 } as const;
const LAYER_LABEL = { care: "Care network", pathway: "Pathway definition", case: "Live cases" } as const;
const ALWAYS_LABEL = new Set(["County", "Facility", "Pathway", "Step", "Case", "Person", "Capability"]);
const PROVENANCE: Record<OntObject["provenance"], { label: string; cls: string }> = {
  real: { label: "Real · public", cls: "border-info text-info" },
  synthetic: { label: "Synthetic", cls: "border-warn text-warn" },
  design: { label: "Polku design", cls: "border-line-strong text-muted" },
};

type Node = SimulationNodeDatum & { key: string; type: string; title: string; size: number };
type Edge = { source: string; target: string; label: string };
type Layout = { nodes: Node[]; edges: Edge[]; box: { x: number; y: number; w: number; h: number } };
type View = { x: number; y: number; k: number };

const layerOf = (type: string) => OBJECT_TYPES.find((t) => t.id === type)?.layer ?? "pathway";

function layout(nodes: Node[], edges: Edge[], spread: number): Layout {
  const sim = forceSimulation(nodes)
    .force("link", forceLink<Node, { source: string; target: string }>(edges.map((e) => ({ ...e }))).id((n) => n.key).distance(46).strength(0.6))
    .force("charge", forceManyBody().strength(-110))
    .force("collide", forceCollide<Node>((n) => n.size + 6))
    .force("x", forceX<Node>((n) => LAYER_X[layerOf(n.type)] * spread).strength(0.3))
    .force("y", forceY(0).strength(0.05))
    .stop();
  for (let i = 0; i < 320; i++) sim.tick();
  const xs = nodes.map((n) => n.x ?? 0);
  const ys = nodes.map((n) => n.y ?? 0);
  return { nodes, edges, box: fit(xs, ys) };
}

/** Bounding box with padding and a minimum size, so small graphs are not blown up. */
function fit(xs: number[], ys: number[]) {
  const pad = 80;
  const [x0, x1] = [Math.min(...xs) - pad, Math.max(...xs) + pad * 2];
  const [y0, y1] = [Math.min(...ys) - pad, Math.max(...ys) + pad];
  const w = Math.max(x1 - x0, 1100);
  const h = Math.max(y1 - y0, 640);
  return { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h };
}

/** Curve control point: edges between non-adjacent nodes in one column bow out instead of crossing nodes. */
function control(a: Node, b: Node) {
  const mx = (a.x! + b.x!) / 2;
  const my = (a.y! + b.y!) / 2;
  const dy = Math.abs(a.y! - b.y!);
  if (Math.abs(a.x! - b.x!) < 1 && dy > 130) return { x: mx + dy * 0.35, y: my };
  return { x: mx, y: my };
}

/** Schema: fixed columns per layer, ordered to keep crossings low. */
const SCHEMA_ORDER = {
  care: ["County", "Facility", "Resource", "Capability"],
  pathway: ["Source", "Criterion", "Symptom", "Pathway", "Step"],
  case: ["Person", "Case", "Clock"],
} as const;

function schemaLayout(counts: Record<string, number>): Layout {
  const nodes: Node[] = (Object.keys(SCHEMA_ORDER) as (keyof typeof SCHEMA_ORDER)[]).flatMap((layer) =>
    SCHEMA_ORDER[layer].map((id, i, all) => ({
      key: id,
      type: id,
      title: `${OBJECT_TYPES.find((t) => t.id === id)!.plural} · ${counts[id] ?? 0}`,
      size: 18,
      x: LAYER_X[layer],
      y: (i - (all.length - 1) / 2) * 120,
    })),
  );
  const edges: Edge[] = LINK_TYPES.filter((l) => l.from !== l.to).map((l) => ({ source: l.from, target: l.to, label: l.label }));
  return { nodes, edges, box: fit(nodes.map((n) => n.x!), nodes.map((n) => n.y!)) };
}

export function OntologyView() {
  const [graph, setGraph] = useState<OntGraph | null>(null);
  const [mode, setMode] = useState<"objects" | "schema">("objects");
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(["Symptom"]));
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/ontology", { cache: "no-store" });
    if (res.ok) setGraph(await res.json());
  }, []);

  useEffect(() => {
    const events = new EventSource("/api/events");
    events.onmessage = () => refresh();
    return () => events.close();
  }, [refresh]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const o of graph?.objects ?? []) m[o.type] = (m[o.type] ?? 0) + 1;
    return m;
  }, [graph]);

  const byKey = useMemo(() => new Map((graph?.objects ?? []).map((o) => [o.key, o])), [graph]);

  const result = useMemo<Layout | null>(() => {
    if (!graph) return null;
    if (mode === "schema") {
      return schemaLayout(counts);
    }
    const nodes: Node[] = graph.objects
      .filter((o) => !hidden.has(o.type))
      .map((o) => ({ key: o.key, type: o.type, title: o.title, size: SIZE[o.type] ?? 7 }));
    const keep = new Set(nodes.map((n) => n.key));
    const label = new Map<string, string>(LINK_TYPES.map((l) => [l.id, l.label]));
    const edges: Edge[] = graph.links
      .filter((l) => keep.has(l.from) && keep.has(l.to))
      .map((l) => ({ source: l.from, target: l.to, label: label.get(l.type) ?? l.type }));
    return layout(nodes, edges, 1);
  }, [graph, mode, hidden, counts]);

  const pos = useMemo(() => new Map((result?.nodes ?? []).map((n) => [n.key, n])), [result]);

  const focus = hover ?? selected;
  const neighbours = useMemo(() => {
    const s = new Set<string>();
    if (!focus || !result) return s;
    s.add(focus);
    for (const e of result.edges) {
      if (e.source === focus) s.add(e.target);
      if (e.target === focus) s.add(e.source);
    }
    return s;
  }, [focus, result]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !graph) return [];
    return graph.objects.filter((o) => `${o.title} ${o.subtitle ?? ""} ${o.type}`.toLowerCase().includes(q)).slice(0, 8);
  }, [query, graph]);

  const switchMode = (m: typeof mode) => {
    setMode(m);
    setSelected(null);
    setView({ x: 0, y: 0, k: 1 });
  };

  const toggle = (type: string) =>
    setHidden((h) => {
      const next = new Set(h);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });

  const onWheel = (e: React.WheelEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const k = Math.min(6, Math.max(0.3, view.k * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
    setView({ k, x: px - ((px - view.x) * k) / view.k, y: py - ((py - view.y) * k) / view.k });
  };

  const box = result?.box;
  const selObj = mode === "objects" && selected ? byKey.get(selected) : null;
  const selType = mode === "schema" && selected ? OBJECT_TYPES.find((t) => t.id === selected) : null;

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-r border-line">
        <div className="flex border-b border-line">
          {(["objects", "schema"] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`h-10 flex-1 text-sm ${mode === m ? "bg-raised text-fg" : "text-muted hover:text-fg"}`}
            >
              {m === "objects" ? "Objects" : "Schema"}
            </button>
          ))}
        </div>
        <div className="relative border-b border-line p-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search objects"
            className="h-9 w-full border border-line bg-base px-3 text-sm outline-none placeholder:text-dim focus:border-line-strong"
          />
          {matches.length > 0 && (
            <ul className="absolute inset-x-3 top-12 z-10 border border-line-strong bg-panel">
              {matches.map((o) => (
                <li key={o.key}>
                  <button
                    onClick={() => {
                      if (mode !== "objects") switchMode("objects");
                      setHidden((h) => {
                        const next = new Set(h);
                        next.delete(o.type);
                        return next;
                      });
                      setSelected(o.key);
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-raised"
                  >
                    <span className="h-2 w-2 shrink-0" style={{ background: COLOR[o.type] }} />
                    <span className="truncate">{o.title}</span>
                    <span className="ml-auto text-xs text-dim">{o.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {(["care", "pathway", "case"] as const).map((layer) => (
          <div key={layer} className="border-b border-line py-2">
            <p className="label px-4 py-1.5">{LAYER_LABEL[layer]}</p>
            {OBJECT_TYPES.filter((t) => t.layer === layer).map((t) => {
              const off = mode === "objects" && hidden.has(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => (mode === "objects" ? toggle(t.id) : setSelected(t.id))}
                  title={t.description}
                  className={`flex w-full items-center gap-3 px-4 py-1.5 text-left text-sm hover:bg-raised ${off ? "text-dim" : ""}`}
                >
                  <span className="h-2.5 w-2.5 shrink-0" style={{ background: off ? "transparent" : COLOR[t.id], border: `1px solid ${COLOR[t.id]}` }} />
                  {t.plural}
                  <span className="ml-auto font-mono text-xs text-muted">{counts[t.id] ?? 0}</span>
                </button>
              );
            })}
          </div>
        ))}
        <p className="mt-auto p-4 text-xs leading-relaxed text-dim">
          {mode === "objects" ? "Click a type to show or hide it. Scroll to zoom, drag to pan." : `${OBJECT_TYPES.length} object types, ${LINK_TYPES.length} link types.`}
        </p>
      </aside>

      <div className="relative min-w-0 flex-1 bg-base">
        {box && result && (
          <svg
            ref={svgRef}
            className="h-full w-full cursor-grab select-none active:cursor-grabbing"
            onWheel={onWheel}
            onMouseDown={(e) => (drag.current = { x: e.clientX - view.x, y: e.clientY - view.y })}
            onMouseMove={(e) => drag.current && setView({ ...view, x: e.clientX - drag.current.x, y: e.clientY - drag.current.y })}
            onMouseUp={() => (drag.current = null)}
            onMouseLeave={() => (drag.current = null)}
            onClick={(e) => e.target === e.currentTarget && setSelected(null)}
          >
            <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
              <svg viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} overflow="visible" preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
                {(Object.keys(LAYER_X) as (keyof typeof LAYER_X)[]).map((l) => (
                    <text key={l} x={LAYER_X[l]} y={box.y + 30} textAnchor="middle" className="fill-dim font-mono text-[13px] uppercase tracking-widest">
                      {LAYER_LABEL[l]}
                    </text>
                  ))}
                {result.edges.map((e, i) => {
                  const a = pos.get(e.source);
                  const b = pos.get(e.target);
                  if (!a || !b) return null;
                  const lit = focus !== null && (e.source === focus || e.target === focus);
                  const showLabel = mode === "schema" || lit;
                  const c = control(a, b);
                  return (
                    <g key={i}>
                      <path
                        d={`M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`}
                        fill="none"
                        stroke={lit ? "#e6e6e3" : "#3a3f41"}
                        strokeOpacity={focus && !lit ? 0.25 : 0.9}
                        strokeWidth={lit ? 1.4 : 0.8}
                      />
                      {showLabel && (
                        <text x={(a.x! + 2 * c.x + b.x!) / 4} y={(a.y! + 2 * c.y + b.y!) / 4 - 4} textAnchor="middle" className="fill-muted text-[10px]">
                          {e.label}
                        </text>
                      )}
                    </g>
                  );
                })}
                {result.nodes.map((n) => {
                  const dimmed = focus !== null && !neighbours.has(n.key);
                  const isSel = selected === n.key;
                  const showLabel = mode === "schema" || ALWAYS_LABEL.has(n.type) || neighbours.has(n.key);
                  return (
                    <g
                      key={n.key}
                      transform={`translate(${n.x} ${n.y})`}
                      opacity={dimmed ? 0.2 : 1}
                      className="cursor-pointer"
                      onMouseEnter={() => setHover(n.key)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => setSelected(n.key)}
                    >
                      <rect
                        x={-n.size / 2}
                        y={-n.size / 2}
                        width={n.size}
                        height={n.size}
                        fill={COLOR[n.type]}
                        stroke={isSel ? "#ffffff" : "#0a0b0b"}
                        strokeWidth={isSel ? 2 : 1}
                      />
                      {showLabel && (
                        <text x={n.size / 2 + 5} y={4} className="fill-fg text-[11px]" style={{ paintOrder: "stroke", stroke: "#0a0b0b", strokeWidth: 3 }}>
                          {n.title.length > 34 ? `${n.title.slice(0, 33)}…` : n.title}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </g>
          </svg>
        )}
        {!graph && <p className="p-6 text-sm text-muted">Loading ontology…</p>}
        <div className="pointer-events-none absolute bottom-4 left-4 flex gap-4 text-xs text-muted">
          <span>{graph?.objects.length ?? 0} objects</span>
          <span>{graph?.links.length ?? 0} links</span>
        </div>
      </div>

      {(selObj || selType) && (
        <aside className="w-96 shrink-0 overflow-y-auto border-l border-line bg-panel">
          {selObj && <ObjectPanel o={selObj} graph={graph!} byKey={byKey} onSelect={setSelected} />}
          {selType && (
            <div className="p-6">
              <p className="label">Object type</p>
              <h2 className="mt-2 text-lg">{selType.label}</h2>
              <p className="mt-2 text-sm text-muted">{selType.description}</p>
              <p className="label mt-6">Links</p>
              <ul className="mt-2 border-t border-line text-sm">
                {LINK_TYPES.filter((l) => l.from === selType.id || l.to === selType.id).map((l) => (
                  <li key={l.id} className="border-b border-line py-2">
                    {l.from} <span className="text-muted">{l.label}</span> {l.to}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted">{counts[selType.id] ?? 0} objects</p>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}

function ObjectPanel({
  o,
  graph,
  byKey,
  onSelect,
}: {
  o: OntObject;
  graph: OntGraph;
  byKey: Map<string, OntObject>;
  onSelect: (key: string) => void;
}) {
  const label = new Map<string, string>(LINK_TYPES.map((l) => [l.id, l.label]));
  const out = graph.links.filter((l) => l.from === o.key);
  const inc = graph.links.filter((l) => l.to === o.key);
  const prov = PROVENANCE[o.provenance];
  const props = Object.entries(o.props).filter(([, v]) => v !== null && v !== "");

  const row = (type: string, other: string, dir: "out" | "in") => {
    const t = byKey.get(other);
    if (!t) return null;
    return (
      <li key={`${dir}-${type}-${other}`} className="border-b border-line">
        <button onClick={() => onSelect(other)} className="flex w-full items-center gap-2 py-2 text-left text-sm hover:bg-raised">
          <span className="w-24 shrink-0 text-muted">{dir === "out" ? label.get(type) : `← ${label.get(type)}`}</span>
          <span className="h-2 w-2 shrink-0" style={{ background: COLOR[t.type] }} />
          <span className="truncate">{t.title}</span>
          <span className="ml-auto shrink-0 text-xs text-dim">{t.type}</span>
        </button>
      </li>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5" style={{ background: COLOR[o.type] }} />
        <p className="label">{o.type}</p>
        <span className={`ml-auto border px-2 py-0.5 text-[11px] ${prov.cls}`}>{prov.label}</span>
      </div>
      <h2 className="mt-3 text-lg leading-snug">{o.title}</h2>
      {o.subtitle && <p className="mt-1 text-sm text-muted">{o.subtitle}</p>}

      {props.length > 0 && (
        <dl className="mt-6 border-t border-line text-sm">
          {props.map(([k, v]) => (
            <div key={k} className="flex gap-4 border-b border-line py-2">
              <dt className="w-24 shrink-0 text-muted">{k}</dt>
              <dd className="min-w-0 break-words">{String(v)}</dd>
            </div>
          ))}
        </dl>
      )}
      {o.sourceUrl && (
        <a href={o.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 block truncate text-sm text-info hover:underline">
          Source: {o.sourceUrl.replace(/^https?:\/\//, "")}
        </a>
      )}

      <p className="label mt-8">Links · {out.length + inc.length}</p>
      <ul className="mt-2 border-t border-line">
        {out.map((l) => row(l.type, l.to, "out"))}
        {inc.map((l) => row(l.type, l.from, "in"))}
      </ul>
    </div>
  );
}
