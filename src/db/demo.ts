/**
 * The demo's known SYNTHETIC state: the population register and a set of open
 * cases at different pathway steps. Used by `npm run db:seed` and by the
 * production reset endpoint (POST /api/admin/reset).
 */
import { sql } from "drizzle-orm";
import { evaluate } from "../ontology/engine";
import { holderOf, MAY_OPEN } from "../ontology/record";
import type { Intake } from "../ontology/schema";
import { lung } from "../pathways/lung";
import { ontologyPath, resourceCalendar, resourcesFor } from "../sim/capacity";
import { ageOf, type Person, syntheticPeople } from "../sim/people";
import { db } from "./index";
import { audit, cases, clocks, people, recordAccess } from "./schema";

const DAY_MS = 24 * 60 * 60 * 1000;

const INTAKES: Omit<Intake, "age">[] = [
  { smoking: "former", observations: [{ code: "COUGH_NEW", durationDays: 49, quote: "I've had this cough for about seven weeks" }] },
  { smoking: "current", observations: [{ code: "HAEMOPTYSIS", quote: "there was blood when I coughed" }] },
  { smoking: "former", observations: [{ code: "HAEMOPTYSIS_REPEATED", quote: "I keep coughing up a bit of blood, it's happened several times" }] },
  { smoking: "current", observations: [{ code: "DYSPNOEA_NEW", durationDays: 45, quote: "I get out of breath on the stairs now" }] },
  { smoking: "never", observations: [{ code: "CHEST_PAIN", quote: "a pain in my chest that won't go away" }] },
];

type CaseSeed = {
  person: Person;
  intake: Omit<Intake, "age">;
  stepIndex: number;
  daysIntoStep: number;
  booked?: { inDays: number; at: string; unit: string };
  /** Book the running step in the first free session (other patients' bookings fill the calendars). */
  book?: boolean;
};
/** Which step each generated case is at: mostly new referrals and CT, a few further along. */
const STEPS = [0, 1, 1, 0, 1, 3, 1, 0, 4, 1, 2, 1, 5, 0, 1, 6, 1];

/** The i-th intake in rotation that fast-tracks for this person (age matters for some criteria). */
function fastTrackIntake(person: Person, i: number) {
  for (let k = 0; k < INTAKES.length; k++) {
    const intake = INTAKES[(i + k) % INTAKES.length];
    if (evaluate({ ...intake, age: ageOf(person) }, lung).outcome === "fast_track") return intake;
  }
  throw new Error(`No seed intake fast-tracks for ${person.id}`);
}

/** Deterministic: same cases on every seed. Some prior steps overran, so some promises are already broken. */
function caseSeeds(people: Person[]): CaseSeed[] {
  const liisa = people.find((p) => p.id === "liisa")!;
  const seeds: CaseSeed[] = [
    { person: liisa, intake: INTAKES[0], stepIndex: 1, daysIntoStep: 3, booked: { inDays: 2, at: "10:30", unit: "Lapin keskussairaala" } },
  ];
  people
    .filter((p) => p.id.startsWith("p"))
    .filter((_, i) => i % 3 === 0)
    .forEach((person, i) => {
      const stepIndex = STEPS[i % STEPS.length];
      seeds.push({
        person,
        intake: fastTrackIntake(person, i),
        stepIndex,
        daysIntoStep: stepIndex === 0 ? (i % 4) * 0.3 : (i * 7) % 9,
        book: stepIndex > 1 || i % 3 === 2,
      });
    });
  return seeds;
}

export async function peopleCount() {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(people);
  return n;
}

