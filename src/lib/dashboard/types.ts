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

// ─── Guitar course (Udemy lessons) ────────────────────────────────
export interface CourseLesson {
  id: string;
  section: string; // section identifier — "1", "2", etc.
  sectionTitle?: string;
  number: number; // running lesson number across the whole course
  title: string;
  minutes: number;
  hasResources?: boolean;
  status: "todo" | "in-progress" | "done";
  notes?: string;
}

// Seeded from the lessons the user has been showing — sections 1 & 2 so far.
// All marked done because the user's Udemy UI shows ✓ on every one.
// New lessons can be added in Settings; the plan generator picks the next
// undone ones.
export const DEFAULT_GUITAR_COURSE: CourseLesson[] = [
  // Section 1 — intro / theory foundation (33 min)
  { id: "u-1", section: "1", sectionTitle: "Foundations", number: 1, title: "There Are 12 Notes In Western Music", minutes: 3, status: "done" },
  { id: "u-2", section: "1", sectionTitle: "Foundations", number: 2, title: "Introduction to Intervals", minutes: 2, status: "done" },
  { id: "u-3", section: "1", sectionTitle: "Foundations", number: 3, title: "Intervals on the Guitar", minutes: 6, status: "done" },
  { id: "u-4", section: "1", sectionTitle: "Foundations", number: 4, title: "Different Terminology", minutes: 2, hasResources: true, status: "done" },
  { id: "u-5", section: "1", sectionTitle: "Foundations", number: 5, title: "An Introduction to the Major Scale", minutes: 3, hasResources: true, status: "done" },
  { id: "u-6", section: "1", sectionTitle: "Foundations", number: 6, title: "The Circle of 4th's", minutes: 3, hasResources: true, status: "done" },
  { id: "u-7", section: "1", sectionTitle: "Foundations", number: 7, title: "Fretboard Memorisation Pt. I", minutes: 7, status: "done" },
  { id: "u-8", section: "1", sectionTitle: "Foundations", number: 8, title: "Fretboard Memorisation Pt. II", minutes: 5, hasResources: true, status: "done" },
  { id: "u-9", section: "1", sectionTitle: "Foundations", number: 9, title: "PLAY-ALONG Circle of 4th's", minutes: 2, status: "done" },
  // Section 2 — Chords and How to Practice Them (2hr 1min, 22/28 lessons watched)
  { id: "u-10", section: "2", sectionTitle: "Chords & Practice", number: 10, title: "Diatonic Harmony Pt. I", minutes: 5, status: "done" },
  { id: "u-11", section: "2", sectionTitle: "Chords & Practice", number: 11, title: "Diatonic Harmony Pt. II", minutes: 10, status: "done" },
  { id: "u-12", section: "2", sectionTitle: "Chords & Practice", number: 12, title: "7th Chords - Root on 6th String", minutes: 9, status: "done" },
  { id: "u-13", section: "2", sectionTitle: "Chords & Practice", number: 13, title: "7th Chords - Root on 5th String", minutes: 7, status: "done" },
  { id: "u-14", section: "2", sectionTitle: "Chords & Practice", number: 14, title: "PLAY-ALONG 7th Chords - Root on 6th String", minutes: 2, status: "done" },
  { id: "u-15", section: "2", sectionTitle: "Chords & Practice", number: 15, title: "PLAY-ALONG 7th Chords - Root on 5th String", minutes: 2, status: "done" },
  { id: "u-16", section: "2", sectionTitle: "Chords & Practice", number: 16, title: "Common Chord Progressions", minutes: 5, hasResources: true, status: "done" },
  { id: "u-17", section: "2", sectionTitle: "Chords & Practice", number: 17, title: "PLAY-ALONG I vi IV V", minutes: 2, status: "done" },
  { id: "u-18", section: "2", sectionTitle: "Chords & Practice", number: 18, title: "PLAY-ALONG - I iii IV V", minutes: 2, status: "done" },
  // Lessons 19+ will be added as the user shows them (Section 2 has 28 total,
  // so 10 more from section 2 plus everything in section 3+).
];

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
  guitarCourse: CourseLesson[];
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
    guitarCourse: DEFAULT_GUITAR_COURSE,
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

export function resolveCourse(settings: Settings): CourseLesson[] {
  return settings.guitarCourse?.length ? settings.guitarCourse : DEFAULT_GUITAR_COURSE;
}

// ─── Root state ───────────────────────────────────────────────────
export interface DashboardState {
  tasks: Task[];
  habits: Record<ISODate, DayHabits>;
  // Per-day "is this schedule row done?" checks, keyed by row id.
  // Schedule rows linked to a habit don't need this — their habit field
  // already encodes their done state. This map covers the ones that don't
  // (e.g. "Coffee break", "Lunch") so every row can be ticked off and
  // counted toward the daily progress bar.
  scheduleChecks: Record<ISODate, Record<string, boolean>>;
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
    scheduleChecks: {},
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
