import { lung } from "../pathways/lung";

/**
 * One secured record per patient. It is written once on the call and moves
 * with the patient; each step opens only the parts it needs, and every open
 * is logged (record_access). Nobody asks the same question twice.
 */

export const RECORD_PARTS = ["identity", "contact", "symptoms", "match", "booking"] as const;
export type RecordPart = (typeof RECORD_PARTS)[number];

export const PART_LABEL: Record<RecordPart, string> = {
  identity: "Identity",
  contact: "Phone",
  symptoms: "Symptoms",
  match: "Criterion",
  booking: "Booking",
};

/** Who has the patient at each handoff. */
export const HOLDERS = ["call", "nurse", "ct", "specialist"] as const;
export type Holder = (typeof HOLDERS)[number];

export const HOLDER_LABEL: Record<Holder, string> = {
  call: "Call",
  nurse: "Nurse",
  ct: "CT",
  specialist: "Specialist",
};

type StepId = (typeof lung.steps)[number]["id"];

export const HOLDER_OF_STEP: Record<StepId, Holder> = {
  callback: "nurse",
  primary_assessment: "ct",
  referral: "specialist",
  first_visit: "specialist",
  diagnostics: "specialist",
  mdt_decision: "specialist",
  treatment_start: "specialist",
};

export const holderOf = (stepId: string): Holder => HOLDER_OF_STEP[stepId as StepId] ?? "specialist";

/** What each holder may open. The CT unit gets the referral reason, not the symptom story. */
export const MAY_OPEN: Record<Holder, readonly RecordPart[]> = {
  call: ["identity", "symptoms", "booking"],
  nurse: ["identity", "contact", "symptoms", "match", "booking"],
  ct: ["identity", "match", "booking"],
  specialist: ["identity", "symptoms", "match", "booking"],
};

export const mayOpen = (holder: Holder, parts: readonly RecordPart[]) => parts.every((p) => MAY_OPEN[holder].includes(p));
