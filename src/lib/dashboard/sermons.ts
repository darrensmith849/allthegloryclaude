// Sermons (/dashboard/sermons): shared shapes and helpers for the page and
// /api/sermons.

export interface SermonItem {
  id: string;
  kind: "verse" | "word";
  ref?: string; // verse: "John 3:16"
  text?: string; // verse text, or a word's meaning
  word?: string; // word: the English word looked up
  original?: string; // word: Hebrew / Greek, e.g. "ἀγάπη (agapē)"
  strongs?: string; // word: "G26"
  addedAt: number;
}

export interface SermonNote {
  id: string;
  sermonId: string;
  text: string;
  position: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface Sermon {
  id: string;
  title: string;
  preacher: string;
  url: string;
  listenedOn: string | null; // YYYY-MM-DD
  notes: string; // the first version's single notes box - moved into noteList on load
  noteList: SermonNote[]; // saved notes, in order (deleted ones too, with deletedAt)
  items: SermonItem[];
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

// A sermon_notes row as D1 returns it.
export interface NoteRow {
  id: string;
  sermon_id: string;
  text: string;
  position: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export function toNote(r: NoteRow): SermonNote {
  return {
    id: r.id,
    sermonId: r.sermon_id,
    text: r.text,
    position: Number(r.position),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
    deletedAt: r.deleted_at == null ? null : Number(r.deleted_at),
  };
}
