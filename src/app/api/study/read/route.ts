/**
 * The owner's study as readers see it, one reading day at a time.
 *
 *   GET [?day=YYYY-MM-DD | ?on=MM-DD] [&preview=1]
 *     -> { study, contents, day, info, notes, words, hidden? }
 *   GET ?only=contents -> { study, contents, videos }
 *     videos: every shared day's session video (YouTube) - shown on its date
 *     even with no notes yet, and even while the day's notes are held back
 *   GET ?search=grace | ?search=Matt 4 -> { study, results } (shared notes that match)
 *
 * Who may read is the owner's switch (study_settings.reading): nobody yet
 * (the default), members, or everyone. The owner (admin session) can always
 * read; with preview=1 they also see the days they keep out of the shared
 * study and how many private notes are hidden.
 *
 * Never sent to readers: private notes, deleted notes, days marked not
 * shared, held days (study_settings "hold", see src/lib/study/hold.ts -
 * a member sees each once their own reading reaches it, or now if Daniel
 * lets them; visitors never), and the owner's personal comments on words.
 */
import { getDb } from "@/lib/analytics/store";
import { isSignedIn } from "@/lib/admin-auth";
import { chapterLabel, isDay, matchesNote, passageOf } from "@/lib/dashboard/notes";
import type { BibleWord } from "@/lib/dashboard/types";
import { hiddenByHold, inHold } from "@/lib/study/hold";
import { memberReach } from "@/lib/study/progress";
import { getMember, getSettings } from "@/lib/study/members";
import type { ReaderWord } from "@/lib/study/types";

export const dynamic = "force-dynamic";

interface NoteRow {
  id: string;
  day: string;
  page: number | null;
  book: number | null;
  chapter: number | null;
  verse: number | null;
  verse_end: number | null;
  text: string;
  private: number;
  position: number | null;
  seq: number;
}


const noStore = { "cache-control": "no-store" };

