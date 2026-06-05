// Shared types for the personal dashboard.
// Keys are dates in "YYYY-MM-DD" form so they sort and key cleanly.

export type ISODate = string; // YYYY-MM-DD

export type TaskTag = "personal" | "2ko" | "glory" | "book" | "guitar";
export const TASK_TAGS: { id: TaskTag; label: string; tone: string }[] = [
  { id: "personal", label: "Personal", tone: "rgba(216,178,90,0.92)" },
  { id: "2ko", label: "2KO / Darren", tone: "rgba(154,147,139,0.92)" },
  { id: "glory", label: "All The Glory", tone: "rgba(241,215,166,0.92)" },
  { id: "book", label: "Book", tone: "rgba(204,168,140,0.92)" },
  { id: "guitar", label: "Guitar", tone: "rgba(180,160,200,0.92)" },
];

export interface Task {
  id: string;
  title: string;
  tag: TaskTag;
  done: boolean;
  createdAt: string;
  completedAt?: string;
  due?: ISODate;
  notes?: string;
}

// Daily habit / discipline log.
// noPorn / cleanFeed flip to "true" when the user has stayed clean for that day.
// allowed flags exist for things they explicitly allow on a given day
// (e.g. social media is allowed twice a week, trading charts once a month).
export interface DayHabits {
  bibleRead: boolean;
  noPorn: boolean;
  noSocialMedia: boolean;
  noTradingCharts: boolean;
  socialMediaAllowed?: boolean; // user marked today as an "allowed" social media day
  tradingChartsAllowed?: boolean; // user marked today as an "allowed" trading charts day
  gym: boolean;
  worship: boolean;
  phoneOffAt7: boolean;
  guitar: boolean;
  bookWriting: boolean;
}

export const HABIT_FIELDS: { id: keyof DayHabits; label: string; positive: boolean }[] = [
  { id: "bibleRead", label: "Read the Word", positive: true },
  { id: "noPorn", label: "Stayed clean", positive: true },
  { id: "noSocialMedia", label: "No social media", positive: true },
  { id: "noTradingCharts", label: "No trading charts", positive: true },
  { id: "gym", label: "Gym (3pm)", positive: true },
  { id: "worship", label: "Evening worship", positive: true },
  { id: "phoneOffAt7", label: "Phone off by 7pm", positive: true },
  { id: "guitar", label: "Guitar practice", positive: true },
  { id: "bookWriting", label: "Book writing", positive: true },
];

export function emptyHabits(): DayHabits {
  return {
    bibleRead: false,
    noPorn: false,
    noSocialMedia: false,
    noTradingCharts: false,
    gym: false,
    worship: false,
    phoneOffAt7: false,
    guitar: false,
    bookWriting: false,
  };
}

// One day of Bible reading — links to a chronological-plan day.
export interface BibleDayLog {
  planDay?: number; // day number in chronological plan
  passage?: string; // what was actually read (free text override)
  minutes?: number;
  learned?: string; // what I learnt
  notes?: string; // longer journal
  prayer?: string;
  verseOfTheDay?: string;
}

// Guitar practice session.
export interface GuitarSession {
  id: string;
  date: ISODate;
  minutes: number;
  focus: string; // e.g. "open chords", "Em pentatonic", "All The Glory verse 2"
  notes?: string;
}

// Book writing session.
export interface BookSession {
  id: string;
  date: ISODate;
  minutes: number;
  words: number;
  chapter?: string;
  notes?: string;
}

export interface BookMeta {
  title: string;
  subtitle?: string;
  targetWords: number;
  chapters: { id: string; title: string; status: "todo" | "drafting" | "done"; words?: number; notes?: string }[];
}

// User settings that govern rules (allowed social-media days etc).
export interface Settings {
  startDate: ISODate; // when the chronological plan started, used to compute current day
  startPlanDay: number; // plan day on startDate (so user can re-anchor)
  socialMediaPerWeek: number; // default 2
  tradingChartsPerMonth: number; // default 1
  phoneOffHour: number; // 19 = 7pm
  bibleReadingHour: number; // 7
  goals: {
    bibleStreakTarget: number; // days
    cleanStreakTarget: number;
    bookWordTarget: number;
    guitarMinutesPerWeek: number;
  };
}

export function defaultSettings(): Settings {
  return {
    // User said: "I am on March 4th" on 2026-06-05 — they mean Mar 4 in their reading.
    // We anchor today to their stated plan day (63 = Numbers 21-22 in our plan).
    startDate: new Date().toISOString().slice(0, 10),
    startPlanDay: 63,
    socialMediaPerWeek: 2,
    tradingChartsPerMonth: 1,
    phoneOffHour: 19,
    bibleReadingHour: 7,
    goals: {
      bibleStreakTarget: 30,
      cleanStreakTarget: 90,
      bookWordTarget: 60_000,
      guitarMinutesPerWeek: 180,
    },
  };
}

// The full root state stored in localStorage.
export interface DashboardState {
  tasks: Task[];
  habits: Record<ISODate, DayHabits>;
  bibleLogs: Record<ISODate, BibleDayLog>;
  guitar: GuitarSession[];
  book: { meta: BookMeta; sessions: BookSession[] };
  settings: Settings;
  rewardsClaimed: Record<string, ISODate>;
}

export function emptyState(): DashboardState {
  return {
    tasks: [],
    habits: {},
    bibleLogs: {},
    guitar: [],
    book: {
      meta: {
        title: "Untitled Manuscript",
        targetWords: 60_000,
        chapters: [
          { id: "ch-1", title: "Chapter 1", status: "drafting", words: 0 },
        ],
      },
      sessions: [],
    },
    settings: defaultSettings(),
    rewardsClaimed: {},
  };
}
