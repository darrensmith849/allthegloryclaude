// The 66 books in canonical order (ids 1-66, as bolls.life and most Bible
// APIs number them), with a forgiving reference parser.

export const BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
  "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon",
  "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah",
  "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians",
  "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians",
  "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
  "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation",
] as const;

export interface VerseRef {
  book: number; // 1-66
  chapter: number;
  verses: number[]; // first few verses of the range
}

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const ALIASES: Record<string, number> = {
  psalm: 19, ps: 19, psa: 19, song: 22, songofsongs: 22, canticles: 22,
  mt: 40, mk: 41, lk: 42, jn: 43, jhn: 43, phil: 50, php: 50, phm: 57,
  jas: 59, jude: 65, rev: 66, revelations: 66,
};

function bookId(name: string): number | null {
  const n = squash(name);
  if (!n) return null;
  if (ALIASES[n]) return ALIASES[n];
  const i = BOOKS.findIndex((b) => squash(b) === n);
  if (i >= 0) return i + 1;
  if (n.replace(/^\d/, "").length < 2) return null;
  const j = BOOKS.findIndex((b) => squash(b).startsWith(n));
  return j >= 0 ? j + 1 : null;
}

// "Psalm 136:1", "1 Cor 13:4-7", "Eph. 2:8", "John 3" -> VerseRef.
export function parseRef(ref: string): VerseRef | null {
  const m = ref.trim().match(/^((?:[1-3]\s*)?[A-Za-z][A-Za-z .]*?)\s*(\d+)(?::(\d+)(?:\s*[-–]\s*(\d+))?)?/);
  if (!m) return null;
  const book = bookId(m[1]);
  if (!book) return null;
  const chapter = Number(m[2]);
  const from = m[3] ? Number(m[3]) : 1;
  const to = m[4] ? Math.min(Number(m[4]), from + 2) : from;
  const verses: number[] = [];
  for (let v = from; v <= to; v++) verses.push(v);
  return { book, chapter, verses };
}

export function formatRef(book: number, chapter: number, verses: number[]): string {
  const name = BOOKS[book - 1] === "Psalms" ? "Psalm" : BOOKS[book - 1];
  const span = verses.length > 1 ? `${verses[0]}-${verses[verses.length - 1]}` : `${verses[0]}`;
  return `${name} ${chapter}:${span}`;
}

export const isOldTestament = (book: number) => book <= 39;
