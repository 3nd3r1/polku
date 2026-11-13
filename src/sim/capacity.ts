/**
 * SYNTHETIC appointment capacity per wellbeing county. Slot dates are made up,
 * except where a county publishes a promise we anchor to (sources below).
 */

/** County hospital that runs the specialist steps. Real hospitals, synthetic availability. */
export const UNIT_BY_COUNTY: Record<string, string> = {
  "Keski-Suomi": "Sairaala Nova, Jyväskylä",
  Pirkanmaa: "Tays, Tampere",
  Satakunta: "Satasairaala, Pori",
  Lappi: "Lapin keskussairaala, Rovaniemi",
  Kymenlaakso: "Kymenlaakson keskussairaala, Kotka",
  "Pohjois-Savo": "KYS, Kuopio",
};

/** Days until the first free slot, per step. */
const DEFAULT_WAIT: Record<string, number> = {
  primary_assessment: 7,
  referral: 1,
  first_visit: 8,
  diagnostics: 14,
  mdt_decision: 3,
  treatment_start: 12,
};

const COUNTY_WAIT: Record<string, Partial<Record<string, number>>> = {
  // Pirha: CT "useimmiten viikon sisällä lähetteen käsittelystä" (docs/13, FI-PIRHA)
  Pirkanmaa: { primary_assessment: 5, first_visit: 4 },
  // Keski-Suomi: pulmonology visit "noin kuukauden sisällä lähetteen saapumisesta" (docs/13, FI-KS)
  "Keski-Suomi": { primary_assessment: 9, first_visit: 26 },
};

export type Slot = { id: string; at: string; unit: string };

const DAY_MS = 24 * 60 * 60 * 1000;
const TIMES = [
  [8, 30],
  [10, 0],
  [13, 15],
  [14, 45],
];

/** Four bookable slots for a step, deterministic for a given county, step and day. */
export function slotsFor(county: string | null, stepId: string, now = new Date()): Slot[] {
  const c = county ?? "";
  const wait = COUNTY_WAIT[c]?.[stepId] ?? DEFAULT_WAIT[stepId] ?? 7;
  const unit = UNIT_BY_COUNTY[c] ?? "Central hospital";
  const day0 = new Date(now);
  day0.setHours(0, 0, 0, 0);

  const slots: Slot[] = [];
  let offset = wait;
  for (let i = 0; slots.length < 4; i++, offset += i) {
    const d = new Date(day0.getTime() + offset * DAY_MS);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // weekdays only
    const [h, m] = TIMES[slots.length % TIMES.length];
    d.setHours(h, m);
    slots.push({ id: d.toISOString(), at: d.toISOString(), unit });
  }
  return slots;
}
