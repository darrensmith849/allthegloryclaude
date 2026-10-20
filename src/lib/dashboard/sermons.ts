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

export interface Sermon {
  id: string;
  title: string;
  preacher: string;
  url: string;
  listenedOn: string | null; // YYYY-MM-DD
  notes: string;
  items: SermonItem[];
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

/** The YouTube video id from any usual link (watch, youtu.be, shorts, live, embed). */
export function youtubeId(url: string): string | null {
  const u = url.trim();
  if (!u) return null;
  const m =
    u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/) ??
    u.match(/^([A-Za-z0-9_-]{11})$/);
  return m ? m[1] : null;
}

/** Where a time link like ?t=754 or &t=12m34s starts, in seconds. */
export function youtubeStart(url: string): number {
  const m = url.match(/[?&](?:t|start)=(\d+h)?(\d+m)?(\d+)s?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? "0") || 0) * 3600 + (parseInt(m[2] ?? "0") || 0) * 60 + (parseInt(m[3] ?? "0") || 0);
}
