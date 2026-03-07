import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cancelled",
  description: "Your payment was cancelled.",
};

export default function CancelPage() {
  return (
    <div className="pt-24">
      <section className="w-full py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="modo-title text-white mb-6">Payment Cancelled</h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10">
            No worries — nothing was charged. You can try again whenever
            you&apos;re ready.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/store"
              className="inline-block px-6 py-3 bg-[var(--colour-amber)] text-[var(--colour-bg)] text-sm font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity rounded-lg"
            >
              Back to Store
            </Link>
            <Link
              href="/give"
              className="inline-block px-6 py-3 border border-white/20 text-white/80 text-sm font-semibold uppercase tracking-widest hover:border-white/40 transition-colors rounded-lg"
            >
              Give Instead
            </Link>
          </div>

          <div className="mt-10">
            <Link
              href="/"
              className="text-sm text-white/50 hover:text-white/80 transition-colors underline underline-offset-4"
            >
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
