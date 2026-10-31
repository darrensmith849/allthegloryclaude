import { add, allocate, applyBasisPoints, money, subtract, sum, type CurrencyCode, type Money } from "./money";

// Project settlement: from client receipts to company commission and
// transparent creative payout statements (MASTER_PLAN §5). Commission is
// configured per contract, never hard-coded.

export type CommissionModel =
  | { kind: "percentage"; bps: number }
  | { kind: "fixed-margin"; amount: Money }
  | { kind: "introduction-fee"; amount: Money }
  | { kind: "percentage-with-minimum"; bps: number; minimum: Money };

export interface Participant {
  creativeId: string;
  /** Share of the creative pool, as weights (e.g. split-sheet or fee shares). */
  weight: number;
}

export interface SettlementInput {
  currency: CurrencyCode;
  /** Amounts received from the client for this project, net of refunds. */
  receipts: Money[];
  /** Approved, receipted project costs paid by the company (studio hire, session fees, etc.). */
  approvedCosts: Money[];
  commission: CommissionModel;
  participants: Participant[];
}

export interface PayoutLine {
  creativeId: string;
  amount: Money;
}

export interface Settlement {
  grossReceipts: Money;
  approvedCosts: Money;
  netBeforeCommission: Money;
  commission: Money;
  creativePool: Money;
  payouts: PayoutLine[];
}

export class SettlementError extends Error {}

export function commissionFor(model: CommissionModel, base: Money): Money {
  switch (model.kind) {
    case "percentage":
      return applyBasisPoints(base, model.bps);
    case "fixed-margin":
    case "introduction-fee":
      if (model.amount.currency !== base.currency) throw new SettlementError("Commission currency differs from project currency");
      return model.amount;
    case "percentage-with-minimum": {
      const pct = applyBasisPoints(base, model.bps);
      if (model.minimum.currency !== base.currency) throw new SettlementError("Commission currency differs from project currency");
      return pct.amountMinor >= model.minimum.amountMinor ? pct : model.minimum;
    }
  }
}

export function settleProject(input: SettlementInput): Settlement {
  const { currency } = input;
  if (input.participants.length === 0) throw new SettlementError("A settlement needs at least one participant");

  const grossReceipts = sum(input.receipts, currency);
  const approvedCosts = sum(input.approvedCosts, currency);
  const netBeforeCommission = subtract(grossReceipts, approvedCosts);
  if (netBeforeCommission.amountMinor < 0) throw new SettlementError("Approved costs exceed receipts; escalate before settlement");

  const commission = commissionFor(input.commission, netBeforeCommission);
  if (commission.amountMinor > netBeforeCommission.amountMinor) throw new SettlementError("Commission exceeds the amount available");

  const creativePool = subtract(netBeforeCommission, commission);
  const shares = allocate(creativePool, input.participants.map((p) => p.weight));
  const payouts = input.participants.map((p, i) => ({ creativeId: p.creativeId, amount: shares[i] ?? money(0, currency) }));

  // Invariant: every received minor unit is accounted for.
  const accounted = payouts.reduce((total, line) => add(total, line.amount), add(approvedCosts, commission));
  if (accounted.amountMinor !== grossReceipts.amountMinor) throw new SettlementError("Settlement does not balance");

  return { grossReceipts, approvedCosts, netBeforeCommission, commission, creativePool, payouts };
}

/** Split-sheet shares must total exactly 100 % (10 000 bps) per right type. */
export function validateSplitSheet(shares: { party: string; bps: number }[]): { ok: true } | { ok: false; reason: string } {
  if (shares.length === 0) return { ok: false, reason: "Add at least one party" };
  if (shares.some((s) => !Number.isInteger(s.bps) || s.bps <= 0)) return { ok: false, reason: "Every share must be a positive whole number of basis points" };
  const parties = new Set(shares.map((s) => s.party));
  if (parties.size !== shares.length) return { ok: false, reason: "Each party may appear once" };
  const total = shares.reduce((a, s) => a + s.bps, 0);
  if (total !== 10_000) return { ok: false, reason: `Shares total ${(total / 100).toFixed(2)} %; they must total 100 %` };
  return { ok: true };
}
