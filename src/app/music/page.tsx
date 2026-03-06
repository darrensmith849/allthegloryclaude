import type { Metadata } from "next";
import { albumConfig } from "@/content/album";
import SafeImage from "@/components/ui/safe-image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Music",
  description: "Music by All The Glory — From Darkness To Light and more.",
};

export default function MusicPage() {
  return (
    <div className="pt-24">
      <section className="w-full py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="modo-title text-colour-fg mb-6">Music</h1>
          <p className="text-lg md:text-xl text-colour-fg/60">
            Explore the discography.
          </p>
        </div>
      </section>

      <section className="w-full py-12 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href="/album/from-darkness-to-light"
            className="group block"
          >
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
              {/* Album art */}
              <div className="w-full md:w-80 lg:w-96 flex-shrink-0">
                <div className="image-flow-tile aspect-square">
                  <SafeImage
                    src={albumConfig.cover}
                    alt={albumConfig.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="image-flow-gradient" />
                </div>
              </div>

              {/* Album info */}
              <div className="flex-1 py-4">
                <p className="text-sm text-colour-accent uppercase tracking-widest mb-2">
                  {albumConfig.year} &middot; Album
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-colour-fg group-hover:text-colour-accent transition-colors mb-3">
                  {albumConfig.title}
                </h2>
                <p className="subtitle-glyph text-colour-fg/50 mb-8">
                  {albumConfig.subtitle}
                </p>
                <div className="space-y-3">
                  {albumConfig.tracklist.map((track) => (
                    <div
                      key={track.number}
                      className="flex items-center gap-4 py-2 border-b border-colour-fg/10"
                    >
                      <span className="text-sm text-colour-fg/30 w-8 tabular-nums">
                        {String(track.number).padStart(2, "0")}
                      </span>
                      <span className="text-colour-fg/70">{track.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
