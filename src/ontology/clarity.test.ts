import { describe, expect, it } from "vitest";
import { gapLabel, gaps, missingQuestions } from "./clarity";

describe("clarity", () => {
  it("asks for symptoms, duration and smoking when missing", () => {
    expect(missingQuestions({ smoking: "unknown", observations: [] })).toHaveLength(2);
    const q = missingQuestions({ smoking: "unknown", observations: [{ code: "COUGH_NEW", quote: "I cough" }] });
    expect(q).toEqual([
      "Ask how long they have had the new cough.",
      "Ask whether they smoke now, used to smoke, or have never smoked.",
    ]);
  });

  it("is satisfied by a complete intake", () => {
    expect(
      missingQuestions({
        smoking: "former",
        observations: [{ code: "COUGH_NEW", durationDays: 49, quote: "seven weeks" }],
      }),
    ).toEqual([]);
  });

  it("names each gap for the screen", () => {
    expect(gaps({ smoking: "unknown", observations: [{ code: "COUGH_NEW", quote: "I cough" }] }).map(gapLabel)).toEqual([
      "How long: new cough",
      "Smoking history",
    ]);
  });

  it("never holds back a red flag", () => {
    expect(missingQuestions({ smoking: "unknown", observations: [{ code: "DYSPNOEA_SEVERE", quote: "can't breathe" }] })).toEqual(
      [],
    );
  });
});
