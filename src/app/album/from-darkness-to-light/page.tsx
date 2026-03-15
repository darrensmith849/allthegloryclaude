"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { albumConfig } from "@/content/album";

export default function AlbumPage() {
  const [playing, setPlaying] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function togglePreview(trackNumber: number, src?: string) {
    if (!src) return;

    if (playing === trackNumber) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(src);
    audio.addEventListener("ended", () => setPlaying(null));
    audio.play();
    audioRef.current = audio;
    setPlaying(trackNumber);
  }

  return (
    <div className="pt-24">
      <section className="w-full py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-start">
            {/* Cover */}
            <div className="w-full md:w-96 lg:w-[28rem] flex-shrink-0">
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10">
                <Image
                  src={albumConfig.cover}
                  alt="From Darkness To Light album artwork"
                  fill
                  sizes="(max-width: 768px) 100vw, 28rem"
                  className="object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 to-black/40" />
              </div>
            </div>

            {/* Details */}
            <div className="flex-1">
              <p className="text-sm text-white/55 uppercase tracking-widest mb-3">
                {albumConfig.year} &middot; Album
              </p>
              <h1 className="subtitle-glyph text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4">
                {albumConfig.title}
              </h1>
              <p className="subtitle-glyph text-white/50 mb-10">
                {albumConfig.subtitle}
              </p>

              {/* Streaming links */}
              <div className="flex flex-wrap gap-3 mb-12">
                {Object.entries(albumConfig.streamingLinks).map(
                  ([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      className="btn btn-ghost"
                    >
                      {platform === "appleMusic"
                        ? "Apple Music"
                        : platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </a>
                  )
                )}
              </div>

              {/* Tracklist */}
              <h2 className="text-xl font-semibold text-white mb-6">
                Tracklist
              </h2>
              <div className="space-y-1">
                {albumConfig.tracklist.map((track) => (
                  <div
                    key={track.number}
                    className="flex items-center gap-4 py-3 border-b border-white/10 hover:bg-white/5 transition-colors px-2 -mx-2 rounded"
                  >
                    <span className="text-sm text-white/30 w-8 tabular-nums">
                      {String(track.number).padStart(2, "0")}
                    </span>
                    <span className="text-white/80 font-medium flex-1">
                      {track.title}
                    </span>
                    {track.previewSrc && (
                      <button
                        onClick={() => togglePreview(track.number, track.previewSrc)}
                        className="text-xs uppercase tracking-widest text-white/40 hover:text-white/70 transition-colors"
                      >
                        {playing === track.number ? "Stop" : "Preview"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
