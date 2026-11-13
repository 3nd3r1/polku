import type { Smoking, SymptomCode } from "./schema";

/** Plain-language names for UI. Codes stay internal. */
export const SYMPTOM_LABEL: Record<SymptomCode, string> = {
  HAEMOPTYSIS: "Blood in sputum",
  HAEMOPTYSIS_REPEATED: "Repeated blood in sputum",
  COUGH_NEW: "New cough",
  COUGH_WORSENING: "Worsening cough",
  DYSPNOEA_NEW: "New breathlessness",
  CHEST_PAIN: "Chest pain",
  SHOULDER_PAIN: "Shoulder pain",
  HOARSENESS: "Hoarse voice",
  WEIGHT_LOSS_UNEXPLAINED: "Unexplained weight loss",
  HAEMOPTYSIS_MASSIVE: "Heavy bleeding when coughing",
  DYSPNOEA_SEVERE: "Severe breathlessness",
  CHEST_PAIN_ACUTE_SEVERE: "Sudden severe chest pain",
};

export const SMOKING_LABEL: Record<Smoking, string> = {
  current: "Smoker",
  former: "Ex-smoker",
  never: "Never smoked",
  unknown: "Smoking unknown",
};

export function formatDuration(days: number) {
  if (days >= 14) return `${Math.round(days / 7)} weeks`;
  return days === 1 ? "1 day" : `${days} days`;
}
