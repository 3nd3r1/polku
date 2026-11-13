/**
 * The ontology metamodel: object types, and directed link types between them.
 * A "creates" link is an action: the source object, through that action,
 * brings the target object into being (a call creates a case). A "relates"
 * link is structure (a hospital is in a county).
 * Add a type here, add its objects in a data file, and every view picks it up.
 */

/** Where a value comes from. Shown on every object in the explorer. */
export type Provenance = "real" | "synthetic" | "design";

export type ObjectTypeDef = {
  id: string;
  label: string;
  plural: string;
  description: string;
  layer: "case" | "care" | "pathway";
};

export type LinkTypeDef = {
  id: string;
  label: string;
  from: string;
  to: string;
  kind: "creates" | "relates";
  /** For "creates": the action and who performs it. */
  action?: string;
  actor?: string;
};

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
  { id: "Person", label: "Person", plural: "People", layer: "case", description: "A strongly identified caller (synthetic)" },
  { id: "Call", label: "Call", plural: "Calls", layer: "case", description: "One phone call to the Polku line" },
  { id: "Case", label: "Case", plural: "Cases", layer: "case", description: "A caller's symptoms and where they are in the pathway" },
  { id: "Clock", label: "Clock", plural: "Clocks", layer: "case", description: "Timer for one pathway step of one case" },
  { id: "Appointment", label: "Appointment", plural: "Appointments", layer: "case", description: "A booked session for a step" },
  { id: "County", label: "County", plural: "Counties", layer: "care", description: "Wellbeing county (hyvinvointialue) that organises care" },
  { id: "Facility", label: "Hospital", plural: "Hospitals", layer: "care", description: "Hospital that runs the specialist steps" },
  { id: "Resource", label: "Resource", plural: "Resources", layer: "care", description: "A schedulable unit, such as a CT scanner, with weekly sessions" },
  { id: "Capability", label: "Capability", plural: "Capabilities", layer: "care", description: "A kind of service a step needs, such as CT" },
  { id: "Pathway", label: "Pathway", plural: "Pathways", layer: "pathway", description: "A versioned cancer pathway definition" },
  { id: "Step", label: "Step", plural: "Steps", layer: "pathway", description: "Pathway step with a maximum time" },
  { id: "Criterion", label: "Criterion", plural: "Criteria", layer: "pathway", description: "Published entry criterion" },
  { id: "Symptom", label: "Symptom", plural: "Symptoms", layer: "pathway", description: "Controlled symptom vocabulary" },
  { id: "Source", label: "Source", plural: "Sources", layer: "pathway", description: "Document a rule or number comes from" },
] as const satisfies readonly ObjectTypeDef[];

export type ObjectTypeId = (typeof OBJECT_TYPES)[number]["id"];

export const LINK_TYPES = [
  // What creates what
  { id: "places", label: "places", from: "Person", to: "Call", kind: "creates", action: "Phone call", actor: "Caller" },
  { id: "opens", label: "opens", from: "Call", to: "Case", kind: "creates", action: "Record intake", actor: "AI agent" },
  { id: "starts", label: "starts", from: "Case", to: "Clock", kind: "creates", action: "Start clock", actor: "Nurse" },
  { id: "books", label: "books", from: "Clock", to: "Appointment", kind: "creates", action: "Book slot", actor: "Nurse" },
  // Structure
  { id: "matched", label: "matched", from: "Case", to: "Criterion", kind: "relates" },
  { id: "times", label: "times", from: "Clock", to: "Step", kind: "relates" },
  { id: "on", label: "on", from: "Appointment", to: "Resource", kind: "relates" },
  { id: "lives_in", label: "lives in", from: "Person", to: "County", kind: "relates" },
  { id: "resource_at", label: "at", from: "Resource", to: "Facility", kind: "relates" },
  { id: "provides", label: "provides", from: "Resource", to: "Capability", kind: "relates" },
  { id: "facility_in", label: "in", from: "Facility", to: "County", kind: "relates" },
  { id: "step_of", label: "step of", from: "Step", to: "Pathway", kind: "relates" },
  { id: "next_step", label: "then", from: "Step", to: "Step", kind: "relates" },
  { id: "requires", label: "requires", from: "Step", to: "Capability", kind: "relates" },
  { id: "criterion_of", label: "entry to", from: "Criterion", to: "Pathway", kind: "relates" },
  { id: "on_symptom", label: "on", from: "Criterion", to: "Symptom", kind: "relates" },
  { id: "cites", label: "cites", from: "Criterion", to: "Source", kind: "relates" },
  { id: "step_cites", label: "cites", from: "Step", to: "Source", kind: "relates" },
] as const satisfies readonly LinkTypeDef[];

export const linkType = (id: string): LinkTypeDef | undefined => LINK_TYPES.find((l) => l.id === id);
export const objectType = (id: string) => OBJECT_TYPES.find((t) => t.id === id);
