"use client";

import Image from "next/image";
import Link from "next/link";
import { album } from "@/content/album";

function TrackRow({
  index,
  title,
}: {
  index: number;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 md:px-6 md:py-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.24em] text-white/45">
            Track {String(index).padStart(2, "0")}
          </div>
          <div className="mt-1 text-base md:text-lg font-semibold text-white/90 truncate">
            {title}
          </div>
        </div>

        <span className="shrink-0 text-xs uppercase tracking-[0.26em] text-white/55">
          Preview
        </span>
      </div>
    </div>
  );
}

export default function AlbumPage() {
  const railH = "min(520px, 62vh)";

  return (
    <main className="bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-6 py-14 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[minmax(340px,520px)_minmax(420px,1fr)_340px] items-start">
          <section>
            <div
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20"
              style={{
                width: "100%",
                maxWidth: "520px",
                height: railH,
              }}
            >
              <Image
                src={album.coverImage}
                alt="Album cover"
                fill
                sizes="(max-width: 1024px) 100vw, 520px"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />
            </div>

            <div className="mt-3 text-xs text-white/55 max-w-[520px]">
              Artwork by{" "}
              <a
                href="https://debbieclarkart.com/"
                target="_blank"
                rel="noreferrer"
                className="text-white/75 underline decoration-white/20 underline-offset-4 hover:text-white"
              >
                Debbie Clarke
              </a>
            </div>
          </section>

          <section className="relative" style={{ height: railH }}>
            <div className="flex h-full flex-col min-w-0">
              <div className="mb-4">
                <h2 className="text-xl md:text-2xl font-semibold text-white/90">
                  Tracklist
                </h2>
              </div>

              <div
                className="relative flex-1 overflow-y-auto pr-2"
                style={{ scrollbarGutter: "stable" }}
              >
                <div className="pointer-events-none absolute left-0 right-0 top-0 h-10 bg-gradient-to-b from-black/40 to-transparent z-10" />
                <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-12 bg-gradient-to-t from-black/40 to-transparent z-10" />

                <div className="grid gap-4 pb-10">
                  {album.tracks.map((t, i) => (
                    <TrackRow key={t.title} index={i + 1} title={t.title} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <aside
            className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-7"
            style={{ height: railH }}
          >
            <div className="flex items-center gap-3">
              <Link href="/store" className="btn btn-primary whitespace-nowrap">
                Download free →
              </Link>
              <Link href="/give" className="btn btn-ghost whitespace-nowrap">
                Give →
              </Link>
            </div>

            <p className="mt-6 text-sm text-white/65 leading-relaxed">
              I didn't want to put a price on worship — this is an offering unto the Lord.
            </p>

            <p className="mt-3 text-xs text-white/55 leading-relaxed">
              If you feel led to support the work, your gift goes directly into recording,
              production, and releasing more music.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
