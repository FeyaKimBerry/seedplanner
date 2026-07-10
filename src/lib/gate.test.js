import { describe, it, expect } from "vitest";
import { normalizeCode, parseValidCodes, matchesCode } from "./gate.js";

describe("normalizeCode", () => {
  it("strips whitespace and separators and upper-cases", () => {
    expect(normalizeCode("  seed-planner ")).toBe("SEEDPLANNER");
    expect(normalizeCode("SEED_PLANNER")).toBe("SEEDPLANNER");
    expect(normalizeCode("seed planner")).toBe("SEEDPLANNER");
    expect(normalizeCode("#SEED.PLANNER#")).toBe("SEEDPLANNER");
  });
  it("handles null / undefined / numbers without throwing", () => {
    expect(normalizeCode(null)).toBe("");
    expect(normalizeCode(undefined)).toBe("");
    expect(normalizeCode(123)).toBe("123");
  });
});

describe("parseValidCodes", () => {
  it("splits a comma-separated list and normalizes each", () => {
    expect(parseValidCodes("old-code, NEW code ")).toEqual(["OLDCODE", "NEWCODE"]);
  });
  it("falls back to the default when the env value is blank", () => {
    expect(parseValidCodes("", "DEFAULT")).toEqual(["DEFAULT"]);
    expect(parseValidCodes("   ", "default")).toEqual(["DEFAULT"]);
    expect(parseValidCodes(undefined, "seed")).toEqual(["SEED"]);
  });
  it("drops empty entries from trailing/duplicate commas", () => {
    expect(parseValidCodes("a,,b,")).toEqual(["A", "B"]);
  });
  it("supports a rotation window with old + new codes", () => {
    const codes = parseValidCodes("OLDPDF2024, NEWPDF2025");
    expect(matchesCode("oldpdf 2024", codes)).toBe(true);
    expect(matchesCode("NEW-PDF-2025", codes)).toBe(true);
  });
});

describe("matchesCode", () => {
  const valid = parseValidCodes("SEEDPLANNER");
  it("accepts the code regardless of user formatting", () => {
    expect(matchesCode("seedplanner", valid)).toBe(true);
    expect(matchesCode("  Seed-Planner ", valid)).toBe(true);
    expect(matchesCode("SEED PLANNER", valid)).toBe(true);
  });
  it("rejects a wrong code", () => {
    expect(matchesCode("nope", valid)).toBe(false);
  });
  it("rejects empty input even against a valid list", () => {
    expect(matchesCode("", valid)).toBe(false);
    expect(matchesCode("   ", valid)).toBe(false);
  });
});