/** Wipes every call and case and reseeds. Destructive by design: demo data only. */
export async function resetDemo() {
  const register = syntheticPeople();
  const now = Date.now();

  await db.execute(sql`TRUNCATE access_log, record_access, audit, clocks, cases, calls, people RESTART IDENTITY CASCADE`);
  await db.insert(people).values(register);

  const seeds = caseSeeds(register);
  const taken = new Set<string>();
  for (const s of seeds) {
    const intake: Intake = { ...s.intake, age: ageOf(s.person) };
    const evaluation = evaluate(intake, lung);
    if (evaluation.outcome !== "fast_track") throw new Error(`Seed intake for ${s.person.id} does not fast-track`);

    // Walk back from now: the current step started daysIntoStep ago, earlier steps took 0.6x to 1.6x their target.
    const durations = lung.steps.slice(0, s.stepIndex).map((st, j) => st.maxDays * (0.6 + ((j * 37 + s.stepIndex * 11) % 10) / 10) * DAY_MS);
    let t = now - s.daysIntoStep * DAY_MS - durations.reduce((a, b) => a + b, 0);
    const createdAt = new Date(t);

    const [row] = await db
      .insert(cases)
      .values({
        createdAt,
        channel: "phone",
        personId: s.person.id,
        person: s.person,
        county: s.person.county,
        pathwayId: lung.id,
        pathwayVersion: lung.version,
        intake,
        outcome: "fast_track",
        matches: evaluation.matches.map((m) => ({
          criterionId: m.criterion.id,
          observationIndex: intake.observations.indexOf(m.observation),
        })),
        status: s.stepIndex === 0 ? "pending_review" : "active",
        notes: s.stepIndex > 0 ? "Seeded synthetic case." : null,
      })
      .returning({ id: cases.id });
    await db.insert(audit).values({ caseId: row.id, at: createdAt, action: "SubmitIntake", actor: "system", data: { seeded: true } });
    await db.insert(recordAccess).values({ caseId: row.id, at: createdAt, holder: "call", mode: "write", parts: ["identity", "symptoms"], actor: "Polku agent" });

    for (let j = 0; j <= s.stepIndex; j++) {
      const step = lung.steps[j];
      const startedAt = new Date(t);
      const dueAt = new Date(t + step.maxDays * DAY_MS);
      const current = j === s.stepIndex;
      const stoppedAt = current ? null : new Date(t + durations[j]);
      const booked = current && s.booked;
      let scheduledAt: Date | null = null;
      let unit: string | null = null;
      if (booked) {
        scheduledAt = new Date(now + booked.inDays * DAY_MS);
        const [h, m] = booked.at.split(":").map(Number);
        scheduledAt.setHours(h, m, 0, 0);
        unit = booked.unit;
      } else if (current && s.book) {
        const [r] = resourcesFor(s.person.county, step.id);
        const free = r && resourceCalendar(r, new Date(now)).flatMap((d) => d.sessions).find((x) => !x.taken && !taken.has(`${r.id}@${x.at}`));
        if (r && free) {
          taken.add(`${r.id}@${free.at}`);
          scheduledAt = new Date(free.at);
          unit = ontologyPath(r).facility;
        }
      }
      await db.insert(clocks).values({
        caseId: row.id,
        stepId: step.id,
        startedAt,
        dueAt,
        stoppedAt,
        scheduledAt,
        unit,
      });
      // Each finished step opened what it may; a booked step was booked on a callback.
      const holder = holderOf(step.id);
      if (stoppedAt) {
        const openedAt = new Date(startedAt.getTime() + (stoppedAt.getTime() - startedAt.getTime()) * 0.3);
        await db.insert(recordAccess).values({ caseId: row.id, at: openedAt, holder, mode: "read", parts: [...MAY_OPEN[holder]], actor: holder === "nurse" ? "Nurse" : `${step.name} staff` });
      }
      if (scheduledAt) {
        await db.insert(recordAccess).values({ caseId: row.id, at: startedAt, holder: "call", mode: "write", parts: ["booking"], actor: "Polku agent" });
      }
      if (stoppedAt) {
        await db.insert(audit).values({
          caseId: row.id,
          at: stoppedAt,
          action: j === 0 ? "ConfirmCase" : "AdvanceStep",
          actor: "nurse",
          data: { stoppedStep: step.id, startedStep: lung.steps[j + 1]?.id ?? null, seeded: true },
        });
        t += durations[j];
      }
    }
  }

  return { people: register, cases: seeds.length };
}
