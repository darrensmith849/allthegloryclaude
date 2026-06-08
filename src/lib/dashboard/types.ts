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
  tag: string; // tag id - resolved against settings.taskTags + DEFAULT_TASK_TAGS
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
  // Which days of week this habit applies to. 0=Sun, 1=Mon, ..., 6=Sat.
  // Missing/empty = every day. Habits with a daysOfWeek list are hidden on
  // days outside that list (e.g. Gym is weekdays only).
  daysOfWeek?: number[];
}

export type DayHabits = Record<string, boolean>;

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const HABIT_WEEKDAYS = [1, 2, 3, 4, 5];

// Built-in habit set - kept as defaults so first-load users see something useful.
// daysOfWeek defaults are tuned for the user's rhythm: the core disciplines
// apply every day, gym + guitar + book writing are weekday-only.
export const DEFAULT_HABITS: HabitDef[] = [
  { id: "bibleRead", label: "Read the Word", showOnSchedule: true, daysOfWeek: ALL_DAYS },
  { id: "noPorn", label: "Stayed clean", daysOfWeek: ALL_DAYS },
  { id: "noSocialMedia", label: "No social media", daysOfWeek: ALL_DAYS },
  { id: "noTradingCharts", label: "No trading charts", daysOfWeek: ALL_DAYS },
  { id: "gym", label: "Gym", showOnSchedule: true, daysOfWeek: HABIT_WEEKDAYS },
  { id: "worship", label: "Evening worship", showOnSchedule: true, daysOfWeek: ALL_DAYS },
  { id: "phoneOffAt7", label: "Phone off by 7pm", showOnSchedule: true, daysOfWeek: ALL_DAYS },
  { id: "guitar", label: "Guitar practice", showOnSchedule: true, daysOfWeek: HABIT_WEEKDAYS },
  { id: "bookWriting", label: "Book writing", daysOfWeek: HABIT_WEEKDAYS },
];

// Recommended weekday-only defaults applied during migration when an existing
// user has the same habit id but no daysOfWeek yet.
const RECOMMENDED_DAYS: Record<string, number[]> = {
  gym: HABIT_WEEKDAYS,
  guitar: HABIT_WEEKDAYS,
  bookWriting: HABIT_WEEKDAYS,
};
export function recommendedDaysFor(habitId: string): number[] {
  return RECOMMENDED_DAYS[habitId] ?? ALL_DAYS;
}

// Special-purpose flags that aren't toggled by the user as normal habits -
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
  hour: number; // 24h fractional, e.g. 18.5 = 6:30pm - used for "now" highlight
  title: string;
  sub: string;
  habitId?: string; // optional - when set, surfaces a Mark button + ticks the habit
  // Which days of week this row applies to. 0=Sun, 1=Mon ... 6=Sat.
  // Missing/empty = backward-compat fallback (weekdays only).
  daysOfWeek?: number[];
}

const WEEKDAYS = [1, 2, 3, 4, 5];
export const DEFAULT_SCHEDULE: ScheduleRow[] = [
  // Weekday rhythm - Mon to Fri
  { id: "s-word", time: "7:00", hour: 7, title: "The Word", sub: "Chronological reading + journal", habitId: "bibleRead", daysOfWeek: WEEKDAYS },
  { id: "s-2ko", time: "9:00", hour: 9, title: "2KO with Darren", sub: "Deep work block", daysOfWeek: WEEKDAYS },
  { id: "s-coffee", time: "10:00", hour: 10, title: "Coffee break", sub: "Stand up, water, breathe", daysOfWeek: WEEKDAYS },
  { id: "s-lunch", time: "12:00", hour: 12, title: "Lunch", sub: "Eat away from the screen", daysOfWeek: WEEKDAYS },
  { id: "s-afternoon", time: "13:00", hour: 13, title: "Afternoon work", sub: "2KO continued", daysOfWeek: WEEKDAYS },
  { id: "s-gym", time: "15:00", hour: 15, title: "Gym", sub: "Train hard.", habitId: "gym", daysOfWeek: WEEKDAYS },
  { id: "s-creative", time: "17:00", hour: 17, title: "Guitar / writing", sub: "Practice or book session", habitId: "guitar", daysOfWeek: WEEKDAYS },
  { id: "s-worship", time: "18:30", hour: 18.5, title: "Evening worship", sub: "Worship before phone off", habitId: "worship", daysOfWeek: WEEKDAYS },
  { id: "s-phone-off", time: "19:00", hour: 19, title: "Phone off", sub: "No screens until tomorrow", habitId: "phoneOffAt7", daysOfWeek: WEEKDAYS },
  // Sunday default - church first thing.
  { id: "s-sun-church", time: "6:30", hour: 6.5, title: "Church", sub: "Sunday gathering", habitId: "worship", daysOfWeek: [0] },
];

