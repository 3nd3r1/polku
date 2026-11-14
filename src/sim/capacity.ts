import { capabilityName, COUNTIES, countyByName, facility, RESOURCES, type Resource } from "../ontology/world";
import { lung } from "../pathways/lung";

/**
 * Calendars over the ontology: a step requires a capability, resources
 * provide it, resources sit at a facility in a county. No hospital is named
 * in code. Session times come from each resource's weekly template.
 * Occupancy is SYNTHETIC: everything before the resource's lead time is
 * taken, after that a fixed share is taken by other (invisible) patients.
 * Real bookings from the database are added on top by src/server/schedule.ts.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
/** Share of sessions after the lead time already taken by other patients. Synthetic. */
const BACKGROUND_LOAD = 0.55;

/** Resources in the patient's county that can serve a step. */
export function resourcesFor(countyName: string | null, stepId: string): Resource[] {
  const step = lung.steps.find((s) => s.id === stepId);
  const county = countyByName(countyName);
  if (!step || !("requires" in step) || !county) return [];
  return RESOURCES.filter((r) => r.capabilityId === step.requires && facility(r.facilityId).countyId === county.id);
}

/** Deterministic 0..1 from a string, so the same session is always taken or free. */
function hash01(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

export type Session = { at: string; taken: boolean };
export type CalendarDay = { date: string; sessions: Session[] };

/** Every session of a resource on the next `weekdays` working days from today, with synthetic occupancy. */
export function resourceCalendar(r: Resource, now: Date, weekdays = 10): CalendarDay[] {
  const day0 = new Date(now);
  day0.setHours(0, 0, 0, 0);
  const firstFree = day0.getTime() + r.leadDays * DAY_MS;
  const out: CalendarDay[] = [];
  for (let d = 0; out.length < weekdays && d < 60; d++) {
    const day = new Date(day0.getTime() + d * DAY_MS);
    if (day.getDay() === 0 || day.getDay() === 6) continue;
    const sessions = r.weekdays.includes(day.getDay())
      ? r.times.map((t) => {
          const [h, m] = t.split(":").map(Number);
          const at = new Date(day);
          at.setHours(h, m);
          const taken = at.getTime() < firstFree || hash01(`${r.id}@${at.toISOString()}`) < BACKGROUND_LOAD;
          return { at: at.toISOString(), taken };
        })
      : [];
    out.push({ date: day.toISOString(), sessions });
  }
  return out;
}

/** "CT imaging", "CT scanner", "Sairaala Nova", "Keski-Suomi": the ontology path a step's booking follows. */
export function ontologyPath(r: Resource) {
  const f = facility(r.facilityId);
  return {
    capability: capabilityName(r.capabilityId),
    resource: r.name,
    facility: f.name,
    county: COUNTIES.find((c) => c.id === f.countyId)!.name,
  };
}
