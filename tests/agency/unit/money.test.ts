import { describe, expect, it } from "vitest";
import { add, allocate, applyBasisPoints, formatMoney, money, sum } from "@/platform/domain/money";

describe("money", () => {
  it("rejects non-integer minor units", () => {
    expect(() => money(10.5, "USD")).toThrow(RangeError);
  });

  it("refuses to mix currencies", () => {
    expect(() => add(money(100, "USD"), money(100, "ZAR"))).toThrow(TypeError);
  });

  it("applies basis points with half-up rounding", () => {
    expect(applyBasisPoints(money(10_001, "USD"), 1_500).amountMinor).toBe(1_500);
    expect(applyBasisPoints(money(10_003, "USD"), 1_500).amountMinor).toBe(1_500);
    expect(applyBasisPoints(money(10_004, "USD"), 1_250).amountMinor).toBe(1_251);
    expect(() => applyBasisPoints(money(100, "USD"), 10_001)).toThrow(RangeError);
  });

  it("allocates without losing or inventing a minor unit", () => {
    const parts = allocate(money(10_000, "USD"), [1, 1, 1]);
    expect(parts.map((p) => p.amountMinor)).toEqual([3_334, 3_333, 3_333]);
    expect(sum(parts, "USD").amountMinor).toBe(10_000);

    const weighted = allocate(money(99_999, "ZAR"), [5_000, 3_000, 2_000]);
    expect(sum(weighted, "ZAR").amountMinor).toBe(99_999);
  });

  it("rejects invalid weights", () => {
    expect(() => allocate(money(100, "USD"), [0, 0])).toThrow(RangeError);
    expect(() => allocate(money(100, "USD"), [-1, 2])).toThrow(RangeError);
  });

  it("formats with an explicit currency code", () => {
    expect(formatMoney(money(250_000, "USD"))).toContain("USD");
  });
});
