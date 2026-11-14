/**
 * Finnish personal identity code (henkilötunnus, hetu): DDMMYY C NNN Q.
 * C is the century sign, NNN the individual number, Q the check character.
 * Real codes use individual numbers 002-899. 900-999 is the test range
 * (Kanta and Vero test data rules), so every synthetic person uses it.
 */

const CHECK_CHARS = "0123456789ABCDEFHJKLMNPRSTUVWXY";
const CENTURY: Record<string, number> = {
  "+": 1800,
  "-": 1900, Y: 1900, X: 1900, W: 1900, V: 1900, U: 1900,
  A: 2000, B: 2000, C: 2000, D: 2000, E: 2000, F: 2000,
};

export type Hetu = { code: string; birthDate: string; testRange: boolean };
export type HetuResult = { ok: true; hetu: Hetu } | { ok: false; reason: string };

export const checkChar = (ddmmyy: string, individual: string) =>
  CHECK_CHARS[Number(ddmmyy + individual) % 31];

/** Parses what the agent heard. Tolerates spaces and dash variants, nothing else. */
export function parseHetu(raw: string): HetuResult {
  const code = raw.toUpperCase().replace(/\s+/g, "").replace(/[‐‑‒–—−]/g, "-");
  const m = /^(\d{2})(\d{2})(\d{2})([-+A-FU-Y])(\d{3})([0-9A-Y])$/.exec(code);
  if (!m) return { ok: false, reason: "wrong format" };
  const [, dd, mm, yy, sign, individual, check] = m;
  const year = CENTURY[sign] + Number(yy);
  const date = new Date(Date.UTC(year, Number(mm) - 1, Number(dd)));
  if (date.getUTCMonth() !== Number(mm) - 1 || date.getUTCDate() !== Number(dd)) {
    return { ok: false, reason: "no such date" };
  }
  if (checkChar(dd + mm + yy, individual) !== check) return { ok: false, reason: "check character does not match" };
  return {
    ok: true,
    hetu: { code, birthDate: date.toISOString().slice(0, 10), testRange: Number(individual) >= 900 },
  };
}

/** Builds a valid code. Used only by the synthetic population. */
export function makeHetu(birthDate: string, individual: number): string {
  const [y, m, d] = birthDate.split("-");
  const yy = y.slice(2);
  const sign = Number(y) >= 2000 ? "A" : "-";
  const nnn = String(individual).padStart(3, "0");
  return `${d}${m}${yy}${sign}${nnn}${checkChar(d + m + yy, nnn)}`;
}

/** What staff screens show: birth date part only. */
export const maskHetu = (code: string) => `${code.slice(0, 7)}****`;
