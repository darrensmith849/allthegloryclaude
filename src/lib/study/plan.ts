// The reading plan the study follows: Tyndale's One Year Chronological
// Bible (NIV). Tyndale's own plan is free in the Bible App (YouVersion) with
// the same 365 daily readings as the book, and on the web its passages open
// in the NIV (in the app, whichever translation the reader last chose) - so
// days link straight to it rather than copying the plan.

// Why the owner shares his study - in his words (the default welcome line;
// the owner can change it on /dashboard/members).
export const STUDY_HEART =
  "Daniel has a heart to share how he's studying the Bible - the questions he asks himself as he reads, what God is saying to him, and his own study of the Word. It's here as an encouragement: we're all still learning.";

// Everyone starts the plan together at Day 1 (Genesis 1) - 1 January 2027 on
// the calendar. Daniel begins on Monday 12 October 2026 and his notes go onto
// each day as he goes, so members can read along early. Until the start,
// members' home page and journal point at Day 1 rather than today's date.
export const STUDY_START = "2027-01-01";
export const STUDY_KICKOFF = "2026-10-12";
export const beforeStart = (today: string) => today < STUDY_START;
export const startMessage = (today: string) =>
  today < STUDY_KICKOFF
    ? "We begin on Monday 12 October - Daniel's notes appear on each day as he goes, so you can read along from then, or start fresh on 1 January."
    : "We've begun - Daniel's notes appear on each day as he goes. Read along at your own pace, or start fresh on 1 January.";

// One line for new visitors (The Study page), or "" once we've started.
export const startBanner = (today: string) =>
  today >= STUDY_START
    ? ""
    : today < STUDY_KICKOFF
      ? "We start at Genesis 1 together on Monday 12 October - join in."
      : "We've just started again at Genesis 1 - join in, it's not too late.";

export const START_WHY =
  "We've already been through the whole Bible once - and we want to start it again, from the very beginning, together.";

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
