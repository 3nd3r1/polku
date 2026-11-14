/**
 * The demo's known SYNTHETIC state: the population register and a set of open
 * cases at different pathway steps. Used by `npm run db:seed` and by the
 * production reset endpoint (POST /api/admin/reset).
 */
import { sql } from "drizzle-orm";
import { evaluate } from "../ontology/engine";
import type { Intake } from "../ontology/schema";
import { STAFF_ONLY_STEPS } from "../ontology/labels";
import { lung } from "../pathways/lung";
import { recommendSlot } from "../sim/capacity";
import { ageOf, type Person, syntheticPeople } from "../sim/people";
import { db } from "./index";
import { audit, cases, clocks, people } from "./schema";

const DAY_MS = 24 * 60 * 60 * 1000;

const INTAKES: Omit<Intake, "age">[] = [
  { smoking: "former", observations: [{ code: "COUGH_NEW", durationDays: 49, quote: "I've had this cough for about seven weeks" }] },
  { smoking: "current", observations: [{ code: "HAEMOPTYSIS", quote: "there was blood when I coughed" }] },
  { smoking: "current", observations: [{ code: "DYSPNOEA_NEW", durationDays: 45, quote: "I get out of breath on the stairs now" }] },
  { smoking: "never", observations: [{ code: "CHEST_PAIN", quote: "a pain in my chest that won't go away" }] },
];

/** Where the running step stands: booked by staff, SMS offered recently, or SMS offered over 24 h ago with no reply. */
type Plan = "booked" | "offered" | "no_reply";
type CaseSeed = {
  person: Person;
  intake: Omit<Intake, "age">;
  stepIndex: number;
  daysIntoStep: number;
  booked?: { inDays: number; at: string; unit: string };
  plan?: Plan;
};
const PLANS: (Plan | undefined)[] = ["booked", "offered", "no_reply", undefined, "booked", "offered", undefined, "booked"];

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
      seeds.push({
        person,
        intake: INTAKES[i % INTAKES.length],
        stepIndex: i % (lung.steps.length - 1),
        daysIntoStep: (i * 7) % 9,
        plan: PLANS[i % PLANS.length],
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

  await db.execute(sql`TRUNCATE access_log, audit, clocks, cases, calls, people RESTART IDENTITY CASCADE`);
  await db.insert(people).values(register);

  const seeds = caseSeeds(register);
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

    for (let j = 0; j <= s.stepIndex; j++) {
      const step = lung.steps[j];
      const startedAt = new Date(t);
      const dueAt = new Date(t + step.maxDays * DAY_MS);
      const current = j === s.stepIndex;
      const stoppedAt = current ? null : new Date(t + durations[j]);
      const booked = current && s.booked;
      let scheduledAt: Date | null = null;
      let unit: string | null = null;
      let offeredAt: Date | null = null;
      let offeredSlot: { at: string; unit: string } | null = null;
      if (booked) {
        scheduledAt = new Date(now + booked.inDays * DAY_MS);
        const [h, m] = booked.at.split(":").map(Number);
        scheduledAt.setHours(h, m, 0, 0);
        unit = booked.unit;
      } else if (current && j > 0 && s.plan) {
        const slot = recommendSlot(s.person.county, step.id, dueAt, new Date(now));
        if (slot && s.plan === "booked") {
          scheduledAt = new Date(slot.at);
          unit = slot.unit;
        } else if (slot && !STAFF_ONLY_STEPS.includes(step.id)) {
          // Staff-only steps are booked by staff, never offered to the patient.
          offeredAt = new Date(now - (s.plan === "offered" ? 6 : 30) * 60 * 60 * 1000);
          offeredSlot = { at: slot.at, unit: slot.unit };
        }
      }
      await db.insert(clocks).values({
        caseId: row.id,
        stepId: step.id,
        startedAt,
        dueAt,
        stoppedAt,
        offeredAt,
        offeredSlot,
        scheduledAt,
        unit,
      });
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
