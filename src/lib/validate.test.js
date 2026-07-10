import { describe, it, expect } from "vitest";
import { isValidState, isPlainObject } from "./validate.js";

describe("isPlainObject", () => {
  it("accepts plain objects, rejects arrays and null", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject("x")).toBe(false);
    expect(isPlainObject(3)).toBe(false);
  });
});

describe("isValidState", () => {
  it("accepts a minimal empty object (all fields missing = forward-compatible)", () => {
    expect(isValidState({})).toBe(true);
  });

  it("accepts a full, well-shaped state", () => {
    expect(isValidState({
      settings: { currency: "AUD", startingSavings: 25000, projectionYears: 30, retirementTarget: null },
      income: [], expenses: [], plans: [], debts: [], assets: [],
      emergency: { target: 0, current: 0 },
    })).toBe(true);
  });

  it("rejects non-objects and arrays at the top level", () => {
    expect(isValidState(null)).toBe(false);
    expect(isValidState(undefined)).toBe(false);
    expect(isValidState([])).toBe(false);
    expect(isValidState("{}")).toBe(false);
    expect(isValidState(42)).toBe(false);
  });

  it("rejects a list field that is present but not an array", () => {
    expect(isValidState({ income: {} })).toBe(false);
    expect(isValidState({ expenses: "nope" })).toBe(false);
    expect(isValidState({ plans: 5 })).toBe(false);
  });

  it("accepts legacy oneOffs/goals arrays (pre-migration blobs)", () => {
    expect(isValidState({ oneOffs: [], goals: [] })).toBe(true);
    expect(isValidState({ oneOffs: {} })).toBe(false);
  });

  it("rejects settings that is present but not an object", () => {
    expect(isValidState({ settings: [] })).toBe(false);
    expect(isValidState({ settings: "x" })).toBe(false);
  });

  it("rejects a numeric setting that is present but not a number", () => {
    expect(isValidState({ settings: { startingSavings: "1000" } })).toBe(false);
    expect(isValidState({ settings: { projectionYears: null } })).toBe(true); // null allowed (missing-ish)
    expect(isValidState({ settings: { returnExpected: 6 } })).toBe(true);
  });

  it("allows retirementTarget to be null (auto) or a number", () => {
    expect(isValidState({ settings: { retirementTarget: null } })).toBe(true);
    expect(isValidState({ settings: { retirementTarget: 500000 } })).toBe(true);
  });

  it("rejects emergency that is present but not an object", () => {
    expect(isValidState({ emergency: [] })).toBe(false);
  });
});
