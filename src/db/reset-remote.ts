/**
 * Resets the deployed demo: `npm run demo:reset`. Wipes every call and case on
 * production and reseeds the synthetic register. Needs ADMIN_TOKEN in .env.local.
 */
export {};

try {
  process.loadEnvFile(".env.local");
} catch {
  // Rely on the environment.
}
const url = process.env.POLKU_URL ?? "https://polku.eros.ender.fi";
const token = process.env.ADMIN_TOKEN;
if (!token) throw new Error("ADMIN_TOKEN missing from .env.local");

const res = await fetch(`${url}/api/admin/reset`, { method: "POST", headers: { authorization: `Bearer ${token}` } });
console.log(res.status, await res.text());
if (!res.ok) process.exit(1);
