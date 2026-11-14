import { SYMPTOM_LABEL } from "./labels";
import type { Intake, SymptomCode } from "./schema";

/**
 * Clarity: what the intake must contain before the engine may decide.
 * Each gap is shown on the call screen as still missing, and becomes a
 * question the agent has to ask before record_intake is accepted.
 * v1, deliberately small. Extend here, not in the prompt.
 */

const RED_FLAGS: readonly SymptomCode[] = ["HAEMOPTYSIS_MASSIVE", "DYSPNOEA_SEVERE", "CHEST_PAIN_ACUTE_SEVERE"];

/** Symptoms whose criteria depend on duration. */
const NEEDS_DURATION: readonly SymptomCode[] = [
  "COUGH_NEW",
  "COUGH_WORSENING",
  "DYSPNOEA_NEW",
  "CHEST_PAIN",
  "SHOULDER_PAIN",
  "HOARSENESS",
];

export const isRedFlag = (code: SymptomCode) => RED_FLAGS.includes(code);

export type Gap = { kind: "symptoms" } | { kind: "duration"; code: SymptomCode } | { kind: "smoking" };

/** What is still missing. Empty = clear enough to evaluate. Red flags are never held back. */
export function gaps(intake: Intake): Gap[] {
  if (intake.observations.some((o) => isRedFlag(o.code))) return [];
  const out: Gap[] = [];
  if (intake.observations.length === 0) out.push({ kind: "symptoms" });
  for (const o of intake.observations) {
    if (NEEDS_DURATION.includes(o.code) && o.durationDays === undefined) out.push({ kind: "duration", code: o.code });
  }
  if (intake.smoking === "unknown") out.push({ kind: "smoking" });
  return out;
}

/** The instruction the agent gets for a gap. */
export function gapQuestion(g: Gap): string {
  switch (g.kind) {
    case "symptoms":
      return "Ask what symptoms they have been having.";
    case "duration":
      return `Ask how long they have had the ${SYMPTOM_LABEL[g.code].toLowerCase()}.`;
    case "smoking":
      return "Ask whether they smoke now, used to smoke, or have never smoked.";
  }
}

/** The gap as staff read it on the call screen. */
export function gapLabel(g: Gap): string {
  switch (g.kind) {
    case "symptoms":
      return "Symptoms";
    case "duration":
      return `How long: ${SYMPTOM_LABEL[g.code].toLowerCase()}`;
    case "smoking":
      return "Smoking history";
  }
}

/** Questions still to ask, as instructions for the agent. */
export const missingQuestions = (intake: Intake) => gaps(intake).map(gapQuestion);
