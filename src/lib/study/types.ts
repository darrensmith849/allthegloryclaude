// Shapes shared by The Study's APIs and pages.
import type { BibleWord } from "@/lib/dashboard/types";
import type { ReadingMode, SignupMode } from "./members";

// The parts of the owner's word entries a reader sees (no comments).
export type ReaderWord = Pick<
  BibleWord,
  | "id"
  | "word"
  | "language"
  | "original"
  | "translit"
  | "strongs"
  | "originalMeaning"
  | "englishMeaning"
  | "application"
  | "keyVerses"
>;

export interface ReaderNote {
  id: string;
  page: number | null;
  book: number | null;
  chapter: number | null;
  verse: number | null;
  verseEnd: number | null;
  text: string;
}

export interface ContentsDay {
  day: string;
  title: string;
  chapters: string[];
  passages?: string[]; // "book:chapter", e.g. "43:4"
  shared: boolean;
}

export interface PublicStudy {
  author: string;
  intro: string;
  reading: ReadingMode;
  signup?: SignupMode;
}

// GET /api/study/read
export interface ReaderData {
  study: PublicStudy;
  preview: boolean;
  contents: ContentsDay[];
  day: string | null;
  info?: { title: string; takeaway: string; shared: boolean };
  notes: ReaderNote[];
  words: ReaderWord[];
  hidden?: number;
}
