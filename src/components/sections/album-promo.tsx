import Image from "next/image";
import Link from "next/link";
import { assets } from "@/content/assets";

export default function AlbumPromo() {
  return (
    <section className="bg-transparent">
      <div className="mx-auto w-full max-w-xl px-6 pt-0 pb-44 md:pt-0 md:pb-56">
        <Link
          href="/album/from-darkness-to-light"
          className="block group"
        >
          {/* Album image */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 h-[280px] md:h-[360px]">
            <Image
              src={assets.albumArt}
              alt="Album artwork"
              fill
              sizes="(max-width: 768px) 100vw, 520px"
              className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 to-black/55" />
          </div>
        </Link>

        <div className="mt-2 mb-4 text-center text-xs text-white/55">
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

        <Link
          href="/album/from-darkness-to-light"
          className="block group"
        >
          {/* Glass panel with text */}
          <div className="panel-scrim p-6 md:p-7 text-center group-hover:border-white/20 transition-colors duration-300">
            <div className="eyebrow eyebrow-amber">The Album</div>

            <p className="subtitle-glyph mt-3 text-lg md:text-xl text-white/90 group-hover:text-[var(--colour-amber)] transition-colors duration-300">
              Ⅎɹoɯ ᗡɐɹʞuǝss †o 𝕃Ɨ𝕘𝓱𝐓
            </p>

            <p className="font-display mt-2 text-base md:text-lg text-white/75 italic">
              A testimony of truth and freedom
            </p>

            <div className="mt-5 text-[11px] uppercase tracking-[0.22em] text-white/55 group-hover:text-[var(--colour-amber)] transition-colors duration-300">
              Listen now →
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
