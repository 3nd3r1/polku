import { z } from "zod";

/**
 * The care layer of the ontology: counties, hospitals, capabilities and
 * schedulable resources. Plain data, validated on load. Adding a hospital or
 * a CT session is a row here, not a code change.
 *
 * Real: county and hospital names, which county a hospital belongs to.
 * Synthetic: resources, weekly sessions and lead times (anchored where a
 * county publishes a waiting-time promise, see `anchor`).
 */

export const County = z.object({ id: z.string(), name: z.string(), website: z.url() });
export const Facility = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  kind: z.enum(["central_hospital", "university_hospital"]),
  countyId: z.string(),
});
export const Capability = z.object({ id: z.string(), name: z.string() });
export const Resource = z.object({
  id: z.string(),
  name: z.string(),
  facilityId: z.string(),
  capabilityId: z.string(),
  /** 1 = Monday ... 5 = Friday. */
  weekdays: z.array(z.number().int().min(1).max(5)).min(1),
  /** Session start times, HH:MM, 24h. */
  times: z.array(z.string().regex(/^\d{2}:\d{2}$/)).min(1),
  /** Days until the first free session. Synthetic. */
  leadDays: z.number().int().min(0),
  /** Published promise the lead time is anchored to, if any. */
  anchor: z.string().optional(),
});
export type County = z.infer<typeof County>;
export type Facility = z.infer<typeof Facility>;
export type Capability = z.infer<typeof Capability>;
export type Resource = z.infer<typeof Resource>;

export const COUNTIES = z.array(County).parse([
  { id: "keski-suomi", name: "Keski-Suomi", website: "https://www.hyvaks.fi" },
  { id: "pirkanmaa", name: "Pirkanmaa", website: "https://www.pirha.fi" },
  { id: "satakunta", name: "Satakunta", website: "https://www.satakunnanhyvinvointialue.fi" },
  { id: "lappi", name: "Lappi", website: "https://lapha.fi" },
  { id: "kymenlaakso", name: "Kymenlaakso", website: "https://kymenhva.fi" },
  { id: "pohjois-savo", name: "Pohjois-Savo", website: "https://pshyvinvointialue.fi" },
]);

export const FACILITIES = z.array(Facility).parse([
  { id: "nova", name: "Sairaala Nova", city: "Jyväskylä", kind: "central_hospital", countyId: "keski-suomi" },
  { id: "tays", name: "Tays", city: "Tampere", kind: "university_hospital", countyId: "pirkanmaa" },
  { id: "satasairaala", name: "Satasairaala", city: "Pori", kind: "central_hospital", countyId: "satakunta" },
  { id: "lks", name: "Lapin keskussairaala", city: "Rovaniemi", kind: "central_hospital", countyId: "lappi" },
  { id: "kymsote", name: "Kymenlaakson keskussairaala", city: "Kotka", kind: "central_hospital", countyId: "kymenlaakso" },
  { id: "kys", name: "KYS", city: "Kuopio", kind: "university_hospital", countyId: "pohjois-savo" },
]);

export const CAPABILITIES = z.array(Capability).parse([
  { id: "ct", name: "CT imaging" },
  { id: "referral_review", name: "Referral review" },
  { id: "pulmonology", name: "Pulmonology clinic" },
  { id: "bronchoscopy", name: "Bronchoscopy" },
  { id: "tumour_board", name: "Lung tumour board" },
  { id: "treatment", name: "Treatment start" },
]);

/** Weekly session template per capability. Synthetic. */
const TEMPLATE: Record<string, Pick<Resource, "name" | "weekdays" | "times">> = {
  ct: { name: "CT scanner", weekdays: [1, 2, 3, 4, 5], times: ["08:00", "10:30", "13:00", "15:30"] },
  referral_review: { name: "Referral desk", weekdays: [1, 2, 3, 4, 5], times: ["09:00", "14:00"] },
  pulmonology: { name: "Pulmonology clinic", weekdays: [1, 2, 3, 4], times: ["08:30", "10:00", "13:15", "14:45"] },
  bronchoscopy: { name: "Bronchoscopy unit", weekdays: [2, 4], times: ["08:30", "11:00"] },
  tumour_board: { name: "Lung tumour board", weekdays: [3], times: ["14:00"] },
  treatment: { name: "Oncology", weekdays: [1, 2, 3, 4, 5], times: ["09:00", "13:00"] },
};

const DEFAULT_LEAD: Record<string, number> = {
  ct: 7,
  referral_review: 1,
  pulmonology: 8,
  bronchoscopy: 14,
  tumour_board: 3,
  treatment: 12,
};

const LEAD: Record<string, Partial<Record<string, { days: number; anchor?: string }>>> = {
  pirkanmaa: {
    ct: { days: 5, anchor: "Pirha: CT 'useimmiten viikon sisällä lähetteen käsittelystä' (docs/lung-pathway-sources.md, FI-PIRHA)" },
    pulmonology: { days: 4, anchor: "Pirha lung pathway (docs/lung-pathway-sources.md, FI-PIRHA)" },
  },
  "keski-suomi": {
    ct: { days: 9 },
    pulmonology: { days: 26, anchor: "Keski-Suomi: visit 'noin kuukauden sisällä lähetteen saapumisesta' (docs/lung-pathway-sources.md, FI-KS)" },
  },
};

export const RESOURCES = z.array(Resource).parse(
  FACILITIES.flatMap((f) =>
    CAPABILITIES.map((c) => {
      const lead = LEAD[f.countyId]?.[c.id];
      return {
        id: `${f.id}-${c.id}`,
        ...TEMPLATE[c.id],
        facilityId: f.id,
        capabilityId: c.id,
        leadDays: lead?.days ?? DEFAULT_LEAD[c.id],
        anchor: lead?.anchor,
      };
    }),
  ),
);

export const countyByName = (name: string | null) => COUNTIES.find((c) => c.name === name);
export const facility = (id: string) => FACILITIES.find((f) => f.id === id)!;
export const capabilityName = (id: string) => CAPABILITIES.find((c) => c.id === id)?.name ?? id;
