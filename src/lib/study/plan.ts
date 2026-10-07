import { planDate, planDay } from "@/lib/dashboard/notes";

// The reading plan the study follows: Tyndale's One Year Chronological
// Bible (NIV). Tyndale's own plan is free in the Bible App (YouVersion) with
// the same 365 daily readings as the book, and on the web its passages open
// in the NIV (in the app, whichever translation the reader last chose) - so
// days link straight to it rather than copying the plan.

// Why the owner shares his study - in his words (the default welcome line;
// the owner can change it on /dashboard/members).
export const STUDY_HEART =
  "Daniel has a heart to share how he's studying the Bible - the questions he asks himself as he reads, what God is saying to him, and his own study of the Word. It's here as an encouragement: we're all still learning.";

// The plan's pages: Day 1-365 are the 2026 pages, 1 January to 31 December
// (the book's own dated readings) - whatever today's date is. Everyone goes
// at their own pace: a member's next reading is the day after the furthest
// one they've marked as read. Daniel and Reggie's weekly calls go onto the
// same Day pages, and so do Daniel's 2026 notes - so they carry over to
// whoever reaches those days. (No start date is named to members - the
// owner asked not to.)
export const STUDY_START = "2026-01-01";
export const PLAN_END = "2026-12-31";
export const inPlan = (day: string) => day >= STUDY_START && day <= PLAN_END;

// The page for plan day n (1-365).
export const planPage = (n: number) => planDate(Math.min(365, Math.max(1, Math.round(n))), Number(STUDY_START.slice(0, 4)));

// Where a member is up to: the page after the furthest one marked as read
// (Day 1 if none yet; stays on Day 365 at the end).
export function nextPage(readDays: Iterable<string>): string {
  let furthest = "";
  for (const d of readDays) if (inPlan(d) && d > furthest) furthest = d;
  return furthest ? planPage(planDay(furthest).n + 1) : STUDY_START;
}

// "5 January" - the reading's page in the book.
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const bookDate = (day: string) => `${Number(day.slice(8, 10))} ${MONTH_NAMES[Number(day.slice(5, 7)) - 1]}`;

export const startMessage = () =>
  "Go at your own pace - mark a day as read and your journal moves you on to the next. Daniel's notes appear on each day as he goes.";

// One line for new visitors (The Study page).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const startBanner = (_today?: string) => "We're starting again at Genesis 1, together - join in and go at your own pace.";

// How the videos come: one call a week, as far through the reading as they get.
export const CALLS_NOTE =
  "Daniel and Reggie meet on a call every Monday and go through as much of the reading as they can - so the videos come weekly, not daily.";

export const START_WHY =
  "We've already been through the whole Bible - and we want to start it again, from the very beginning, together.";

export const PLAN = {
  name: "The One Year Chronological Bible",
  edition: "NIV · Tyndale",
  bibleApp: "https://www.bible.com/reading-plans/10819-the-one-year-chronological-bible",
  // Paperback, ISBN 978-1-4143-5993-9 (the NIV edition the study uses).
  takealot: "https://www.takealot.com/niv-one-year-chronological-bible-the/PLID34394061",
  amazon: "https://www.amazon.com/dp/1414359934",
  // The same NIV book as a Kindle eBook (ASIN B007MB5JP6).
  kindle: "https://www.amazon.com/dp/B007MB5JP6",
};

// That day's readings in the Bible App (opens the app on phones that have it).
export const bibleAppDay = (n: number) => `${PLAN.bibleApp}/day/${n}`;

// Bible App (YouVersion) book codes, in canonical order - for linking a
// verse straight to the NIV (version 111).
const USFM = [
  "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA", "1KI", "2KI", "1CH", "2CH",
  "EZR", "NEH", "EST", "JOB", "PSA", "PRO", "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS",
  "JOL", "AMO", "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL", "MAT", "MRK", "LUK",
  "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT",
  "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV",
];

export const bibleAppVerse = (book: number, chapter: number, verse?: number | null) =>
  `https://www.bible.com/bible/111/${USFM[book - 1]}.${chapter}${verse ? `.${verse}` : ""}.NIV`;
