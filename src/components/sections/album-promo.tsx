import Image from "next/image";
import Link from "next/link";
import { assets } from "@/content/assets";

export default function AlbumPromo() {
  return (
    <section className="bg-transparent">
      <div className="mx-auto w-full max-w-xl px-6 py-10 md:py-14">
        <Link
          href="/album/from-darkness-to-light"
          className="block group"
        >
          {/* Album image - centred above the glass */}
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

          {/* Glass panel with text */}
          <div className="mt-6 panel-scrim p-5 md:p-6 text-center group-hover:border-white/20 transition-colors duration-300">
            <div className="text-xs uppercase tracking-[0.28em] text-white/70">
              Album
            </div>

            <p className="subtitle-glyph mt-2 text-lg md:text-xl text-white/90 group-hover:text-[var(--colour-amber)] transition-colors duration-300">
              Ⅎɹoɯ ᗡɐɹʞuǝss †o 𝕃Ɨ𝕘𝓱𝐓
            </p>

            <p className="mt-2 text-sm text-white/70">
              A testimony of truth and freedom
            </p>

            <div className="mt-4 text-xs uppercase tracking-[0.24em] text-white/55 group-hover:text-white/80 transition-colors duration-300">
              Listen now →
            </div>
          </div>
          {/* Artwork credit */}
          <div className="mt-3 panel-scrim p-3 text-center rounded-xl">
            <span className="text-xs text-white/55">
              Artwork by{" "}
              <span className="text-white/75 underline decoration-white/20 underline-offset-4">
                Debbie Clarke
              </span>
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}
