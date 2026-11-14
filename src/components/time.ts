import { useSyncExternalStore } from "react";
import { shortDayTime } from "@/ontology/labels";

const subscribeSeconds = (tick: () => void) => {
  const t = setInterval(tick, 1000);
  return () => clearInterval(t);
};

/** Current time, rounded to the second. Null during server render. */
export function useNow() {
  return useSyncExternalStore(
    subscribeSeconds,
    () => Math.floor(Date.now() / 1000) * 1000,
    () => null,
  );
}

/** "1d 23:59:12" */
export function formatSpan(ms: number) {
  const s = Math.floor(Math.abs(ms) / 1000);
  const d = Math.floor(s / 86400);
  const hms = [Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
  return `${d}d ${hms}`;
}

/** "2d 4h", "5h 12m", "12m" */
export function shortSpan(ms: number) {
  const m = Math.floor(Math.abs(ms) / 60000);
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m % 60}m`;
}

export const clockTime = (iso: string, seconds = false) =>
  new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/Helsinki",
    ...(seconds && { second: "2-digit" }),
  });

/** "Mon 16.11 14:04" */
export const when = (iso: string) => shortDayTime(new Date(iso));

/** "Mon 16.11" */
export const day = (iso: string) => when(iso).slice(0, -6);
