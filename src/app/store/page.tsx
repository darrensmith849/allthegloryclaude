import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Store",
  description: "Buy the album — From Darkness To Light by All The Glory.",
};

export default function StorePage() {
  return (
    <div className="pt-24">
      <section className="w-full py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="modo-title text-white mb-6">Store</h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
            Own the music. Support the mission.
          </p>
        </div>
      </section>

      <section className="w-full py-12 md:py-20">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          {/* Album product */}
          <div className="panel-scrim p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white">
                From Darkness To Light — Digital Album
              </h2>
              <p className="mt-2 text-white/60 text-sm">
                Full digital download. All tracks, high-quality MP3 &amp; WAV.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold" style={{ color: "var(--colour-amber)" }}>
                $10
              </span>
              <a
                href="#"
                className="px-6 py-3 bg-[var(--colour-amber)] text-[var(--colour-bg)] text-sm font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity rounded-lg"
              >
                Buy Now
              </a>
            </div>
          </div>

          {/* Why buy section */}
          <div className="panel-soft p-6 md:p-8">
            <h3 className="text-lg font-semibold text-white mb-3">
              Why Buy Instead of Stream?
            </h3>
            <p className="text-white/65 text-sm md:text-base leading-relaxed">
              When you stream a song, the artist earns fractions of a penny —
              often less than $0.004 per play. It can take over 2,500 streams
              just to equal a single album purchase. When you buy directly, 100%
              of your $10 goes straight to funding the music, ministry, and
              mission of All The Glory. Your purchase fuels studio time, worship
              events, and getting the message of hope to those who need it most.
            </p>
          </div>

          <p className="text-center text-sm text-white/35 mt-12">
            Payments processed securely via Stripe.
          </p>

          <div className="text-center mt-4">
            <Link
              href="/give"
              className="text-sm text-white/50 hover:text-white/80 transition-colors underline underline-offset-4"
            >
              Or give a donation to support the ministry &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
