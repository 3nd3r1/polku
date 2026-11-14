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

/** How the agent names each step to a caller. */
export const STEP_SPOKEN: Record<string, string> = {
  callback: "a call from a nurse",
  primary_assessment: "a CT scan",
  referral: "your referral to a lung specialist",
  first_visit: "your first visit to a lung specialist",
  diagnostics: "further tests",
  mdt_decision: "the treatment team's decision",
  treatment_start: "the start of your treatment",
};

/** "Tuesday 17 November at 14:00", always Finnish time, whatever the server's zone. */
export const spokenDayTime = (d: Date) =>
  d.toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Helsinki",
  });
