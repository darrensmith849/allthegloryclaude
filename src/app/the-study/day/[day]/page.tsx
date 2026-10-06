// A public preview of one of the owner's days, for "Share this day" links:
// the day, its title, the chapters and the takeaway - never the notes or
// words themselves, which stay for members. Only days the owner shares (and
// isn't holding back until next year), and only while the study is open to
// readers (members or everyone).

import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/analytics/store";
import { chapterLabel, dayLabel, isDay, passageOf, planDay } from "@/lib/dashboard/notes";
import { isHeld } from "@/lib/study/hold";
import { getSettings } from "@/lib/study/members";
import { bibleAppDay, STUDY_HEART } from "@/lib/study/plan";

export const dynamic = "force-dynamic";

interface DayPreview {
  day: string;
  title: string;
  takeaway: string;
  chapters: string[];
  author: string;
}

// Once per request (the metadata and the page both ask).
const load = cache(async (day: string): Promise<DayPreview | null> => {
  if (!isDay(day)) return null;
  const db = await getDb();
  if (!db) return null;
  const settings = await getSettings(db);
  if (settings.reading === "off") return null;
  const [info, { results: refs }, words] = await Promise.all([
    db
      .prepare("SELECT title, takeaway, shared FROM study_days WHERE day = ?1")
      .bind(day)
      .first<{ title: string | null; takeaway: string | null; shared: number }>(),
    db
      .prepare(
        "SELECT book, chapter FROM study_notes WHERE day = ?1 AND deleted_at IS NULL AND private = 0 AND book IS NOT NULL " +
          "GROUP BY book, chapter ORDER BY MIN(position), MIN(seq)",
      )
      .bind(day)
      .all<{ book: number | null; chapter: number | null }>(),
    db.prepare("SELECT 1 AS n FROM study_words WHERE day = ?1 AND deleted_at IS NULL LIMIT 1").bind(day).first(),
  ]);
  // Same rule as the reader: a day shows only with shared notes or words,
  // and not while it's held back until next year.
  if (info?.shared === 0 || isHeld(day, settings.hold)) return null;
  if (!refs.length && !words) return null;
  const chapters: string[] = [];
  for (const r of refs) {
    const p = passageOf({ book: r.book, chapter: r.chapter, verse: null, verseEnd: null });
    if (p && !chapters.includes(chapterLabel(p))) chapters.push(chapterLabel(p));
  }
  return { day, title: info?.title ?? "", takeaway: info?.takeaway ?? "", chapters, author: settings.author };
});

const heading = (d: DayPreview) => d.title || d.chapters.join(" · ") || dayLabel(d.day);

export async function generateMetadata({ params }: { params: Promise<{ day: string }> }): Promise<Metadata> {
  const { day } = await params;
  const d = await load(day).catch(() => null);
  if (!d) return { title: "The Study", robots: { index: false } };
  const title = `Day ${planDay(d.day).n}: ${heading(d)}`;
  const description = d.takeaway || `${d.author}'s study for ${dayLabel(d.day)} - read along in The Study from All The Glory.`;
  return {
    title,
    description,
    alternates: { canonical: `/the-study/day/${d.day}` },
    openGraph: {
      title: `${title} - The Study`,
      description,
      url: `/the-study/day/${d.day}`,
      images: [{ url: "/study/og.jpg", width: 1200, height: 630, alt: "The Study - All The Glory" }],
    },
    twitter: { card: "summary_large_image", title: `${title} - The Study`, description, images: ["/study/og.jpg"] },
  };
}

export default async function SharedDayPage({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params;
  const d = await load(day);
  if (!d) notFound();
  const n = planDay(d.day).n;
  const button = "px-7 py-3 font-semibold text-sm uppercase tracking-widest transition-colors";

  return (
    <main className="bg-transparent overflow-x-clip pt-24">
      <section className="w-full pt-14 md:pt-20 pb-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="relative mx-auto mb-6 w-[clamp(96px,14vw,130px)] aspect-square">
            <div
              aria-hidden="true"
              className="absolute inset-0 -m-8 rounded-full blur-3xl opacity-50"
              style={{
                background:
                  "radial-gradient(50% 50% at 50% 55%, rgba(216,178,90,0.55), rgba(216,178,90,0.12) 55%, transparent 75%)",
              }}
            />
            <Image src="/media/logo-dove.png" alt="" fill priority sizes="130px" className="relative object-contain" />
          </div>
          <div className="eyebrow eyebrow-amber mb-4">
            The Study · Day {n} · {dayLabel(d.day)}
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-normal text-white tracking-tight mb-4">{heading(d)}</h1>
          {d.title && d.chapters.length > 0 && (
            <p className="text-sm uppercase tracking-[0.18em] text-white/55 mb-2">{d.chapters.join(" · ")}</p>
          )}

          {d.takeaway && (
            <blockquote className="panel-scrim mt-8 p-6 md:p-8 text-left">
              <p className="font-display text-xl md:text-2xl text-white/90 leading-relaxed">&ldquo;{d.takeaway}&rdquo;</p>
              <footer className="mt-4 text-sm text-white/55">- {d.author}</footer>
            </blockquote>
          )}

          <a
            href={bibleAppDay(n)}
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-8 text-colour-accent hover:text-white transition-colors"
          >
            📖 Read Day {n}&apos;s passages in the Bible App (NIV) ↗
          </a>

          <div className="panel-scrim mt-10 p-6 md:p-8">
            <h2 className="font-display text-2xl text-white mb-3">Read {d.author}&apos;s full notes for this day</h2>
            <p className="text-sm md:text-[15px] text-white/70 leading-relaxed mb-6">{STUDY_HEART}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="/the-study#join" className={`${button} bg-colour-accent text-colour-bg hover:bg-colour-fg`}>
                Join The Study - it&apos;s free
              </a>
              <a
                href={`/the-study?login=1&next=${encodeURIComponent(`/study/read?day=${d.day}`)}`}
                className={`${button} border border-white/25 text-white/85 hover:border-white/60 hover:text-white`}
              >
                Log in
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
