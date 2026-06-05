// Daily reminder imagery + quotes that scroll into the Today card.
// Filenames live in /public/dashboard/reminders.

export interface Reminder {
  id: string;
  src: string;
  quote: string;
  short: string; // for the smaller Today card
}

export const REMINDERS: Reminder[] = [
  {
    id: "obedience",
    src: "/atg-reminders/reminder-01.webp",
    quote:
      "If you truly understood how many lives are connected to your obedience to God, you would stop treating your walk with Him casually.",
    short: "Lives are connected to your obedience.",
  },
  {
    id: "consecration",
    src: "/atg-reminders/reminder-02.webp",
    quote:
      "Your consecration is not just about you — there are families waiting for your prayers, generations tied to your obedience, and destinies connected to your surrender.",
    short: "Generations are tied to your surrender.",
  },
  {
    id: "faithfulness",
    src: "/atg-reminders/reminder-03.webp",
    quote:
      "Some people will find healing because you stayed faithful. Some will discover purpose because you chose purity over compromise. Some battles will be won in the spirit because you decided to remain close to God when it was inconvenient.",
    short: "Faithfulness changes people you'll never meet.",
  },
  {
    id: "devotion",
    src: "/atg-reminders/reminder-04.webp",
    quote:
      "Never underestimate the weight of your devotion. A careless spiritual life can delay what God wants to do through you, but a consecrated life can become a doorway for transformation in entire nations.",
    short: "Your devotion carries weight.",
  },
  {
    id: "sacrifice",
    src: "/atg-reminders/reminder-05.webp",
    quote:
      "What feels like a private sacrifice today may become public deliverance for many tomorrow.",
    short: "Private sacrifice becomes public deliverance.",
  },
];

// Deterministic pick for a given date — so "today's reminder" is stable through the day.
export function reminderForDate(iso: string): Reminder {
  const [y, m, d] = iso.split("-").map(Number);
  // Days-since-epoch keeps it sequential and the same on every load that day.
  const days = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  return REMINDERS[((days % REMINDERS.length) + REMINDERS.length) % REMINDERS.length];
}