export async function GET(req: Request) {
  const db = await getDb();
  if (!db) return Response.json({ error: "The study isn't available right now." }, { status: 503 });
  const url = new URL(req.url);
  const [settings, owner] = await Promise.all([getSettings(db), isSignedIn(req.headers.get("cookie"))]);
  const study = { author: settings.author, intro: settings.intro, reading: settings.reading };

  if (!owner) {
    if (settings.reading === "off") {
      return Response.json({ error: "The study isn't open yet.", closed: true, study }, { status: 403, headers: noStore });
    }
    if (settings.reading === "members" && !(await getMember(req, db))) {
      return Response.json({ error: "Log in to read the study.", login: true, study }, { status: 401, headers: noStore });
    }
  }
  const preview = owner && url.searchParams.get("preview") === "1";
  // Held days: a member sees each once their reading reaches it (or now, if
  // Daniel lets them); a visitor never; the owner with preview=1 always.
  const member = owner ? null : await getMember(req, db).catch(() => null);
  const reader = member ? { id: member.id, reach: await memberReach(db, member.id) } : null;
  const held = (d: string) => !preview && hiddenByHold(d, settings.hold, reader);

  try {
    // Search the shared study: words, a passage ("Matt 4"), a date ("27 sep").
    const search = (url.searchParams.get("search") ?? "").trim().slice(0, 80);
    if (search) {
      if (search.length < 2) return Response.json({ error: "Type a little more." }, { status: 400 });
      const [{ results: rows }, { results: unshared }] = await Promise.all([
        db
          .prepare(
            "SELECT id, day, page, book, chapter, verse, verse_end, text, private, position, seq FROM study_notes " +
              "WHERE deleted_at IS NULL AND private = 0 AND day IS NOT NULL ORDER BY day DESC, position, seq",
          )
          .all<NoteRow>(),
        db.prepare("SELECT day FROM study_days WHERE shared = 0").all<{ day: string }>(),
      ]);
      const hidden = new Set(preview ? [] : unshared.map((d) => d.day));
      const results = [];
      for (const r of rows) {
        if (hidden.has(r.day) || held(r.day)) continue;
        const note = {
          id: r.id,
          day: r.day,
          page: r.page,
          seq: r.seq,
          position: r.position ?? 0,
          deletedAt: null,
          private: false,
          book: r.book,
          chapter: r.chapter,
          verse: r.verse,
          verseEnd: r.verse_end,
          text: r.text,
          createdAt: 0,
          updatedAt: 0,
        };
        if (!matchesNote(note, search)) continue;
        results.push({ id: r.id, day: r.day, page: r.page, book: r.book, chapter: r.chapter, verse: r.verse, verseEnd: r.verse_end, text: r.text.slice(0, 600) });
        if (results.length >= 40) break;
      }
      return Response.json({ study, search, results }, { headers: noStore });
    }

    const [{ results: dayRows }, { results: refRows }, { results: wordDays }] = await Promise.all([
      db.prepare("SELECT day, title, takeaway, shared, video FROM study_days").all<{
        day: string;
        title: string | null;
        takeaway: string | null;
        shared: number;
        video: string | null;
      }>(),
      db
        .prepare(
          "SELECT day, book, chapter FROM study_notes WHERE deleted_at IS NULL AND private = 0 AND day IS NOT NULL " +
            "GROUP BY day, book, chapter ORDER BY day, MIN(position), MIN(seq)",
        )
        .all<{ day: string; book: number | null; chapter: number | null }>(),
      db
        .prepare("SELECT DISTINCT day FROM study_words WHERE deleted_at IS NULL AND day IS NOT NULL")
        .all<{ day: string }>(),
    ]);

    const info = new Map(dayRows.map((d) => [d.day, d]));
    const visible = (d: string) => preview || (info.get(d)?.shared !== 0 && !held(d));

    // Contents: every day with something to read, oldest first.
    const chapters = new Map<string, string[]>();
    const passages = new Map<string, string[]>(); // "book:chapter" per day
    for (const r of refRows) {
      const list = chapters.get(r.day) ?? [];
      const keys = passages.get(r.day) ?? [];
      const p = passageOf({ book: r.book, chapter: r.chapter, verse: null, verseEnd: null });
      if (p && !list.includes(chapterLabel(p))) list.push(chapterLabel(p));
      if (p && !keys.includes(`${p.book}:${p.chapter}`)) keys.push(`${p.book}:${p.chapter}`);
      chapters.set(r.day, list);
      passages.set(r.day, keys);
    }
    for (const w of wordDays) if (!chapters.has(w.day)) chapters.set(w.day, []);
    const contents = [...chapters.keys()]
      .filter(visible)
      .sort()
      .map((d) => ({
        day: d,
        title: info.get(d)?.title ?? "",
        chapters: chapters.get(d) ?? [],
        passages: passages.get(d) ?? [],
        shared: info.get(d)?.shared !== 0,
      }));

    // Session videos: published by the owner on purpose, so each shows on its
    // date whatever else is on the day - except days he keeps out entirely.
    const videos = dayRows
      .filter((r) => r.video && r.shared !== 0)
      .map((r) => ({ day: r.day, video: r.video as string }))
      .sort((a, b) => a.day.localeCompare(b.day));

    if (url.searchParams.get("only") === "contents") {
      return Response.json({ study, preview, contents, videos }, { headers: noStore });
    }

    // Which day: as asked (?day, or ?on = a date in any year - the plan
    // comes round each year). With neither: today's date, else the latest.
    const days = contents.map((c) => c.day);
    const asked = url.searchParams.get("day");
    const on = url.searchParams.get("on");
    const latestOn = (md: string) => [...days].reverse().find((d) => d.slice(5) === md) ?? null;
    const day = asked
      ? isDay(asked) && days.includes(asked)
        ? asked
        : null
      : on
        ? latestOn(on)
        : (latestOn(new Date().toISOString().slice(5, 10)) ?? days[days.length - 1] ?? null);

    if (!day) {
      return Response.json({ study, preview, contents, day: null, notes: [], words: [] }, { headers: noStore });
    }

    const [{ results: noteRows }, { results: wordRows }] = await Promise.all([
      db
        .prepare(
          "SELECT id, day, page, book, chapter, verse, verse_end, text, private, position, seq FROM study_notes " +
            "WHERE day = ?1 AND deleted_at IS NULL ORDER BY position, seq",
        )
        .bind(day)
        .all<NoteRow>(),
      db
        .prepare("SELECT json FROM study_words WHERE day = ?1 AND deleted_at IS NULL ORDER BY created_at")
        .bind(day)
        .all<{ json: string }>(),
    ]);

    const notes = noteRows
      .filter((n) => !n.private)
      .map((n) => ({
        id: n.id,
        page: n.page,
        book: n.book,
        chapter: n.chapter,
        verse: n.verse,
        verseEnd: n.verse_end,
        text: n.text,
      }));
    const words: ReaderWord[] = [];
    for (const r of wordRows) {
      try {
        const w = JSON.parse(r.json) as BibleWord;
        words.push({
          id: w.id,
          word: w.word,
          language: w.language,
          original: w.original,
          translit: w.translit,
          strongs: w.strongs,
          originalMeaning: w.originalMeaning,
          englishMeaning: w.englishMeaning,
          application: w.application,
          keyVerses: w.keyVerses,
        });
      } catch {
        // skip a damaged entry
      }
    }
    const d = info.get(day);
    return Response.json(
      {
        study,
        preview,
        contents,
        day,
        info: {
          title: d?.title ?? "",
          takeaway: d?.takeaway ?? "",
          shared: d?.shared !== 0,
          video: d?.video ?? null,
          ...(preview && inHold(day, settings.hold) ? { held: true } : {}),
        },
        notes,
        words,
        ...(preview ? { hidden: noteRows.length - notes.length } : {}),
      },
      { headers: noStore },
    );
  } catch (e) {
    console.error("study read:", e);
    return Response.json({ error: "Couldn't open the study." }, { status: 500 });
  }
}
