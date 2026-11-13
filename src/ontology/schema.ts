import { z } from "zod";

/**
 * Symptom codes a patient can report by phone. Only codes used by at least one
 * encoded criterion are listed (see docs/13-lung-pathway-sources.md section 3).
 * Clinician-only codes (imaging, spirometry) are deliberately absent so the
 * extractor can never emit them.
 */
export const SymptomCode = z.enum([
  "HAEMOPTYSIS",
  "HAEMOPTYSIS_REPEATED",
  "COUGH_NEW",
  "COUGH_WORSENING",
  "DYSPNOEA_NEW",
  "CHEST_PAIN",
  "SHOULDER_PAIN",
  "HOARSENESS",
  "WEIGHT_LOSS_UNEXPLAINED",
  // Red flags: always "call 112", enforced in the engine.
  "HAEMOPTYSIS_MASSIVE",
  "DYSPNOEA_SEVERE",
  "CHEST_PAIN_ACUTE_SEVERE",
]);
export type SymptomCode = z.infer<typeof SymptomCode>;

export const Smoking = z.enum(["current", "former", "never", "unknown"]);
export type Smoking = z.infer<typeof Smoking>;

/** One symptom as extracted by the LLM, tied to the caller's own words. */
export const Observation = z.object({
  code: SymptomCode,
  durationDays: z.number().int().min(0).max(36500).optional(),
  quote: z.string().min(1).max(500),
  /** A cause the caller gave themselves ("I fell skiing"). Present = explained. */
  knownCause: z.string().min(1).max(200).optional(),
});
export type Observation = z.infer<typeof Observation>;

/** The record_intake tool payload. Validated at the API boundary. */
export const Intake = z.object({
  age: z.number().int().min(0).max(120).optional(),
  smoking: Smoking,
  observations: z.array(Observation).max(20),
});
export type Intake = z.infer<typeof Intake>;

// Pathway definitions are code, checked by the type system, not parsed at runtime.

export type Source = {
  id: string;
  title: string;
  url: string;
  verification: "read" | "partially_verified" | "design_choice";
};

/** Ordered by severity: the engine returns the most severe level matched. */
export const LEVELS = ["gp_advice", "suspicion", "well_founded", "emergency"] as const;
export type Level = (typeof LEVELS)[number];

export type Criterion = {
  id: string;
  level: Level;
  sourceId: string;
  /** Verbatim text from the source, original language. */
  quote: string;
  gloss: string;
  /** All conditions must hold for one observation. */
  when: {
    anyOf: readonly SymptomCode[];
    /** Inclusive, on the observation's durationDays. Unknown duration fails. */
    minDays?: number;
    /** Strictly greater than. Unknown age fails. */
    ageOver?: number;
    smoking?: readonly Smoking[];
    /** The caller gave no other cause for the symptom. */
    unexplained?: true;
  };
};

export type Step = {
  id: string;
  name: string;
  clockStart: string;
  clockStop: string;
  maxDays: number;
  sourceId: string;
  note?: string;
};

export type Pathway = {
  id: string;
  version: string;
  name: string;
  sources: readonly Source[];
  criteria: readonly Criterion[];
  steps: readonly Step[];
};
