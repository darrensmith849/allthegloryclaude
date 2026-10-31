// Money is held as integer minor units with an explicit ISO-4217 currency.
// Never use floating point for amounts.

export type CurrencyCode = "USD" | "ZAR" | "ZWG" | "GBP" | "EUR";

export interface Money {
  readonly amountMinor: number;
  readonly currency: CurrencyCode;
}

export function money(amountMinor: number, currency: CurrencyCode): Money {
  if (!Number.isSafeInteger(amountMinor)) throw new RangeError("Money must be an integer number of minor units");
  return { amountMinor, currency };
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) throw new TypeError(`Currency mismatch: ${a.currency} vs ${b.currency}`);
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountMinor + b.amountMinor, a.currency);
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountMinor - b.amountMinor, a.currency);
}

export function sum(items: Money[], currency: CurrencyCode): Money {
  return items.reduce((total, item) => add(total, item), money(0, currency));
}

/** Basis points: 10 000 bps = 100 %. Rates are configured per contract. */
export function applyBasisPoints(value: Money, bps: number): Money {
  if (!Number.isInteger(bps) || bps < 0 || bps > 10_000) throw new RangeError("Basis points must be an integer from 0 to 10 000");
  // Round half away from zero to the nearest minor unit.
  return money(Math.round((value.amountMinor * bps) / 10_000), value.currency);
}

/**
 * Split an amount by weights without losing or inventing a single minor unit.
 * Remainders go to the largest fractional parts first (largest-remainder method).
 */
export function allocate(value: Money, weights: number[]): Money[] {
  if (weights.length === 0) return [];
  if (weights.some((w) => w < 0 || !Number.isFinite(w))) throw new RangeError("Weights must be non-negative numbers");
  const total = weights.reduce((a, b) => a + b, 0);
  if (total === 0) throw new RangeError("Weights must not all be zero");

  const exact = weights.map((w) => (value.amountMinor * w) / total);
  const floored = exact.map((x) => Math.floor(x));
  let remainder = value.amountMinor - floored.reduce((a, b) => a + b, 0);
  const order = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (remainder <= 0) break;
    floored[i] = (floored[i] ?? 0) + 1;
    remainder -= 1;
  }
  return floored.map((amountMinor) => money(amountMinor, value.currency));
}

export function formatMoney(value: Money, locale = "en-ZA"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: value.currency, currencyDisplay: "code", maximumFractionDigits: 2, minimumFractionDigits: value.amountMinor % 100 === 0 ? 0 : 2 }).format(value.amountMinor / 100);
}
