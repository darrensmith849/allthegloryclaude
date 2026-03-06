import type { Metadata } from "next";
import { albumConfig } from "@/content/album";
import SafeImage from "@/components/ui/safe-image";

export const metadata: Metadata = {
  title: "From Darkness To Light",
  description: "From Darkness To Light — the debut album by All The Glory.",
};

export default function AlbumPage() {
  return (
    <div className="pt-24">
      <section className="w-full py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-start">
            {/* Cover */}
            <div className="w-full md:w-96 lg:w-[28rem] flex-shrink-0">
              <div className="image-flow-tile aspect-square">
                <SafeImage
                  src={albumConfig.cover}
                  alt={albumConfig.title}
                  className="w-full h-full object-cover"
                />
                <div className="image-flow-gradient" />
              </div>
            </div>

            {/* Details */}
            <div className="flex-1">
              <p className="text-sm text-colour-accent uppercase tracking-widest mb-3">
                {albumConfig.year} &middot; Album
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-colour-fg tracking-tight mb-4">
                {albumConfig.title}
              </h1>
              <p className="subtitle-glyph text-colour-fg/50 mb-10">
                {albumConfig.subtitle}
              </p>

              {/* Streaming links */}
              <div className="flex flex-wrap gap-3 mb-12">
                {Object.entries(albumConfig.streamingLinks).map(
                  ([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      className="px-6 py-2.5 bg-colour-accent text-colour-bg text-sm font-semibold uppercase tracking-widest hover:bg-colour-fg transition-colors"
                    >
                      {platform === "appleMusic"
                        ? "Apple Music"
                        : platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </a>
                  )
                )}
              </div>

              {/* Tracklist */}
              <h2 className="text-xl font-semibold text-colour-fg mb-6">
                Tracklist
              </h2>
              <div className="space-y-1">
                {albumConfig.tracklist.map((track) => (
                  <div
                    key={track.number}
                    className="flex items-center gap-4 py-3 border-b border-colour-fg/10 hover:bg-colour-fg/5 transition-colors px-2 -mx-2 rounded"
                  >
                    <span className="text-sm text-colour-fg/30 w-8 tabular-nums">
                      {String(track.number).padStart(2, "0")}
                    </span>
                    <span className="text-colour-fg/80 font-medium">
                      {track.title}
                    </span>
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