// 0=Sun, 1=Mon, ..., 6=Sat from an ISO date string (local time).
function dayOfWeekFor(iso: ISODate): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

// Resolve the schedule for a specific calendar date - filters the global
// schedule by day-of-week, then merges per-date extras and sorts the whole
// thing by hour so any newly added row auto-slots into the right time slot
// instead of appearing at the bottom. JS sort has been stable since ES2019
// so rows with identical hours keep their insertion order.
export function getScheduleForDate(
  date: ISODate,
  settings: Settings,
  scheduleExtras: Record<ISODate, ScheduleRow[]> | undefined,
): ScheduleRow[] {
  const dow = dayOfWeekFor(date);
  const isWeekend = dow === 0 || dow === 6;
  const base = resolveSchedule(settings).filter((r) => {
    const dayList = r.daysOfWeek;
    if (!dayList || dayList.length === 0) {
      // Older rows with no day list default to weekdays only.
      return !isWeekend;
    }
    return dayList.includes(dow);
  });
  const extras = scheduleExtras?.[date] ?? [];
  return [...base, ...extras].sort((a, b) => a.hour - b.hour);
}

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
  section: string; // section identifier - "1", "2", etc.
  sectionTitle?: string;
  number: number; // running lesson number across the whole course
  title: string;
  minutes: number;
  hasResources?: boolean;
  status: "todo" | "in-progress" | "done";
  notes?: string;
}

