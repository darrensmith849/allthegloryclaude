// "Keep private until next year": the owner's notes on the days from..to
// (e.g. the New Testament he's reading on his own) stay out of the shared
// study until the same date comes round a year later - then each day shows
// again on its own date. Stored as study_settings "hold".

export interface Hold {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function parseHold(raw: unknown): Hold | null {
  try {
    const h = (typeof raw === "string" ? (raw ? JSON.parse(raw) : null) : raw) as Partial<Hold> | null;
    if (h && typeof h.from === "string" && typeof h.to === "string" && DAY.test(h.from) && DAY.test(h.to) && h.from <= h.to) {
      return { from: h.from, to: h.to };
    }
  } catch {
    // not a hold
  }
  return null;
}

// The date a held day shows again (its date next year), or null if not held.
export function heldUntil(day: string, hold: Hold | null): string | null {
  if (!hold || day < hold.from || day > hold.to) return null;
  return `${Number(day.slice(0, 4)) + 1}${day.slice(4)}`;
}

// Today in South Africa, where the study is written.
export const studyToday = () => new Date(Date.now() + 2 * 3_600_000).toISOString().slice(0, 10);

export const isHeld = (day: string, hold: Hold | null, today = studyToday()) => {
  const until = heldUntil(day, hold);
  return Boolean(until && today < until);
};
