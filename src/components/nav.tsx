"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Screening" },
  { href: "/nurse", label: "Nurse" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="flex h-12 shrink-0 items-center gap-8 border-b border-line bg-panel px-6">
      <span className="flex items-center gap-2.5 text-sm font-semibold tracking-[0.2em]">
        <span className="block h-3 w-3 bg-fg" aria-hidden />
        POLKU
      </span>
      <div className="flex h-full">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`flex h-full items-center border-b-2 px-4 text-sm ${
              path === t.href ? "border-fg text-fg" : "border-transparent text-muted hover:text-fg"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
