import Image from "next/image";
import Link from "next/link";
import { assets } from "@/content/assets";

export default function AlbumPromo() {
  return (
    <section className="bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
        <div className="panel-scrim p-6 md:p-8 grid gap-6 md:grid-cols-[360px_1fr] items-center">
          {/* Album artwork */}
          <div>
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 h-[240px] md:h-[320px]">
              <Image
                src={assets.albumArt}
                alt="Album artwork"
                fill
                sizes="(max-width: 768px) 100vw, 360px"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 to-black/55" />
            </div>

            <div className="mt-3 text-xs text-white/55">
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
          </div>

          {/* Copy */}
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-white/70">
              Album
            </div>

            <p className="subtitle-glyph mt-3 text-lg md:text-xl text-white/90">
              Ⅎɹoɯ ᗡɐɹʞuǝss †o 𝕃Ɨ𝕘𝓱𝐓
            </p>

            <p className="mt-3 text-sm md:text-base text-white/70">
              A testimony of truth and freedom
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/store" className="btn btn-primary">
                Buy album ($20) →
              </Link>
              <Link href="/give" className="btn btn-ghost">
                Give / donate →
              </Link>
            </div>

            <div className="mt-5 text-xs md:text-sm text-white/62 leading-relaxed max-w-xl">
              Purchasing the album is a meaningful way to support the work — and it shows you value what's being made.
              <br />
              Every purchase and gift goes back into recording, production, and releasing new music.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
