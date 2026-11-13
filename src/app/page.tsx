import { CallPanel } from "@/components/call-panel";
import { NurseConsole } from "@/components/nurse-console";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Polku</h1>
        <p className="text-zinc-600">Every cancer pathway, on the clock.</p>
        <p className="mt-2 rounded-lg bg-zinc-100 px-3 py-2 text-xs text-zinc-600">
          Prototype for Junction 2026. Synthetic data only, not a medical device. In an emergency, call 112.
        </p>
      </header>
      <main className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <CallPanel />
        <NurseConsole />
      </main>
    </div>
  );
}
