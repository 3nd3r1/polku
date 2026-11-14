import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../db";
import { accessLog, calls, cases, people } from "../db/schema";
import { makeHetu } from "../ontology/hetu";
import type { Intake } from "../ontology/schema";
import type { Person } from "../sim/people";
import { startCall } from "./calls";
import { getCase, identify, submitIntake } from "./cases";
import { MAX_FAILED_VERIFICATIONS, verifyIdentity } from "./identity";

/**
 * The guarantee: before strong identification the agent gets nothing about
 * anyone, and after it only the identified caller's own data. Runs against
 * the local database with its own test people; demo data is not touched.
 */

const A: Person = { id: "test-a", hetu: makeHetu("1950-05-05", 997), name: "Testi Alfa", birthDate: "1950-05-05", county: "Lappi", phone: "+358 40 *** 0001" };
const B: Person = { id: "test-b", hetu: makeHetu("1960-06-06", 998), name: "Testi Beeta", birthDate: "1960-06-06", county: "Pirkanmaa", phone: "+358 40 *** 0002" };
const MATCH: Intake = { smoking: "former", observations: [{ code: "COUGH_NEW", durationDays: 49, quote: "coughing for seven weeks" }] };
const callIds: string[] = [];

async function newCall() {
  const id = await startCall();
  callIds.push(id);
  return id;
}
const log = (callId: string) => db.select().from(accessLog).where(eq(accessLog.callId, callId)).orderBy(accessLog.id);
const cleanUp = async () => {
  await db.delete(cases).where(inArray(cases.personId, [A.id, B.id]));
  if (callIds.length) await db.delete(calls).where(inArray(calls.id, callIds));
  await db.delete(people).where(inArray(people.id, [A.id, B.id]));
};

describe.skipIf(!process.env.DATABASE_URL)("access gate", () => {
  beforeAll(async () => {
    await cleanUp();
    await db.insert(people).values([A, B]);
  });
  afterAll(cleanUp);

  it("refuses get_case and record_intake before identification, and logs it", async () => {
    const call = await newCall();
    await expect(getCase(call)).rejects.toMatchObject({ status: 403 });
    await expect(submitIntake(MATCH, "sample", call)).rejects.toMatchObject({ status: 403 });
    const entries = await log(call);
    expect(entries.map((e) => [e.tool, e.allowed])).toEqual([
      ["get_case", false],
      ["record_intake", false],
    ]);
    const [row] = await db.select().from(calls).where(eq(calls.id, call));
    expect(row.personId).toBeNull();
  });

  it("asks for a missing detail twice at most, then records with the gap left for the nurse", async () => {
    const call = await newCall();
    await identify(call, A.hetu);
    const vague: Intake = { smoking: "current", observations: [{ code: "CHEST_PAIN", quote: "it's really hurting" }] };
    await expect(submitIntake(vague, "sample", call)).rejects.toMatchObject({ status: 422 });
    await expect(submitIntake(vague, "sample", call)).rejects.toMatchObject({ status: 422 });
    await expect(submitIntake(vague, "sample", call)).resolves.toHaveProperty("sayThis");
    const [row] = await db.select().from(calls).where(eq(calls.id, call));
    expect(row.outcome).not.toBeNull();
    expect(row.draft?.gaps.length).toBeGreaterThan(0);
    await db.delete(cases).where(eq(cases.personId, A.id));
  });

  it("refuses invalid and unknown codes, then locks the call", async () => {
    const call = await newCall();
    await expect(verifyIdentity(call, "Testi Alfa")).rejects.toMatchObject({ status: 422 });
    await expect(verifyIdentity(call, "131052-308T")).rejects.toMatchObject({ status: 422 }); // valid, not in register
    await expect(verifyIdentity(call, "050550-997X")).rejects.toMatchObject({ status: 422 });
    expect(MAX_FAILED_VERIFICATIONS).toBe(3);
    // Locked: even the right code no longer works on this call.
    await expect(verifyIdentity(call, A.hetu)).rejects.toMatchObject({ status: 429 });
    await expect(getCase(call)).rejects.toMatchObject({ status: 403 });
  });

  it("identifies once, and never hands the agent the identity code or full name", async () => {
    const call = await newCall();
    const r = await verifyIdentity(call, ` ${A.hetu.toLowerCase()} `);
    expect(r.sayThis).toContain("Testi,");
    expect(r.sayThis).not.toContain(A.hetu);
    expect(r.sayThis).not.toContain("Alfa");
    await expect(verifyIdentity(call, B.hetu)).rejects.toMatchObject({ status: 409 });
  });

  it("identification returns the caller's own case in the same reply, and logs both steps", async () => {
    const call = await newCall();
    const r = await identify(call, B.hetu);
    expect(r.sayThis).toContain("Testi,");
    expect(r.sayThis).toContain("The caller has no open case.");
    expect(r.sayThis).not.toContain(B.hetu);
    expect((await log(call)).map((x) => [x.tool, x.allowed])).toEqual([
      ["verify_identity", true],
      ["get_case", true],
    ]);
    // A failed identification returns nothing about any case.
    const bad = await newCall();
    await expect(identify(bad, "131052-308T")).rejects.toMatchObject({ status: 422 });
    expect((await log(bad)).map((x) => x.tool)).toEqual(["verify_identity"]);
  });

  it("gives each caller only their own case", async () => {
    // A calls with symptoms: a new case for A.
    const first = await newCall();
    await verifyIdentity(first, A.hetu);
    expect((await getCase(first)).summary).toBeNull();
    const opened = await submitIntake(MATCH, "sample", first);
    expect(opened.outcome).toBe("fast_track");
    await expect(submitIntake(MATCH, "sample", first)).rejects.toMatchObject({ status: 409 });

    // B calls: B has no case, and cannot reach A's.
    const other = await newCall();
    await verifyIdentity(other, B.hetu);
    expect((await getCase(other)).summary).toBeNull();

    // A calls again: hears their own status, new symptoms go onto the same case.
    const again = await newCall();
    await verifyIdentity(again, A.hetu);
    expect((await getCase(again)).summary).toMatch(/^Your next step is a call from a nurse\. It is promised by /);
    const update = await submitIntake(
      { smoking: "former", observations: [{ code: "HAEMOPTYSIS_MASSIVE", quote: "a lot of blood now" }] },
      "sample",
      again,
    );
    expect(update.caseId).toBe(opened.caseId);
    expect(update.outcome).toBe("call_112");
    expect(await db.select().from(cases).where(eq(cases.personId, A.id))).toHaveLength(1);
  });
});
