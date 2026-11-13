import { countyByName, facility, RESOURCES, type Resource } from "../ontology/world";
import { lung } from "../pathways/lung";

/**
 * Scheduler over the ontology: step requires a capability, resources provide
 * it, resources sit at a facility in a county. No hospital is named in code.
 * Availability is SYNTHETIC (see world.ts); bookings do not consume capacity yet.
 */

export type Slot = { id: string; at: string; unit: string; resourceId: string; resource: string };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Resources in the patient's county that can serve a step. */
export function resourcesFor(countyName: string | null, stepId: string): Resource[] {
  const step = lung.steps.find((s) => s.id === stepId);
  const county = countyByName(countyName);
  if (!step || !("requires" in step) || !county) return [];
  return RESOURCES.filter((r) => r.capabilityId === step.requires && facility(r.facilityId).countyId === county.id);
}

/** The next free sessions of one resource, from its weekly template. */
function sessions(r: Resource, now: Date, count: number): Date[] {
  const day0 = new Date(now);
  day0.setHours(0, 0, 0, 0);
  const out: Date[] = [];
  for (let d = r.leadDays; out.length < count && d < r.leadDays + 120; d++) {
    const day = new Date(day0.getTime() + d * DAY_MS);
    if (!r.weekdays.includes(day.getDay())) continue;
    for (const t of r.times) {
      const [h, m] = t.split(":").map(Number);
      const at = new Date(day);
      at.setHours(h, m);
      out.push(at);
    }
  }
  return out.slice(0, count);
}

/** The four earliest bookable slots for a step, across every matching resource. */
export function slotsFor(countyName: string | null, stepId: string, now = new Date()): Slot[] {
  return resourcesFor(countyName, stepId)
    .flatMap((r) =>
      sessions(r, now, 4).map((at) => ({
        id: `${r.id}@${at.toISOString()}`,
        at: at.toISOString(),
        unit: facility(r.facilityId).name,
        resourceId: r.id,
        resource: r.name,
      })),
    )
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(0, 4);
}
