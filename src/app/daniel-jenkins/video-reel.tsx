"use client";

import { useRef, useState } from "react";

export type Reel = { id: string; title: string; year: string; note: string };

// Side-by-side showreels. Each card shows the YouTube thumbnail until it's
// tapped, then swaps in the player - so the page doesn't load five heavy
// YouTube players up front.
export default function VideoReel({ reels }: { reels: Reel[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  const nudge = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 400) + 20), behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div className="mb-5 flex items-center justify-end gap-2 px-4 sm:px-8 lg:px-16">
        <button type="button" onClick={() => nudge(-1)} aria-label="Previous video" className="dj-arrow">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <button type="button" onClick={() => nudge(1)} aria-label="Next video" className="dj-arrow">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>

      <div
        ref={track}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-6 sm:px-8 lg:px-16 dj-noscroll"
      >
        {reels.map((r) => (
          <article
            key={r.id}
            data-card
            className="w-[86vw] shrink-0 snap-center sm:w-[560px] lg:w-[680px]"
          >
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
              {playing === r.id ? (
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${r.id}?autoplay=1&rel=0&playsinline=1`}
                  title={r.title}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setPlaying(r.id)}
                  className="group absolute inset-0 h-full w-full"
                  aria-label={`Play ${r.title}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://i.ytimg.com/vi/${r.id}/hqdefault.jpg`}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#c4462f] text-white shadow-xl transition group-hover:scale-110">
                    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                </button>
              )}
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-sm font-semibold tracking-widest text-[#e0a96d]">{r.year}</span>
              <h3 className="font-display text-xl text-white sm:text-2xl">{r.title}</h3>
            </div>
            <p className="mt-1 text-sm text-white/55">{r.note}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
