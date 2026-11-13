import { SYMPTOM_LABEL } from "./labels";
import type { Intake, SymptomCode } from "./schema";

/**
 * Clarity: what the intake must contain before the engine may decide.
 * Each gap becomes a question the agent has to ask before record_intake is accepted.
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

/** Questions still to ask. Empty = clear enough to evaluate. Red flags are never held back. */
export function missingQuestions(intake: Intake): string[] {
  if (intake.observations.some((o) => isRedFlag(o.code))) return [];

  const questions: string[] = [];
  if (intake.observations.length === 0) questions.push("Ask what symptoms they have been having.");
  for (const o of intake.observations) {
    if (NEEDS_DURATION.includes(o.code) && o.durationDays === undefined) {
      questions.push(`Ask how long they have had the ${SYMPTOM_LABEL[o.code].toLowerCase()}.`);
    }
  }
  if (intake.smoking === "unknown") questions.push("Ask whether they smoke now, used to smoke, or have never smoked.");
  return questions;
}