// Seeded from the lessons the user has been showing - sections 1 & 2 so far.
// All marked done because the user's Udemy UI shows ✓ on every one.
// New lessons can be added in Settings; the plan generator picks the next
// undone ones.
export const DEFAULT_GUITAR_COURSE: CourseLesson[] = [
  // Section 1 - intro / theory foundation (33 min)
  { id: "u-1", section: "1", sectionTitle: "Foundations", number: 1, title: "There Are 12 Notes In Western Music", minutes: 3, status: "todo" },
  { id: "u-2", section: "1", sectionTitle: "Foundations", number: 2, title: "Introduction to Intervals", minutes: 2, status: "todo" },
  { id: "u-3", section: "1", sectionTitle: "Foundations", number: 3, title: "Intervals on the Guitar", minutes: 6, status: "todo" },
  { id: "u-4", section: "1", sectionTitle: "Foundations", number: 4, title: "Different Terminology", minutes: 2, hasResources: true, status: "todo" },
  { id: "u-5", section: "1", sectionTitle: "Foundations", number: 5, title: "An Introduction to the Major Scale", minutes: 3, hasResources: true, status: "todo" },
  { id: "u-6", section: "1", sectionTitle: "Foundations", number: 6, title: "The Circle of 4th's", minutes: 3, hasResources: true, status: "todo" },
  { id: "u-7", section: "1", sectionTitle: "Foundations", number: 7, title: "Fretboard Memorisation Pt. I", minutes: 7, status: "todo" },
  { id: "u-8", section: "1", sectionTitle: "Foundations", number: 8, title: "Fretboard Memorisation Pt. II", minutes: 5, hasResources: true, status: "todo" },
  { id: "u-9", section: "1", sectionTitle: "Foundations", number: 9, title: "PLAY-ALONG Circle of 4th's", minutes: 2, status: "todo" },
  // Section 2 - Chords and How to Practice Them (2hr 1min, 22/28 lessons watched)
  { id: "u-10", section: "2", sectionTitle: "Chords & Practice", number: 10, title: "Diatonic Harmony Pt. I", minutes: 5, status: "todo" },
  { id: "u-11", section: "2", sectionTitle: "Chords & Practice", number: 11, title: "Diatonic Harmony Pt. II", minutes: 10, status: "todo" },
  { id: "u-12", section: "2", sectionTitle: "Chords & Practice", number: 12, title: "7th Chords - Root on 6th String", minutes: 9, status: "todo" },
  { id: "u-13", section: "2", sectionTitle: "Chords & Practice", number: 13, title: "7th Chords - Root on 5th String", minutes: 7, status: "todo" },
  { id: "u-14", section: "2", sectionTitle: "Chords & Practice", number: 14, title: "PLAY-ALONG 7th Chords - Root on 6th String", minutes: 2, status: "todo" },
  { id: "u-15", section: "2", sectionTitle: "Chords & Practice", number: 15, title: "PLAY-ALONG 7th Chords - Root on 5th String", minutes: 2, status: "todo" },
  { id: "u-16", section: "2", sectionTitle: "Chords & Practice", number: 16, title: "Common Chord Progressions", minutes: 5, hasResources: true, status: "todo" },
  { id: "u-17", section: "2", sectionTitle: "Chords & Practice", number: 17, title: "PLAY-ALONG I vi IV V", minutes: 2, status: "todo" },
  { id: "u-18", section: "2", sectionTitle: "Chords & Practice", number: 18, title: "PLAY-ALONG - I iii IV V", minutes: 2, status: "todo" },
  // Section 2 continued - Practice tracks, triads, triad applications
  { id: "u-19", section: "2", sectionTitle: "Chords & Practice", number: 19, title: "Practice Track - I vi IV V", minutes: 3, hasResources: true, status: "todo" },
  { id: "u-20", section: "2", sectionTitle: "Chords & Practice", number: 20, title: "Practice Track - I iii IV V", minutes: 3, hasResources: true, status: "todo" },
  { id: "u-21", section: "2", sectionTitle: "Chords & Practice", number: 21, title: "An Introduction to Triads", minutes: 5, hasResources: true, status: "todo" },
  { id: "u-22", section: "2", sectionTitle: "Chords & Practice", number: 22, title: "Major Triads - 1st & 2nd String Sets", minutes: 6, hasResources: true, status: "todo" },
  { id: "u-23", section: "2", sectionTitle: "Chords & Practice", number: 23, title: "Major Triads - 3rd & 4th String Sets", minutes: 5, status: "todo" },
  { id: "u-24", section: "2", sectionTitle: "Chords & Practice", number: 24, title: "Minor Triads", minutes: 3, status: "todo" },
  { id: "u-25", section: "2", sectionTitle: "Chords & Practice", number: 25, title: "Diminished Triads", minutes: 3, status: "todo" },
  { id: "u-26", section: "2", sectionTitle: "Chords & Practice", number: 26, title: "Augmented Triads", minutes: 5, hasResources: true, status: "todo" },
  { id: "u-27", section: "2", sectionTitle: "Chords & Practice", number: 27, title: "Dominant 7th Triads", minutes: 4, status: "todo" },
  { id: "u-28", section: "2", sectionTitle: "Chords & Practice", number: 28, title: "Circle of 4th's - How to Practice Triads", minutes: 6, hasResources: true, status: "todo" },
  { id: "u-29", section: "2", sectionTitle: "Chords & Practice", number: 29, title: "PLAY-ALONG Circle of 4th's Major Triads", minutes: 2, status: "todo" },
  { id: "u-30", section: "2", sectionTitle: "Chords & Practice", number: 30, title: "PLAY-ALONG Circle of 4th's Minor Triads", minutes: 3, status: "todo" },
  { id: "u-31", section: "2", sectionTitle: "Chords & Practice", number: 31, title: "PLAY-ALONG Circle of 4th's Dominant 7th Triads", minutes: 2, status: "todo" },
  { id: "u-32", section: "2", sectionTitle: "Chords & Practice", number: 32, title: "PLAY-ALONG Circle of 4th's Diminished Triads", minutes: 3, status: "todo" },
  { id: "u-33", section: "2", sectionTitle: "Chords & Practice", number: 33, title: "What about Augmented Triads?", minutes: 2, status: "todo" },
  { id: "u-34", section: "2", sectionTitle: "Chords & Practice", number: 34, title: "Triad Application Pt. I - Major & Minor", minutes: 4, hasResources: true, status: "todo" },
  { id: "u-35", section: "2", sectionTitle: "Chords & Practice", number: 35, title: "Triad Application Pt. II - Diminished & Augmented", minutes: 7, hasResources: true, status: "todo" },
  { id: "u-36", section: "2", sectionTitle: "Chords & Practice", number: 36, title: "Triad Application Pt. III - Another Approach", minutes: 9, status: "todo" },
  { id: "u-37", section: "2", sectionTitle: "Chords & Practice", number: 37, title: "Triad Application Pt. IV - Larger Chords", minutes: 3, hasResources: true, status: "todo" },
  // Section 3 - Scales and Improvisation (25 lessons, 1hr 36min, 0 done so far)
  { id: "u-38", section: "3", sectionTitle: "Scales & Improvisation", number: 38, title: "How Most Guitarists Are Taught Scales", minutes: 3, status: "todo" },
  { id: "u-39", section: "3", sectionTitle: "Scales & Improvisation", number: 39, title: "7 Positions of The Major Scale", minutes: 5, hasResources: true, status: "todo" },
  { id: "u-40", section: "3", sectionTitle: "Scales & Improvisation", number: 40, title: "PLAY-ALONG 7 Positions of The Major Scale", minutes: 2, status: "todo" },
  { id: "u-41", section: "3", sectionTitle: "Scales & Improvisation", number: 41, title: "Circle of 4th's - How to Practice Scales", minutes: 3, hasResources: true, status: "todo" },
  { id: "u-42", section: "3", sectionTitle: "Scales & Improvisation", number: 42, title: "Circle of 4th's - The Major Scale Pt. I", minutes: 5, hasResources: true, status: "todo" },
  { id: "u-43", section: "3", sectionTitle: "Scales & Improvisation", number: 43, title: "Circle of 4th's - The Major Scale Pt. II", minutes: 4, status: "todo" },
  { id: "u-44", section: "3", sectionTitle: "Scales & Improvisation", number: 44, title: "PLAY-ALONG Circle of 4th's - The Major Scale", minutes: 1, status: "todo" },
  { id: "u-45", section: "3", sectionTitle: "Scales & Improvisation", number: 45, title: "The Natural Minor Scale & the Relative Minor", minutes: 6, hasResources: true, status: "todo" },
  { id: "u-46", section: "3", sectionTitle: "Scales & Improvisation", number: 46, title: "The Minor Pentatonic Scale - 5 Positions", minutes: 4, hasResources: true, status: "todo" },
  { id: "u-47", section: "3", sectionTitle: "Scales & Improvisation", number: 47, title: "PLAY-ALONG - 5 Positions of the Minor Pentatonic Scale", minutes: 1, status: "todo" },
  { id: "u-48", section: "3", sectionTitle: "Scales & Improvisation", number: 48, title: "Circle of 4th's - The Minor Pentatonic Scale", minutes: 5, status: "todo" },
  { id: "u-49", section: "3", sectionTitle: "Scales & Improvisation", number: 49, title: "PLAY-ALONG Circle of 4th's - The Minor Pentatonic Scale", minutes: 1, status: "todo" },
  { id: "u-50", section: "3", sectionTitle: "Scales & Improvisation", number: 50, title: "The Blues Scale", minutes: 4, status: "todo" },
  { id: "u-51", section: "3", sectionTitle: "Scales & Improvisation", number: 51, title: "Practice Track - A Minor Vamp", minutes: 4, hasResources: true, status: "todo" },
  { id: "u-52", section: "3", sectionTitle: "Scales & Improvisation", number: 52, title: "The Major Pentatonic Scale", minutes: 4, hasResources: true, status: "todo" },
  { id: "u-53", section: "3", sectionTitle: "Scales & Improvisation", number: 53, title: "Transitioning Between Major and Minor Pentatonic", minutes: 9, hasResources: true, status: "todo" },
  { id: "u-54", section: "3", sectionTitle: "Scales & Improvisation", number: 54, title: "Practice Track - E Major", minutes: 2, hasResources: true, status: "todo" },
  { id: "u-55", section: "3", sectionTitle: "Scales & Improvisation", number: 55, title: "Intervals in Improvisation Pt. I - Introduction", minutes: 3, hasResources: true, status: "todo" },
  { id: "u-56", section: "3", sectionTitle: "Scales & Improvisation", number: 56, title: "Intervals in Improvisation Pt. II - PLAY-ALONG", minutes: 3, status: "todo" },
  { id: "u-57", section: "3", sectionTitle: "Scales & Improvisation", number: 57, title: "Intervals in Improvisation Pt. III - Starter Licks", minutes: 6, status: "todo" },
  { id: "u-58", section: "3", sectionTitle: "Scales & Improvisation", number: 58, title: "Practice Track - A Major Progression", minutes: 3, hasResources: true, status: "todo" },
  { id: "u-59", section: "3", sectionTitle: "Scales & Improvisation", number: 59, title: "Triads in Solos", minutes: 8, hasResources: true, status: "todo" },
  { id: "u-60", section: "3", sectionTitle: "Scales & Improvisation", number: 60, title: "Motifs in Improvisation", minutes: 5, hasResources: true, status: "todo" },
  { id: "u-61", section: "3", sectionTitle: "Scales & Improvisation", number: 61, title: "Practice Track - Blues Shuffle in A", minutes: 4, hasResources: true, status: "todo" },
  { id: "u-62", section: "3", sectionTitle: "Scales & Improvisation", number: 62, title: "Well Done!", minutes: 1, status: "todo" },
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
  // The Monday the user starts the course. The "This week" panel anchors
  // its date labels to max(this, this calendar week's Monday) so the plan
  // shows the future start week until the user actually reaches it.
  guitarCourseStartDate: ISODate;
  taskTags: TaskTag[]; // user-added; concatenated with DEFAULT_TASK_TAGS
  planOverrides: Record<number, string>; // planDay -> passage override
  goals: {
    bibleStreakTarget: number;
    cleanStreakTarget: number;
    bookWordTarget: number;
    guitarMinutesPerWeek: number;
  };
}

