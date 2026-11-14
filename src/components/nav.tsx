"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePhone } from "./agent-call";

const TABS = [
  { href: "/", label: "Calls" },
  { href: "/nurse", label: "Tasks" },
  { href: "/handoffs", label: "Handoffs" },
];

export function Nav() {
  const path = usePathname();
  const phone = usePhone();
  const tab = (href: string, label: string, extra = "") => (
    <Link
      key={href}
      href={href}
      className={`flex h-full items-center border-b-2 px-4 text-sm ${
        path === href ? "border-fg text-fg" : "border-transparent text-muted hover:text-fg"
      } ${extra}`}
    >
      {label}
    </Link>
  );
  return (
    <nav className="flex h-12 shrink-0 items-center gap-8 border-b border-line bg-panel px-6">
      <span className="flex items-center gap-2.5 text-sm font-semibold tracking-[0.2em]">
        <span className="block h-3 w-3 bg-fg" aria-hidden />
        POLKU
      </span>
      <div className="flex h-full">{TABS.map((t) => tab(t.href, t.label))}</div>
      <div className="ml-auto flex h-full items-center gap-6">
        {phone.live && (
          <span className="flex items-center gap-3 text-sm">
            <span className="h-2.5 w-2.5 animate-pulse bg-warn" aria-hidden />
            Browser call live
            <button onClick={phone.end} className="text-alert hover:underline">
              Hang up
            </button>
          </span>
        )}
        {tab("/demo", "Demo", "font-mono text-xs uppercase tracking-[0.08em]")}
      </div>
    </nav>
  );
}
