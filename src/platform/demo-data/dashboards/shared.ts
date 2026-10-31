import { formatMoney, money, type CurrencyCode, type Money } from "@/platform/domain/money";

// DEMONSTRATION DATA HELPERS. Every amount in /demo is an invented figure held
// as integer minor units, exactly as the real platform will store money.

/** Whole currency units → Money (integer arithmetic only). */
export function whole(units: number, currency: CurrencyCode = "USD"): Money {
  if (!Number.isInteger(units)) throw new RangeError("Demo amounts are whole units");
  return money(units * 100, currency);
}

export const usd = (units: number) => whole(units, "USD");

export function fmt(value: Money): string {
  return formatMoney(value, "en-GB");
}

/** Chart formatter for values already expressed in whole units. */
export const fmtUsdUnits = (n: number) => `USD ${n.toLocaleString("en-GB")}`;

export const DEMO_NOTE = "Demonstration figures — invented, not real prices, fees or payments.";

/** Fictional organisation names are always marked so they cannot be mistaken for real ones. */
export const fictional = (name: string) => `${name} (fictional)`;
