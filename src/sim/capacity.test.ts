import { describe, expect, it } from "vitest";
import { ontologyPath, resourceCalendar, resourcesFor } from "./capacity";

const MONDAY = new Date("2026-11-16T07:00:00");

describe("calendar over the ontology", () => {
  it("finds the county's resource through the step's capability", () => {
    expect(resourcesFor("Keski-Suomi", "first_visit").map((r) => r.id)).toEqual(["nova-pulmonology"]);
    expect(resourcesFor("Keski-Suomi", "callback")).toEqual([]);
    const [ct] = resourcesFor("Pirkanmaa", "primary_assessment");
    expect(ontologyPath(ct)).toEqual({ capability: "CT imaging", resource: "CT scanner", facility: "Tays", county: "Pirkanmaa" });
  });

  it("shows ten working days, everything before the lead time taken", () => {
    const [ct] = resourcesFor("Pirkanmaa", "primary_assessment"); // 5 days lead
    const days = resourceCalendar(ct, MONDAY);
    expect(days).toHaveLength(10);
    for (const d of days) expect([0, 6]).not.toContain(new Date(d.date).getDay());
    const sessions = days.flatMap((d) => d.sessions);
    expect(sessions.filter((s) => new Date(s.at) < new Date("2026-11-21")).every((s) => s.taken)).toBe(true);
    expect(sessions.some((s) => !s.taken)).toBe(true);
  });

  it("only has tumour board sessions on its meeting day", () => {
    const [board] = resourcesFor("Lappi", "mdt_decision");
    for (const s of resourceCalendar(board, MONDAY).flatMap((d) => d.sessions)) expect(new Date(s.at).getDay()).toBe(3);
  });

  it("is deterministic", () => {
    const [ct] = resourcesFor("Lappi", "primary_assessment");
    expect(resourceCalendar(ct, MONDAY)).toEqual(resourceCalendar(ct, MONDAY));
  });
});
