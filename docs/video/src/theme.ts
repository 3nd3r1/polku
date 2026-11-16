import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";

const geist = loadGeist("normal", { weights: ["300", "400", "600"], subsets: ["latin", "latin-ext"] });
const mono = loadGeistMono("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });

// Locked palette from docs/design.md
export const C = {
  base: "#0a0b0b",
  panel: "#121414",
  raised: "#1b1e1f",
  line: "#262a2b",
  lineStrong: "#3a3f41",
  fg: "#e6e6e3",
  muted: "#8d9294",
  dim: "#5b6062",
  alert: "#e5484d",
  warn: "#d9a43b",
  ok: "#3fb37f",
  info: "#5b9bd5",
} as const;

export const SANS = geist.fontFamily;
export const MONO = mono.fontFamily;

export const FPS = 30;
export const s = (seconds: number) => Math.round(seconds * FPS);
