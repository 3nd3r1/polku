/**
 * Resets the demo: `npm run demo:reset` wipes every call and case and reseeds
 * the synthetic register, locally and on production. `npm run demo:reset local`
 * or `npm run demo:reset prod` does one of them.
 *
 * Local goes straight to DATABASE_URL (the Docker Postgres, shared by
 * `npm run dev` and `npm run up`). Production goes through the deployed
 * POST /api/admin/reset and needs ADMIN_TOKEN in .env.local.
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // Rely on the environment.
}

const TARGETS = ["local", "prod"] as const;
type Target = (typeof TARGETS)[number];

async function resetLocal() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing from .env.local");
  // Imported after the env is loaded: the db client reads DATABASE_URL on import.
  const { resetDemo } = await import("./demo");
  const { people, cases } = await resetDemo();
  return `${people.length} people, ${cases} case(s). Reload open pages.`;
}

async function resetProd() {
  const url = process.env.POLKU_URL ?? "https://prod-polku.eros.ender.fi";
  const token = process.env.ADMIN_TOKEN;
  if (!token) throw new Error("ADMIN_TOKEN missing from .env.local");
  const res = await fetch(`${url}/api/admin/reset`, { method: "POST", headers: { authorization: `Bearer ${token}` } });
  const body = await res.text();
  if (!res.ok) throw new Error(`${url} answered ${res.status} ${body}`);
  return `${url} ${body}`;
}

async function main() {
  const arg = process.argv[2];
  if (arg && !TARGETS.includes(arg as Target)) throw new Error(`Unknown target '${arg}'. Use: local, prod, or nothing for both.`);
  const targets: readonly Target[] = arg ? [arg as Target] : TARGETS;

  let failed = false;
  for (const t of targets) {
    try {
      console.log(`${t}: reset. ${await (t === "local" ? resetLocal() : resetProd())}`);
    } catch (e) {
      failed = true;
      console.error(`${t}: FAILED. ${e instanceof Error ? e.message : e}`);
    }
  }
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
