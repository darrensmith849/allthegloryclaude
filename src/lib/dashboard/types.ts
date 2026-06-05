// Shared types for the personal dashboard.
// Keys are dates in "YYYY-MM-DD" form so they sort and key cleanly.

export type ISODate = string; // YYYY-MM-DD

// ─── Tags ──────────────────────────────────────────────────────────
// Users can add their own tags via Settings; the five preset tags are
// always available so old saved tasks keep their label/colour.
export interface TaskTag {
  id: string;
  label: string;
  tone: string; // any valid CSS colour
}

export const DEFAULT_TASK_TAGS: TaskTag[] = [
  { id: "personal", label: "Personal", tone: "rgba(216,178,90,0.92)" },
  { id: "2ko", label: "2KO / Darren", tone: "rgba(154,147,139,0.92)" },
  { id: "glory", label: "All The Glory", tone: "rgba(241,215,166,0.92)" },
  { id: "book", label: "Book", tone: "rgba(204,168,140,0.92)" },
  { id: "guitar", label: "Guitar", tone: "rgba(180,160,200,0.92)" },
];

export interface Task {
  id: string;
  title: string;
  tag: string; // tag id — resolved against settings.taskTags + DEFAULT_TASK_TAGS
  done: boolean;
  createdAt: string;
  completedAt?: string;
  due?: ISODate;
  notes?: string;
}

// ─── Habits ───────────────────────────────────────────────────────
// Each tracked habit is just a key + label. The day record is a flat map
// of habit-id → boolean. Switching to a string-keyed map (vs. fixed
// fields) lets the user add their own habits without code changes.
export interface HabitDef {
  id: string; // stable key, e.g. "bibleRead"
  label: string; // user-facing label
  showOnSchedule?: boolean; // surfaced as a "Mark" button on the Today schedule
}

export type DayHabits = Record<string, boolean>;

// Built-in habit set — kept as defaults so first-load users see something useful.
export const DEFAULT_HABITS: HabitDef[] = [
  { id: "bibleRead", label: "Read the Word", showOnSchedule: true },
  { id: "noPorn", label: "Stayed clean" },
  { id: "noSocialMedia", label: "No social media" },
  { id: "noTradingCharts", label: "No trading charts" },
  { id: "gym", label: "Gym", showOnSchedule: true },
  { id: "worship", label: "Evening worship", showOnSchedule: true },
  { id: "phoneOffAt7", label: "Phone off by 7pm", showOnSchedule: true },
  { id: "guitar", label: "Guitar practice", showOnSchedule: true },
  { id: "bookWriting", label: "Book writing" },
];

// Special-purpose flags that aren't toggled by the user as normal habits —
// these are quota-style "allowed-day" markers.
export const ALLOWED_FLAGS = {
  socialMedia: "_socialMediaAllowed",
  tradingCharts: "_tradingChartsAllowed",
} as const;

export function emptyHabits(): DayHabits {
  return {};
}

// ─── Schedule ─────────────────────────────────────────────────────
export interface ScheduleRow {
  id: string;
  time: string; // display label, e.g. "7:00"
  hour: number; // 24h fractional, e.g. 18.5 = 6:30pm — used for "now" highlight
  title: string;
  sub: string;
  habitId?: string; // optional — when set, surfaces a Mark button + ticks the habit
}

export const DEFAULT_SCHEDULE: ScheduleRow[] = [
  { id: "s-word", time: "7:00", hour: 7, title: "The Word", sub: "Chronological reading + journal", habitId: "bibleRead" },
  { id: "s-2ko", time: "9:00", hour: 9, title: "2KO with Darren", sub: "Deep work block" },
  { id: "s-coffee", time: "10:00", hour: 10, title: "Coffee break", sub: "Stand up, water, breathe" },
  { id: "s-lunch", time: "12:00", hour: 12, title: "Lunch", sub: "Eat away from the screen" },
  { id: "s-afternoon", time: "13:00", hour: 13, title: "Afternoon work", sub: "2KO continued" },
  { id: "s-gym", time: "15:00", hour: 15, title: "Gym", sub: "Train hard.", habitId: "gym" },
  { id: "s-creative", time: "17:00", hour: 17, title: "Guitar / writing", sub: "Practice or book session", habitId: "guitar" },
  { id: "s-worship", time: "18:30", hour: 18.5, title: "Evening worship", sub: "Worship before phone off", habitId: "worship" },
  { id: "s-phone-off", time: "19:00", hour: 19, title: "Phone off", sub: "No screens until tomorrow", habitId: "phoneOffAt7" },
];

