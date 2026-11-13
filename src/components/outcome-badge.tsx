import type { Outcome } from "@/ontology/engine";

const STYLE: Record<Outcome, { label: string; className: string }> = {
  call_112: { label: "Call 112", className: "bg-red-600 text-white" },
  fast_track: { label: "Fast track", className: "bg-amber-100 text-amber-900" },
  see_gp: { label: "See GP", className: "bg-sky-100 text-sky-900" },
  no_match: { label: "No match", className: "bg-zinc-100 text-zinc-700" },
};

export function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  const s = STYLE[outcome];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.className}`}>{s.label}</span>;
}
