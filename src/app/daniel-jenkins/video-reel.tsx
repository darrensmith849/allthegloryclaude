"use client";

import { useEffect, useRef, useState } from "react";

export type Reel = { id: string; title: string; year: string; note: string };

// Best thumbnail first; step down when a size is missing for a video.
const SIZES = ["maxresdefault", "sddefault", "hqdefault"];
function nextThumb(img: HTMLImageElement, id: string) {
  const i = SIZES.findIndex((s) => img.src.includes(s));
  if (i >= 0 && i < SIZES.length - 1) img.src = `https://i.ytimg.com/vi/${id}/${SIZES[i + 1]}.jpg`;
}

// One player box: the featured video large, every reel listed beside it
// (underneath on phones) in a scrollable list. Tapping a reel loads it into
// the big player. Thumbnails stand in until something is played, so the
// page doesn't load heavy YouTube players up front.
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
    <div className="grid grid-cols-[minmax(0,1fr)] border border-[var(--dj-dline)] lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* Main player */}
      <div className="border-b border-[var(--dj-dline)] p-3 sm:p-4 lg:border-b-0 lg:border-r">
        <div className="relative aspect-video overflow-hidden bg-black">
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
            <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 h-full w-full" aria-label={`Play ${active.title}`}>
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
                className="h-full w-full scale-[1.01] object-cover opacity-75 transition duration-[1.2s] ease-out group-hover:scale-[1.04] group-hover:opacity-90"
              />
              <span className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 font-[family-name:var(--dj-mono)] text-[11px] uppercase tracking-[0.2em] text-white backdrop-blur-sm transition duration-500 group-hover:scale-110 group-hover:border-white group-hover:bg-white group-hover:text-black sm:h-28 sm:w-28">
                Play
              </span>
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-1 pt-4">
          <p className="font-[family-name:var(--dj-serif)] text-3xl leading-tight text-[var(--dj-paper)] sm:text-4xl">
            {active.title}
          </p>
          <p className="font-[family-name:var(--dj-mono)] text-[11px] uppercase tracking-[0.15em] text-[var(--dj-paper)]/50">
            {playing ? "Now playing" : "Featured"} &mdash; {active.note}, {active.year}
          </p>
        </div>
      </div>

      {/* Playlist */}
      <div className="flex min-h-0 flex-col lg:relative">
        <div className="flex min-h-0 flex-col lg:absolute lg:inset-0">
          <div className="flex items-center justify-between border-b border-[var(--dj-dline)] px-4 py-3 font-[family-name:var(--dj-mono)] text-[11px] uppercase tracking-[0.15em] text-[var(--dj-paper)]/50">
            <span>Index</span>
            <span>{String(reels.length).padStart(2, "0")} films</span>
          </div>
          <ol className="dj-scroll max-h-[340px] min-h-0 overflow-y-auto lg:max-h-none lg:flex-1">
            {reels.map((r, i) => {
              const on = r.id === active.id;
              return (
                <li key={r.id} className="border-b border-[var(--dj-dline)] last:border-b-0">
                  <button
                    type="button"
                    onClick={() => pick(r)}
                    aria-current={on}
                    className={`group flex w-full items-center gap-4 px-4 py-4 text-left transition-colors duration-300 ${on ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}
                  >
                    <span className={`w-6 shrink-0 font-[family-name:var(--dj-mono)] text-[11px] ${on ? "text-[var(--dj-accent-l)]" : "text-[var(--dj-paper)]/40"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="relative block aspect-video w-[88px] shrink-0 overflow-hidden bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`https://i.ytimg.com/vi/${r.id}/mqdefault.jpg`} alt="" loading="lazy" className={`h-full w-full object-cover transition duration-500 ${on ? "opacity-100" : "opacity-60 grayscale group-hover:opacity-90 group-hover:grayscale-0"}`} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-[family-name:var(--dj-serif)] text-xl leading-tight text-[var(--dj-paper)]">{r.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--dj-paper)]/45">{r.note}</span>
                    </span>
                    <span className="shrink-0 font-[family-name:var(--dj-mono)] text-[11px] text-[var(--dj-paper)]/40">
                      {on && playing ? <span className="dj-eq inline-flex h-3 items-end gap-[2px]"><i /><i /><i /></span> : r.year}
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
