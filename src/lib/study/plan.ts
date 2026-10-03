// The reading plan the study follows: Tyndale's One Year Chronological
// Bible (NIV). Tyndale's own plan is free in the Bible App (YouVersion) with
// the same 365 daily readings as the book, readable in the NIV or any other
// translation - so days link straight to it rather than copying the plan.

export const PLAN = {
  name: "The One Year Chronological Bible",
  edition: "NIV · Tyndale",
  bibleApp: "https://www.bible.com/reading-plans/10819-the-one-year-chronological-bible",
  // Paperback, ISBN 978-1-4143-5993-9 (the NIV edition the study uses).
  takealot: "https://www.takealot.com/niv-one-year-chronological-bible-the/PLID34394061",
  amazon: "https://www.amazon.com/dp/1414359934",
};

// That day's readings in the Bible App (opens the app on phones that have it).
export const bibleAppDay = (n: number) => `${PLAN.bibleApp}/day/${n}`;
