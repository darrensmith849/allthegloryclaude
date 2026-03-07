import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Give",
  description: "Support the ministry of All The Glory through a donation.",
};

export default function GivePage() {
  return (
    <div className="pt-24">
      <section className="w-full py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="modo-title text-white mb-6">Give</h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
            Every gift fuels the mission — creating music that points people
            from darkness to light.
          </p>
        </div>
      </section>

      <section className="w-full py-12 md:py-20">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          {/* Donation box */}
          <div className="panel-scrim p-6 md:p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-3">
              Donate Any Amount
            </h2>
            <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-xl mx-auto mb-6">
              Choose any amount you&apos;d like to give. Your generosity
              directly funds studio time, worship events, and getting the
              message of hope to those who need it most.
            </p>
            <a
              href="#"
              className="inline-block px-8 py-3 bg-[var(--colour-amber)] text-[var(--colour-bg)] text-sm font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity rounded-lg"
            >
              Give Now
            </a>
          </div>

          {/* Why give section */}
          <div className="panel-soft p-6 md:p-8">
            <h3 className="text-lg font-semibold text-white mb-3">
              Why Giving Matters More Than Streaming
            </h3>
            <p className="text-white/65 text-sm md:text-base leading-relaxed">
              Streaming platforms pay artists fractions of a penny per play.
              Even thousands of streams barely cover the cost of a single
              recording session. When you give directly, your generosity goes
              straight to the mission — no middleman, no algorithms, no
              gatekeepers. Every dollar funds the music, the ministry, and the
              message. All The Glory is an independent ministry. Your support is
              how this work continues.
            </p>
          </div>

          <p className="text-center text-sm text-white/35 mt-12">
            Donations processed securely via Stripe.
          </p>

          <div className="text-center mt-4">
            <Link
              href="/store"
              className="text-sm text-white/50 hover:text-white/80 transition-colors underline underline-offset-4"
            >
              Or buy the album for $10 &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
