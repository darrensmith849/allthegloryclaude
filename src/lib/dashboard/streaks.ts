import { addDays, todayISO } from "./dates";
import { DayHabits, DashboardState, ISODate, emptyHabits } from "./types";

export function getHabits(state: DashboardState, iso: ISODate): DayHabits {
  return state.habits[iso] ?? emptyHabits();
}

// "Current streak" = longest consecutive run ending today (or yesterday if today
// isn't yet logged) where the predicate is true.
export function currentStreak(
  state: DashboardState,
  predicate: (h: DayHabits) => boolean,
): number {
  let cursor = todayISO();
  let streak = 0;
  // Allow today to be "in progress" - if today isn't checked yet, start counting
  // from yesterday so a not-yet-completed day doesn't zero the streak.
  if (!predicate(getHabits(state, cursor))) {
    cursor = addDays(cursor, -1);
  }
  for (let i = 0; i < 3650; i++) {
    if (predicate(getHabits(state, cursor))) {
      streak++;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}

export function longestStreak(
  state: DashboardState,
  predicate: (h: DayHabits) => boolean,
): number {
  const keys = Object.keys(state.habits).sort();
  if (!keys.length) return 0;
  let best = 0;
  let run = 0;
  let prev: ISODate | null = null;
  for (const k of keys) {
    if (!predicate(state.habits[k])) {
      run = 0;
      prev = k;
      continue;
    }
    if (prev && addDays(prev, 1) === k) run += 1;
    else run = 1;
    if (run > best) best = run;
    prev = k;
  }
  return best;
}

// Count of days in last N where predicate was true.
export function countInLastN(
  state: DashboardState,
  n: number,
  predicate: (h: DayHabits) => boolean,
): number {
  let cursor = todayISO();
  let count = 0;
  for (let i = 0; i < n; i++) {
    if (predicate(getHabits(state, cursor))) count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

// Convenience: predicate "is habit X marked done?" - works with the new string-keyed map.
export const habitOn = (id: string) => (h: DayHabits) => Boolean(h[id]);
