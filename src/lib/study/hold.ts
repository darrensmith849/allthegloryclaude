// Daniel's New Testament notes from 2026 (24 September on): kept out of the
// shared study until a member's own reading reaches each day - so they
// carry over to the group's Day pages - except for the members Daniel lets
// read them now (allow). Never shown on the public site. Stored as
// study_settings "hold".

export interface Hold {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  allow?: string[]; // member ids who may read them now
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function parseHold(raw: unknown): Hold | null {
  try {
    const h = (typeof raw === "string" ? (raw ? JSON.parse(raw) : null) : raw) as Partial<Hold> | null;
    if (h && typeof h.from === "string" && typeof h.to === "string" && DAY.test(h.from) && DAY.test(h.to) && h.from <= h.to) {
      const allow = Array.isArray(h.allow) ? [...new Set(h.allow.filter((x): x is string => typeof x === "string" && x.length <= 64))].slice(0, 100) : [];
      return { from: h.from, to: h.to, ...(allow.length ? { allow } : {}) };
    }
  } catch {
    // not a hold
  }
  return null;
}

// Is the day one of the held ones?
export const inHold = (day: string, hold: Hold | null) => Boolean(hold && day >= hold.from && day <= hold.to);

// Hidden from this reader? Visitors never see held days; a member sees one
// once their reading reaches it (reach = the page they're up to), or now
// if Daniel lets them.
export function hiddenByHold(day: string, hold: Hold | null, reader?: { id: string; reach: string } | null): boolean {
  if (!hold || !inHold(day, hold)) return false;
  if (!reader) return true;
  if (hold.allow?.includes(reader.id)) return false;
  return day > reader.reach;
}

// Today in South Africa, where the study is written.
export const studyToday = () => new Date(Date.now() + 2 * 3_600_000).toISOString().slice(0, 10);
