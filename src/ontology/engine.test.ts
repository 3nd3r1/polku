import { describe, expect, it } from "vitest";
import { lung } from "../pathways/lung";
import { evaluate, sayThis } from "./engine";
import { Intake, SymptomCode } from "./schema";

const run = (intake: Intake) => evaluate(Intake.parse(intake), lung);
const ids = (intake: Intake) => run(intake).matches.map((m) => m.criterion.id);

describe("vignettes", () => {
  it("Matti: 58, ex-smoker, new cough 7 weeks -> fast track on SE-M1", () => {
    const intake: Intake = {
      age: 58,
      smoking: "former",
      observations: [{ code: "COUGH_NEW", durationDays: 49, quote: "I've been coughing for about seven weeks" }],
    };
    expect(run(intake).outcome).toBe("fast_track");
    expect(ids(intake)).toEqual(expect.arrayContaining(["SE-M1", "DK-1", "FI-P1-3WK"]));
  });

  it("single haemoptysis at 25, never smoked -> fast track (any age, DK-4)", () => {
    const intake: Intake = {
      age: 25,
      smoking: "never",
      observations: [{ code: "HAEMOPTYSIS", quote: "there was blood when I coughed" }],
    };
    expect(run(intake).outcome).toBe("fast_track");
    expect(ids(intake)).toEqual(expect.arrayContaining(["SE-M3", "DK-4"]));
  });

  it("repeated unexplained haemoptysis -> well-founded SE-V3 cited first", () => {
    const intake: Intake = {
      age: 60,
      smoking: "current",
      observations: [{ code: "HAEMOPTYSIS_REPEATED", quote: "blood in my phlegm several times this week" }],
    };
    const e = run(intake);
    expect(e.outcome).toBe("fast_track");
    expect(e.matches[0].criterion.id).toBe("SE-V3");
  });

  it("45, smoker, unexplained cough 5 weeks -> DK-1 only (SE needs 6 weeks)", () => {
    const intake: Intake = {
      age: 45,
      smoking: "current",
      observations: [{ code: "COUGH_NEW", durationDays: 35, quote: "five weeks of coughing" }],
    };
    expect(run(intake).outcome).toBe("fast_track");
    expect(ids(intake)).not.toContain("SE-M1");
    expect(ids(intake)).toContain("DK-1");
  });

  it("unexplained chest pain -> SE-M2; explained chest pain short-term -> no match", () => {
    expect(
      run({ age: 50, smoking: "never", observations: [{ code: "CHEST_PAIN", durationDays: 5, quote: "my chest hurts" }] })
        .outcome,
    ).toBe("fast_track");
    expect(
      run({
        age: 50,
        smoking: "never",
        observations: [{ code: "CHEST_PAIN", durationDays: 5, quote: "my chest hurts", knownCause: "fell skiing" }],
      }).outcome,
    ).toBe("no_match");
  });
});

describe("near misses", () => {
  it("30, non-smoker, cough 25 days -> see GP, not fast track", () => {
    expect(
      run({ age: 30, smoking: "never", observations: [{ code: "COUGH_NEW", durationDays: 25, quote: "cough for 25 days" }] })
        .outcome,
    ).toBe("see_gp");
  });

  it("cough exactly 3 weeks -> no match (Pirha says over 3 weeks)", () => {
    expect(
      run({ age: 30, smoking: "never", observations: [{ code: "COUGH_NEW", durationDays: 21, quote: "three weeks" }] })
        .outcome,
    ).toBe("no_match");
  });

  it("38, smoker, cough 2 months -> see GP (SE-M1 and DK-1 need over 40)", () => {
    expect(
      run({ age: 38, smoking: "current", observations: [{ code: "COUGH_NEW", durationDays: 60, quote: "two months" }] })
        .outcome,
    ).toBe("see_gp");
  });

  it("unknown age never satisfies an age criterion", () => {
    const intake: Intake = {
      smoking: "former",
      observations: [{ code: "COUGH_NEW", durationDays: 60, quote: "two months" }],
    };
    expect(ids(intake)).not.toContain("SE-M1");
    expect(run(intake).outcome).toBe("see_gp");
  });

  it("unexplained weight loss alone -> see GP", () => {
    expect(
      run({ age: 55, smoking: "never", observations: [{ code: "WEIGHT_LOSS_UNEXPLAINED", quote: "lost 8 kilos" }] }).outcome,
    ).toBe("see_gp");
  });

  it("nothing reported -> no match", () => {
    expect(run({ age: 40, smoking: "unknown", observations: [] }).outcome).toBe("no_match");
  });
});

describe("red flags", () => {
  it.each(["HAEMOPTYSIS_MASSIVE", "DYSPNOEA_SEVERE", "CHEST_PAIN_ACUTE_SEVERE"] as const)("%s -> call 112", (code) => {
    const e = run({ age: 30, smoking: "never", observations: [{ code, quote: "..." }] });
    expect(e.outcome).toBe("call_112");
    expect(sayThis(e, lung)).toContain("112");
  });

  it("red flag wins over any other match", () => {
    const e = run({
      age: 58,
      smoking: "former",
      observations: [
        { code: "COUGH_NEW", durationDays: 49, quote: "seven weeks of cough" },
        { code: "HAEMOPTYSIS_REPEATED", quote: "blood again" },
        { code: "DYSPNOEA_SEVERE", quote: "I can't breathe right now" },
      ],
    });
    expect(e.outcome).toBe("call_112");
    expect(e.matches[0].criterion.id).toBe("RF-112");
  });
});

describe("intake validation (LLM output boundary)", () => {
  it("rejects codes outside the vocabulary, including clinician-only ones", () => {
    const bad = { smoking: "never", observations: [{ code: "IMAGING_SUSPECT_LUNG_CA", quote: "x" }] };
    expect(Intake.safeParse(bad).success).toBe(false);
  });

  it("rejects an observation without a quote", () => {
    const bad = { smoking: "never", observations: [{ code: "COUGH_NEW", quote: "" }] };
    expect(Intake.safeParse(bad).success).toBe(false);
  });
});

describe("pathway integrity", () => {
  const sourceIds = new Set(lung.sources.map((s) => s.id));

  it("every criterion and step cites a listed source", () => {
    for (const c of lung.criteria) expect(sourceIds).toContain(c.sourceId);
    for (const s of lung.steps) expect(sourceIds).toContain(s.sourceId);
  });

  it("every symptom code is used by some criterion", () => {
    const used = new Set(lung.criteria.flatMap((c) => c.when.anyOf));
    for (const code of SymptomCode.options) expect(used).toContain(code);
  });

  it("steps from well-founded suspicion add up to the SVF total of 44 days (surgery/RT)", () => {
    const afterSuspicion = ["referral", "first_visit", "diagnostics", "mdt_decision", "treatment_start"];
    const total = lung.steps.filter((s) => afterSuspicion.includes(s.id)).reduce((sum, s) => sum + s.maxDays, 0);
    expect(total).toBe(44);
  });
});

describe("spoken promise", () => {
  it("states the exact callback deadline in Finnish time", () => {
    const e = run({ age: 71, smoking: "former", observations: [{ code: "COUGH_NEW", durationDays: 49, quote: "seven weeks" }] });
    const said = sayThis(e, lung, new Date("2026-11-16T12:04:00Z"));
    expect(said).toContain("A nurse will call you by Monday 16 November at 14:04.");
    expect(said).toContain("This is not a diagnosis.");
  });
});
