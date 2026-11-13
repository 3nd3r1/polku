/**
 * The ontology metamodel: object types, link types, and the instance graph.
 * Everything the screens, scheduler and cockpit know about the world is an
 * object of a registered type, connected by a registered link type.
 * Add a type here, add its objects in a data file, and every view picks it up.
 */

/** Where a value comes from. Shown on every object in the explorer. */
export type Provenance = "real" | "synthetic" | "design";

export type ObjectTypeDef = {
  id: string;
  label: string;
  plural: string;
  description: string;
  /** Kept separate so the explorer can group the graph. */
  layer: "care" | "pathway" | "case";
};

export type LinkTypeDef = { id: string; label: string; from: string; to: string };

export type PropValue = string | number | boolean | null;

export type OntObject = {
  /** Globally unique: `${type}:${localId}`. */
  key: string;
  type: string;
  title: string;
  subtitle?: string;
  provenance: Provenance;
  sourceUrl?: string;
  props: Record<string, PropValue>;
};

export type OntLink = { type: string; from: string; to: string };

export type OntGraph = { objects: OntObject[]; links: OntLink[] };

export const key = (type: string, id: string) => `${type}:${id}`;

export const OBJECT_TYPES = [
  { id: "County", label: "County", plural: "Counties", layer: "care", description: "Wellbeing county (hyvinvointialue) that organises care" },
  { id: "Facility", label: "Facility", plural: "Facilities", layer: "care", description: "Hospital that runs specialist steps" },
  { id: "Capability", label: "Capability", plural: "Capabilities", layer: "care", description: "A kind of service a step needs, such as CT" },
  { id: "Resource", label: "Resource", plural: "Resources", layer: "care", description: "A schedulable unit with weekly sessions" },
  { id: "Pathway", label: "Pathway", plural: "Pathways", layer: "pathway", description: "A versioned cancer pathway definition" },
  { id: "Step", label: "Step", plural: "Steps", layer: "pathway", description: "Pathway step with a maximum time" },
  { id: "Criterion", label: "Criterion", plural: "Criteria", layer: "pathway", description: "Published entry criterion" },
  { id: "Source", label: "Source", plural: "Sources", layer: "pathway", description: "Document a rule or number comes from" },
  { id: "Symptom", label: "Symptom", plural: "Symptoms", layer: "pathway", description: "Controlled symptom vocabulary" },
  { id: "Person", label: "Person", plural: "People", layer: "case", description: "Identified caller (synthetic)" },
  { id: "Case", label: "Case", plural: "Cases", layer: "case", description: "A caller's intake and pathway position" },
  { id: "Clock", label: "Clock", plural: "Clocks", layer: "case", description: "Timer for one step of one case" },
] as const satisfies readonly ObjectTypeDef[];

export type ObjectTypeId = (typeof OBJECT_TYPES)[number]["id"];

export const LINK_TYPES = [
  { id: "facility_in", label: "in county", from: "Facility", to: "County" },
  { id: "resource_at", label: "at", from: "Resource", to: "Facility" },
  { id: "provides", label: "provides", from: "Resource", to: "Capability" },
  { id: "step_of", label: "step of", from: "Step", to: "Pathway" },
  { id: "next_step", label: "then", from: "Step", to: "Step" },
  { id: "requires", label: "requires", from: "Step", to: "Capability" },
  { id: "criterion_of", label: "criterion of", from: "Criterion", to: "Pathway" },
  { id: "on_symptom", label: "on symptom", from: "Criterion", to: "Symptom" },
  { id: "cites", label: "cites", from: "Criterion", to: "Source" },
  { id: "step_cites", label: "cites", from: "Step", to: "Source" },
  { id: "lives_in", label: "lives in", from: "Person", to: "County" },
  { id: "case_of", label: "case of", from: "Case", to: "Person" },
  { id: "matched", label: "matched", from: "Case", to: "Criterion" },
  { id: "clock_of", label: "clock of", from: "Clock", to: "Case" },
  { id: "times", label: "times", from: "Clock", to: "Step" },
  { id: "booked_on", label: "booked on", from: "Clock", to: "Resource" },
] as const satisfies readonly LinkTypeDef[];
