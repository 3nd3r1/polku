import { describe, expect, it } from "vitest";
import { resourcesFor, slotsFor } from "./capacity";

const MONDAY = new Date("2026-11-16T07:00:00");

describe("scheduler", () => {
  it("finds the county's resource through the step's capability", () => {
    expect(resourcesFor("Keski-Suomi", "first_visit").map((r) => r.id)).toEqual(["nova-pulmonology"]);
    expect(resourcesFor("Keski-Suomi", "callback")).toEqual([]);
  });

  it("returns weekday sessions after the lead time, earliest first", () => {
    const slots = slotsFor("Pirkanmaa", "primary_assessment", MONDAY);
    expect(slots).toHaveLength(4);
    expect(slots[0].unit).toBe("Tays");
    expect(new Date(slots[0].at).getDate()).toBe(23); // 5 days lead lands on Saturday, so Monday
    for (const s of slots) expect([0, 6]).not.toContain(new Date(s.at).getDay());
  });

  it("only books the tumour board on its meeting day", () => {
    for (const s of slotsFor("Lappi", "mdt_decision", MONDAY)) expect(new Date(s.at).getDay()).toBe(3);
  });
});
