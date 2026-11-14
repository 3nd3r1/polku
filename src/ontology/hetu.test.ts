import { describe, expect, it } from "vitest";
import { makeHetu, maskHetu, parseHetu } from "./hetu";

describe("hetu", () => {
  it("accepts the DVV example code", () => {
    const r = parseHetu("131052-308T");
    expect(r).toEqual({ ok: true, hetu: { code: "131052-308T", birthDate: "1952-10-13", testRange: false } });
  });

  it("normalises spaces, lower case and dash variants", () => {
    expect(parseHetu(" 131052 – 308t ").ok).toBe(true);
  });

  it("rejects a wrong check character", () => {
    expect(parseHetu("131052-308U")).toEqual({ ok: false, reason: "check character does not match" });
  });

  it("rejects impossible dates and bad format", () => {
    expect(parseHetu("310252-308T")).toEqual({ ok: false, reason: "no such date" });
    expect(parseHetu("Matti Virtanen")).toEqual({ ok: false, reason: "wrong format" });
    expect(parseHetu("13105-2308T").ok).toBe(false);
  });

  it("builds valid test-range codes for both centuries", () => {
    for (const [date, n] of [["1955-03-04", 901], ["2001-12-31", 999]] as const) {
      const r = parseHetu(makeHetu(date, n));
      expect(r.ok && r.hetu.birthDate).toBe(date);
      expect(r.ok && r.hetu.testRange).toBe(true);
    }
  });

  it("masks everything after the century sign", () => {
    expect(maskHetu("131052-308T")).toBe("131052-****");
  });
});
