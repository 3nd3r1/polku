import { spokenDayTime } from "./labels";
import { LEVELS, type Criterion, type Intake, type Level, type Observation, type Pathway } from "./schema";

export type Outcome = "call_112" | "fast_track" | "see_gp" | "no_match";

export type Match = {
  criterion: Criterion;
  observation: Observation;
};

export type Evaluation = {
  outcome: Outcome;
  /** All matches, most severe first. The first one is the cited reason. */
  matches: Match[];
};

const OUTCOME_BY_LEVEL: Record<Level, Outcome> = {
  emergency: "call_112",
  well_founded: "fast_track",
  suspicion: "fast_track",
  gp_advice: "see_gp",
};

function observationMeets(c: Criterion, o: Observation, intake: Intake): boolean {
  const w = c.when;
  if (!w.anyOf.includes(o.code)) return false;
  if (w.minDays !== undefined && (o.durationDays === undefined || o.durationDays < w.minDays)) return false;
  if (w.ageOver !== undefined && (intake.age === undefined || intake.age <= w.ageOver)) return false;
  if (w.smoking !== undefined && !w.smoking.includes(intake.smoking)) return false;
  if (w.unexplained && o.knownCause !== undefined) return false;
  return true;
}

/**
 * Deterministic match of extracted observations against a pathway's criteria.
 * No LLM involved. Any emergency criterion forces call_112, whatever else matched.
 */
export function evaluate(intake: Intake, pathway: Pathway): Evaluation {
  const matches: Match[] = [];
  for (const criterion of pathway.criteria) {
    for (const observation of intake.observations) {
      if (observationMeets(criterion, observation, intake)) matches.push({ criterion, observation });
    }
  }
  matches.sort((a, b) => LEVELS.indexOf(b.criterion.level) - LEVELS.indexOf(a.criterion.level));

  const top = matches[0];
  return { outcome: top ? OUTCOME_BY_LEVEL[top.criterion.level] : "no_match", matches };
}

/**
 * What the voice agent says back. Fixed text, never generated. With the
 * callback deadline the caller hears the exact time the screen counts down to.
 */
export function sayThis(evaluation: Evaluation, pathway: Pathway, callbackDueAt?: Date): string {
  const callback = pathway.steps.find((s) => s.id === "callback");
  switch (evaluation.outcome) {
    case "call_112":
      return "Please hang up and call 112 now. Goodbye.";
    case "fast_track": {
      const when = callbackDueAt ? `by ${spokenDayTime(callbackDueAt)}` : `within ${callback?.maxDays ?? 2} days`;
      return `Thank you. A nurse will call you ${when} to arrange your next step.`;
    }
    case "see_gp":
      return "Please contact your health centre for an appointment.";
    case "no_match":
      return "If you need help, contact your health centre.";
  }
}
