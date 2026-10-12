"use client";

import { useEffect, useRef, useState } from "react";

export type Reel = { id: string; title: string; year: string; note: string };

// One player box: the featured video large, every reel listed beside it
// (underneath on phones) in a scrollable strip. Tapping a reel loads it
// into the big player. Thumbnails stand in until something is played, so
// the page doesn't load heavy YouTube players up front.
// Best thumbnail first; step down when a size is missing for a video.
const SIZES = ["maxresdefault", "sddefault", "hqdefault"];
function nextThumb(img: HTMLImageElement, id: string) {
  const i = SIZES.findIndex((s) => img.src.includes(s));
  if (i >= 0 && i < SIZES.length - 1) img.src = `https://i.ytimg.com/vi/${id}/${SIZES[i + 1]}.jpg`;
}

export default function VideoReel({ reels }: { reels: Reel[] }) {
  const [active, setActive] = useState(reels[0]);
  const [playing, setPlaying] = useState(false);
  const thumb = useRef<HTMLImageElement>(null);

  // The thumbnail may finish loading before React is ready to hear about it.
  useEffect(() => {
    const img = thumb.current;
    if (img?.complete && img.naturalWidth <= 120) nextThumb(img, active.id);
  }, [active.id, playing]);

  const pick = (r: Reel) => {
    setActive(r);
    setPlaying(true);
  };

  return (
    <div className="dj-player grid grid-cols-[minmax(0,1fr)] gap-4 rounded-[28px] border border-[var(--dj-line)] bg-[#14100e]/80 p-3 shadow-[0_40px_120px_-40px_rgba(200,69,44,0.45)] backdrop-blur sm:p-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* Main player */}
      <div>
        <div className="relative aspect-video overflow-hidden rounded-[20px] bg-black">
          {playing ? (
            <iframe
              key={active.id}
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${active.id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`}
              title={active.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 h-full w-full text-left"
              aria-label={`Play ${active.title}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={active.id}
                ref={thumb}
                src={`https://i.ytimg.com/vi/${active.id}/maxresdefault.jpg`}
                onLoad={(e) => {
                  // YouTube serves a tiny grey placeholder when a size doesn't exist.
                  if (e.currentTarget.naturalWidth <= 120) nextThumb(e.currentTarget, active.id);
                }}
                onError={(e) => nextThumb(e.currentTarget, active.id)}
                alt=""
                className="h-full w-full scale-[1.02] object-cover transition duration-700 group-hover:scale-[1.06]"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />
              <span className="dj-pulse absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--dj-rust)] text-white sm:h-24 sm:w-24">
                <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z" /></svg>
              </span>
              <span className="absolute bottom-0 left-0 hidden p-5 sm:block sm:p-8">
                <span className="block text-[11px] font-bold uppercase tracking-[0.35em] text-[var(--dj-amber)]">Featured · {active.year}</span>
                <span className="mt-2 block font-[family-name:var(--dj-poster)] text-4xl uppercase leading-none text-[var(--dj-cream)] sm:text-6xl">{active.title}</span>
                <span className="mt-2 block font-[family-name:var(--dj-serif)] text-lg italic text-[var(--dj-cream)]/75 sm:text-xl">{active.note}</span>
              </span>
            </button>
          )}
        </div>
        <div className={`flex flex-wrap items-baseline gap-x-4 gap-y-1 px-2 pb-1 pt-4 ${playing ? "" : "sm:hidden"}`}>
            <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-[var(--dj-amber)]">{playing ? "Now playing" : "Featured"}</span>
            <span className="font-[family-name:var(--dj-poster)] text-2xl uppercase text-[var(--dj-cream)]">{active.title}</span>
            <span className="font-[family-name:var(--dj-serif)] text-lg italic text-[var(--dj-cream)]/60">{active.note}, {active.year}</span>
        </div>
      </div>

      {/* Playlist */}
      <div className="flex min-h-0 flex-col lg:relative">
        <div className="lg:absolute lg:inset-0 lg:flex lg:flex-col">
        <div className="flex items-center justify-between px-2 pb-3 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-[var(--dj-cream)]/50">All showreels</span>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--dj-cream)]/35">{reels.length} videos</span>
        </div>
        <ol className="dj-scroll flex gap-3 overflow-x-auto pb-2 lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0 lg:pr-1">
          {reels.map((r, i) => {
            const on = r.id === active.id;
            return (
              <li key={r.id} className="w-[220px] shrink-0 lg:w-auto">
                <button
                  type="button"
                  onClick={() => pick(r)}
                  aria-current={on}
                  className={`group flex w-full flex-col gap-3 rounded-2xl p-2 text-left transition lg:flex-row lg:items-center ${
                    on ? "bg-[var(--dj-rust)]/20 ring-1 ring-[var(--dj-rust)]/60" : "hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="relative block aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-black lg:w-[132px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://i.ytimg.com/vi/${r.id}/mqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full ${on ? "bg-[var(--dj-rust)]" : "bg-black/60"} text-white`}>
                        {on && playing ? (
                          <span className="dj-eq flex h-3 items-end gap-[2px]"><i /><i /><i /></span>
                        ) : (
                          <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" className="ml-0.5"><path d="M8 5v14l11-7z" /></svg>
                        )}
                      </span>
                    </span>
                  </span>
                  <span className="min-w-0 px-1">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--dj-amber)]">
                      {String(i + 1).padStart(2, "0")} · {r.year}
                    </span>
                    <span className="mt-1 block font-[family-name:var(--dj-poster)] text-lg uppercase leading-tight text-[var(--dj-cream)]">{r.title}</span>
                    <span className="block truncate text-xs text-[var(--dj-cream)]/50">{r.note}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        </div>
      </div>
    </div>
  );
}
