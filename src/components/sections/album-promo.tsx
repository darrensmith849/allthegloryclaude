import Image from "next/image";
import Link from "next/link";
import { assets } from "@/content/assets";

export default function AlbumPromo() {
  return (
    <section className="bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
        <div className="panel-scrim p-6 md:p-8 grid gap-6 md:grid-cols-[360px_1fr] items-center">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 h-[240px] md:h-[320px]">
            <Image
              src={assets.tunnel}
              alt="Album image"
              fill
              sizes="(max-width: 768px) 100vw, 360px"
              className="object-cover"
              style={{ filter: "brightness(1.28) contrast(1.08) saturate(1.06)" }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 to-black/70" />
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-white/70">Album</div>
            <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-white/92">
              From Darkness To Light
            </h2>

            <p className="subtitle-glyph mt-2 text-sm md:text-base text-white/75">
              Ⅎɹoɯ ᗡɐɹʞuǝss †o 𝕃Ɨ𝕘𝓱𝐓
            </p>

            <p className="mt-4 text-sm md:text-base text-white/70 leading-relaxed">
              A testimony of truth and freedom — from darkness to light.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/store" className="btn btn-primary">Buy album ($10) →</Link>
              <Link href="/give" className="btn btn-ghost">Give / donate →</Link>
            </div>

            <p className="mt-4 text-xs text-white/55">
              Purchasing or giving supports new music directly. Streaming helps, but it typically returns far less per listen than a single purchase or donation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
