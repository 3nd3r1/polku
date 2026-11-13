import { CallPanel } from "@/components/call-panel";
import { NurseConsole } from "@/components/nurse-console";
import { lung } from "@/pathways/lung";

const STATS = [
  { label: "Pathway", value: `Lung v${lung.version}` },
  { label: "Criteria", value: String(lung.criteria.length) },
  { label: "Timed steps", value: String(lung.steps.length) },
  { label: "Sources", value: lung.sources.filter((s) => s.verification !== "design_choice").map((s) => s.id.slice(0, 2)).join(" · ") },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <nav className="border-b border-line bg-panel">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="block h-4 w-4 bg-fg" aria-hidden />
            <span className="text-[15px] font-semibold tracking-[0.2em]">POLKU</span>
          </div>
          <span className="label hidden sm:block">Synthetic data · Prototype · Not a medical device</span>
        </div>
      </nav>

      <header className="border-b border-line">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[3fr_2fr] lg:items-end">
          <div>
            <p className="label">Sovereign ontology for Finnish cancer care</p>
            <h1 className="mt-4 max-w-2xl text-5xl leading-[1.05] font-light tracking-tight md:text-6xl">
              Every cancer pathway, on the clock.
            </h1>
            <p className="mt-6 max-w-xl text-muted">
              Call in, describe your symptoms. A deterministic engine matches them against published Nordic lung
              cancer criteria, a nurse confirms, and every pathway step runs against its target time.
            </p>
          </div>
          <dl className="grid grid-cols-2 border-t border-l border-line">
            {STATS.map((s) => (
              <div key={s.label} className="border-r border-b border-line p-4">
                <dt className="label">{s.label}</dt>
                <dd className="mt-2 font-mono text-xl">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <CallPanel />
        <NurseConsole />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap justify-between gap-2 px-6 py-4">
          <span className="label">Junction 2026 · AstraZeneca: Equal Care Across Finland</span>
          <span className="label text-alert">In an emergency call 112</span>
        </div>
      </footer>
    </div>
  );
}
