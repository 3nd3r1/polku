import { useSyncExternalStore } from "react";

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

export const clockTime = (iso: string, seconds = false) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", ...(seconds && { second: "2-digit" }) });

export const dayAndTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" });
