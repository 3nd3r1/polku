import type { Outcome } from "@/ontology/engine";

const STYLE: Record<Outcome, { label: string; className: string }> = {
  call_112: { label: "Call 112", className: "bg-alert text-black border-alert" },
  fast_track: { label: "Fast track", className: "text-warn border-warn" },
  see_gp: { label: "See GP", className: "text-info border-info" },
  no_match: { label: "No match", className: "text-muted border-line-strong" },
};

export function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  const s = STYLE[outcome];
  return (
    <span className={`border px-2 py-0.5 font-mono text-[11px] font-medium tracking-[0.08em] uppercase ${s.className}`}>
      {s.label}
    </span>
  );
}
