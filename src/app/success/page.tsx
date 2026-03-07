import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thank You",
  description: "Thank you for your purchase!",
};

export default function SuccessPage() {
  return (
    <div className="pt-24">
      <section className="w-full py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="modo-title text-white mb-6">Thank You!</h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10">
            Your support means everything. You&apos;re helping carry this music
            and message to people who need it.
          </p>

          <div className="panel-soft p-6 md:p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-4">
              Download Your Album
            </h2>
            <p className="text-white/60 text-sm mb-6">
              Click below to download &ldquo;From Darkness To Light&rdquo; in
              high-quality audio.
            </p>
            <a
              href="/downloads/from-darkness-to-light.zip"
              download
              className="inline-block px-8 py-3 bg-[var(--colour-amber)] text-[var(--colour-bg)] text-sm font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity rounded-lg"
            >
              Download Album
            </a>
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
