/**
 * Resets the local demo database: `npm run db:seed`. With --if-empty (used on
 * production boot) it only seeds a database that has no people yet.
 */
import { ageOf } from "../sim/people";

async function main() {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // No .env.local: rely on the environment.
  }
  // Imported after the env is loaded: the db client reads DATABASE_URL on import.
  const { peopleCount, resetDemo } = await import("./demo");

  if (process.argv.includes("--if-empty")) {
    const n = await peopleCount();
    if (n > 0) {
      console.log(`Register already has ${n} people. Not seeding.`);
      process.exit(0);
    }
  }

  const { people, cases } = await resetDemo();
  console.log(`Seeded ${people.length} synthetic people and ${cases} open cases.`);
  for (const p of people.filter((x) => !x.id.startsWith("p"))) {
    console.log(`  ${p.name.padEnd(16)} ${p.hetu}  ${ageOf(p)} y  ${p.county}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
