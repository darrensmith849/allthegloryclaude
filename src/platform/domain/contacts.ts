// Contact deduplication keys (MASTER_PLAN §13). Normalisation is deliberately
// conservative: we never strip "+tags" or dots from mailbox names, because
// different providers treat them differently and merging two real people is
// worse than keeping a duplicate for manual review.

export function normaliseEmail(input: string): string {
  return input.normalize("NFKC").trim().toLowerCase();
}

/** Digits-only E.164-style key, or null when the number is unusable. */
export function normalisePhone(input: string | undefined | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const digits = trimmed.replace(/[^\d]/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return trimmed.startsWith("+") || trimmed.startsWith("00") ? `+${digits.replace(/^00/, "")}` : null;
}

export interface ContactKey {
  email: string;
  phone: string | null;
}

export function contactKey(email: string, phone?: string | null): ContactKey {
  return { email: normaliseEmail(email), phone: normalisePhone(phone) };
}
