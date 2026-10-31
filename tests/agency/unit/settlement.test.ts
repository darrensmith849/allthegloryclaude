import { describe, expect, it } from "vitest";
import { money } from "@/platform/domain/money";
import { commissionFor, settleProject, SettlementError, validateSplitSheet } from "@/platform/domain/settlement";

describe("project settlement", () => {
  const base = {
    currency: "USD" as const,
    receipts: [money(150_000, "USD"), money(150_000, "USD")],
    approvedCosts: [money(20_000, "USD")],
    participants: [
      { creativeId: "art_a", weight: 60 },
      { creativeId: "art_b", weight: 40 },
    ],
  };

  it("deducts approved costs, then a per-contract percentage commission, then splits the pool", () => {
    const s = settleProject({ ...base, commission: { kind: "percentage", bps: 2_000 } });
    expect(s.grossReceipts.amountMinor).toBe(300_000);
    expect(s.netBeforeCommission.amountMinor).toBe(280_000);
    expect(s.commission.amountMinor).toBe(56_000);
    expect(s.creativePool.amountMinor).toBe(224_000);
    expect(s.payouts.map((p) => p.amount.amountMinor)).toEqual([134_400, 89_600]);
  });

  it("always balances to the minor unit", () => {
    const s = settleProject({ ...base, receipts: [money(100_001, "USD")], approvedCosts: [], participants: [1, 1, 1].map((w, i) => ({ creativeId: `c${i}`, weight: w })), commission: { kind: "percentage", bps: 1_750 } });
    const total = s.payouts.reduce((a, p) => a + p.amount.amountMinor, 0) + s.commission.amountMinor + s.approvedCosts.amountMinor;
    expect(total).toBe(100_001);
  });

  it("supports fixed margins and percentage-with-minimum", () => {
    expect(commissionFor({ kind: "fixed-margin", amount: money(30_000, "USD") }, money(200_000, "USD")).amountMinor).toBe(30_000);
    expect(commissionFor({ kind: "percentage-with-minimum", bps: 1_000, minimum: money(25_000, "USD") }, money(200_000, "USD")).amountMinor).toBe(25_000);
    expect(commissionFor({ kind: "percentage-with-minimum", bps: 1_000, minimum: money(5_000, "USD") }, money(200_000, "USD")).amountMinor).toBe(20_000);
  });

  it("escalates instead of settling when costs exceed receipts", () => {
    expect(() => settleProject({ ...base, approvedCosts: [money(400_000, "USD")], commission: { kind: "percentage", bps: 1_000 } })).toThrow(SettlementError);
  });

  it("refuses a commission larger than the amount available", () => {
    expect(() => settleProject({ ...base, commission: { kind: "fixed-margin", amount: money(900_000, "USD") } })).toThrow(SettlementError);
  });

  it("refuses commission in a different currency", () => {
    expect(() => settleProject({ ...base, commission: { kind: "introduction-fee", amount: money(1_000, "ZAR") } })).toThrow(SettlementError);
  });
});

describe("split sheets", () => {
  it("must total exactly 100 %", () => {
    expect(validateSplitSheet([{ party: "a", bps: 5_000 }, { party: "b", bps: 5_000 }])).toEqual({ ok: true });
    expect(validateSplitSheet([{ party: "a", bps: 5_000 }, { party: "b", bps: 4_000 }]).ok).toBe(false);
  });

  it("rejects duplicates, zero shares and empty sheets", () => {
    expect(validateSplitSheet([]).ok).toBe(false);
    expect(validateSplitSheet([{ party: "a", bps: 5_000 }, { party: "a", bps: 5_000 }]).ok).toBe(false);
    expect(validateSplitSheet([{ party: "a", bps: 10_000 }, { party: "b", bps: 0 }]).ok).toBe(false);
  });
});