// ─── Guitar weekly plan ───────────────────────────────────────────
export interface GuitarWeekRow {
  id: string;
  day: string; // "Mon".."Sun"
  focus: string;
  drill: string;
  minutes: number;
}

export const DEFAULT_GUITAR_WEEK: GuitarWeekRow[] = [
  { id: "gw-mon", day: "Mon", focus: "Open chords + clean transitions", drill: "G-C-D-Em loop, 4 strums each, then 2, then 1. Metronome 80 -> 100.", minutes: 25 },
  { id: "gw-tue", day: "Tue", focus: "Worship rhythm - strumming patterns", drill: "D-DU-UDU on a I-V-vi-IV in G. Sing while playing.", minutes: 30 },
  { id: "gw-wed", day: "Wed", focus: "Scales - E minor pentatonic", drill: "Box 1 ascending/descending, alternate picking, 60 -> 90 bpm.", minutes: 25 },
  { id: "gw-thu", day: "Thu", focus: "Songs - All The Glory set", drill: "Play three songs from the album front to back without a chart.", minutes: 35 },
  { id: "gw-fri", day: "Fri", focus: "Theory & ear", drill: "Major/minor by ear, intervals on the 6th string, name the chord.", minutes: 20 },
  { id: "gw-sat", day: "Sat", focus: "Writing - riff / hook", drill: "30 minutes of capture - no editing. Voice-memo every idea.", minutes: 40 },
  { id: "gw-sun", day: "Sun", focus: "Rest / worship", drill: "Quiet play. No metronome, just worship.", minutes: 20 },
];

// ─── Bible reading log ─────────────────────────────────────────────
export interface BibleDayLog {
  planDay?: number;
  passage?: string;
  minutes?: number;
  learned?: string;
  notes?: string;
  prayer?: string;
  verseOfTheDay?: string;
}

// ─── Sessions ─────────────────────────────────────────────────────
export interface GuitarSession {
  id: string;
  date: ISODate;
  minutes: number;
  focus: string;
  notes?: string;
}

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

// ─── Settings ─────────────────────────────────────────────────────
export interface Settings {
  greetingName: string;
  startDate: ISODate;
  startPlanDay: number;
  socialMediaPerWeek: number;
  tradingChartsPerMonth: number;
  phoneOffHour: number;
  bibleReadingHour: number;
  schedule: ScheduleRow[];
  habits: HabitDef[];
  guitarWeek: GuitarWeekRow[];
  taskTags: TaskTag[]; // user-added; concatenated with DEFAULT_TASK_TAGS
  planOverrides: Record<number, string>; // planDay -> passage override
  goals: {
    bibleStreakTarget: number;
    cleanStreakTarget: number;
    bookWordTarget: number;
    guitarMinutesPerWeek: number;
  };
}

export function defaultSettings(): Settings {
  return {
    greetingName: "Daniel",
    startDate: new Date().toISOString().slice(0, 10),
    startPlanDay: 63,
    socialMediaPerWeek: 2,
    tradingChartsPerMonth: 1,
    phoneOffHour: 19,
    bibleReadingHour: 7,
    schedule: DEFAULT_SCHEDULE,
    habits: DEFAULT_HABITS,
    guitarWeek: DEFAULT_GUITAR_WEEK,
    taskTags: [],
    planOverrides: {},
    goals: {
      bibleStreakTarget: 30,
      cleanStreakTarget: 90,
      bookWordTarget: 60_000,
      guitarMinutesPerWeek: 180,
    },
  };
}

// Resolve the active list of task tags = defaults + user-added (de-duped by id).
export function resolveTaskTags(settings: Settings): TaskTag[] {
  const seen = new Set<string>();
  const out: TaskTag[] = [];
  for (const t of [...DEFAULT_TASK_TAGS, ...(settings.taskTags ?? [])]) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    out.push(t);
  }
  return out;
}

// Resolve the active habits list — falls back to defaults for fresh installs.
export function resolveHabits(settings: Settings): HabitDef[] {
  return settings.habits?.length ? settings.habits : DEFAULT_HABITS;
}

export function resolveSchedule(settings: Settings): ScheduleRow[] {
  return settings.schedule?.length ? settings.schedule : DEFAULT_SCHEDULE;
}

export function resolveGuitarWeek(settings: Settings): GuitarWeekRow[] {
  return settings.guitarWeek?.length ? settings.guitarWeek : DEFAULT_GUITAR_WEEK;
}

// ─── Root state ───────────────────────────────────────────────────
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
        chapters: [{ id: "ch-1", title: "Chapter 1", status: "drafting", words: 0 }],
      },
      sessions: [],
    },
    settings: defaultSettings(),
    rewardsClaimed: {},
  };
}
