// Reading (/dashboard/reading): shared shapes for the page and its APIs
// (/api/reading for books and chapters, /api/reading-notes for notes).

export interface BookChapter {
  id: string;
  bookId: string;
  position: number;
  kind: "front" | "chapter";
  title: string;
  headings: string[];
  takeaway: string;
  readAt: number | null;
  deletedAt: number | null;
}

export interface BookNote {
  id: string;
  bookId: string;
  chapterId: string | null; // null = about the whole book
  heading: string | null;
  text: string;
  position: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  subtitle: string;
  startedOn: string | null;
  finishedOn: string | null;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  chapters: BookChapter[];
  notes: BookNote[];
}

export interface ChapterRow {
  id: string;
  book_id: string;
  position: number;
  kind: string;
  title: string;
  headings: string;
  takeaway: string;
  read_at: number | null;
  updated_at: number;
  deleted_at: number | null;
}

export interface NoteRow {
  id: string;
  book_id: string;
  chapter_id: string | null;
  heading: string | null;
  text: string;
  position: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

const num = (v: number | null) => (v == null ? null : Number(v));

export function toChapter(r: ChapterRow): BookChapter {
  let headings: string[] = [];
  try {
    const h = JSON.parse(r.headings || "[]");
    if (Array.isArray(h)) headings = h.filter((x) => typeof x === "string");
  } catch {
    /* keep [] */
  }
  return {
    id: r.id,
    bookId: r.book_id,
    position: Number(r.position),
    kind: r.kind === "front" ? "front" : "chapter",
    title: r.title,
    headings,
    takeaway: r.takeaway,
    readAt: num(r.read_at),
    deletedAt: num(r.deleted_at),
  };
}

export function toBookNote(r: NoteRow): BookNote {
  return {
    id: r.id,
    bookId: r.book_id,
    chapterId: r.chapter_id,
    heading: r.heading,
    text: r.text,
    position: Number(r.position),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
    deletedAt: num(r.deleted_at),
  };
}
