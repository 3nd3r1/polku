/**
 * The public demo deployment: a second site with its own database where anyone
 * can click around. Scripted calls only, no voice, and a reset anyone can press.
 * Set at build time (NEXT_PUBLIC_DEMO_SITE=1), so client and server agree.
 */
export const DEMO_SITE = ["1", "true"].includes(process.env.NEXT_PUBLIC_DEMO_SITE ?? "");