// Returns the upcoming Monday (or today if today IS Monday).
// Used as the default guitar-course start so the plan shows the user's
// "first real week" instead of the current part-week.
function computeNextMonday(): ISODate {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  // If today is Monday → still advance 7 days so "next Monday" is genuinely
  // next; otherwise advance to the upcoming Monday.
  const offset = day === 1 ? 7 : ((8 - day) % 7) || 7;
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
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
    guitarCourseStartDate: computeNextMonday(),
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

// Resolve the active habits list - falls back to defaults for fresh installs.
export function resolveHabits(settings: Settings): HabitDef[] {
  return settings.habits?.length ? settings.habits : DEFAULT_HABITS;
}

// Resolve the habits visible on a specific date - filters by day-of-week so
// e.g. Gym is hidden on Saturday, the daily disciplines stay every day.
export function getHabitsForDate(date: ISODate, settings: Settings): HabitDef[] {
  const dow = dayOfWeekFor(date);
  return resolveHabits(settings).filter((h) => {
    const list = h.daysOfWeek;
    if (!list || list.length === 0) return true; // unknown → show every day
    return list.includes(dow);
  });
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

// ─── 40-Day Fast ──────────────────────────────────────────────────
// A bounded streak plan — typically 40 days, the biblical fast length —
// where the user abstains from a small set of categories (social media,
// movies, etc.) and ticks each one off per day. Separate from the
// open-ended habit system so it has its own start date + length + grid
// and doesn't pollute the daily habits map.
export interface FastCategory {
  id: string;
  label: string;
}

export interface Fast {
  startDate: ISODate;
  days: number; // 40 by default
  categories: FastCategory[];
  // per-date → per-categoryId boolean. true = kept clean that day.
  checks: Record<ISODate, Record<string, boolean>>;
}

export const DEFAULT_FAST_CATEGORIES: FastCategory[] = [
  { id: "socials", label: "Social media" },
  { id: "movies", label: "Movies & TV" },
  { id: "youtube", label: "YouTube" },
  { id: "news", label: "News" },
];

export function defaultFast(startDate: ISODate): Fast {
  return {
    startDate,
    days: 40,
    categories: DEFAULT_FAST_CATEGORIES,
    checks: {},
  };
}

// ─── Root state ───────────────────────────────────────────────────
export interface DashboardState {
  tasks: Task[];
  habits: Record<ISODate, DayHabits>;
  // Per-day "is this schedule row done?" checks, keyed by row id.
  // Schedule rows linked to a habit don't need this - their habit field
  // already encodes their done state. This map covers the ones that don't
  // (e.g. "Coffee break", "Lunch") so every row can be ticked off and
  // counted toward the daily progress bar.
  scheduleChecks: Record<ISODate, Record<string, boolean>>;
  // Per-date custom rows the user adds directly on a specific day
  // (e.g. weekend plans). Merged after the global day-of-week schedule.
  scheduleExtras: Record<ISODate, ScheduleRow[]>;
  bibleLogs: Record<ISODate, BibleDayLog>;
  // When the user clicks "Complete the day" we stamp this map with the ISO
  // timestamp it was sealed at. A day key in here means the day is "closed"
  // - Today shows a recap instead of the action buttons, and the calendar
  // marks it as completed. Reopening the day removes the key.
  dayCompleted: Record<ISODate, string>;
  guitar: GuitarSession[];
  book: { meta: BookMeta; sessions: BookSession[] };
  settings: Settings;
  rewardsClaimed: Record<string, ISODate>;
  // Active 40-day fast (null when no fast has been started). Populated
  // on first visit to /dashboard/fast.
  fast: Fast | null;
}

export function emptyState(): DashboardState {
  return {
    tasks: [],
    habits: {},
    scheduleChecks: {},
    scheduleExtras: {},
    bibleLogs: {},
    dayCompleted: {},
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
    fast: null,
  };
}
