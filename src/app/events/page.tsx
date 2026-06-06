import Link from "next/link";
import ProcessSteps from "@/components/ui/process-steps";
import FAQ from "@/components/ui/faq";

const processSteps = [
  {
    title: "Share the story",
    body: "Tell us who it's for, the moment it marks, and the sound you're imagining. A short brief is all we need to begin.",
  },
  {
    title: "Write the song",
    body: "An initial draft is written and recorded - lyrics, melody, arrangement - shaped prayerfully around your brief.",
  },
  {
    title: "Refine together",
    body: "One round of revisions keeps the song true to you: tweak a line, a mood, a bridge, until it reads right.",
  },
  {
    title: "Master & deliver",
    body: "Final mix and master, delivered as high-resolution audio with all rights for personal and church use.",
  },
];

const faqItems = [
  {
    q: "How long does a commission take?",
    a: "Typical turnaround is 4–6 weeks from brief to final master. If you're working to a specific date - a wedding, a memorial, a conference - let us know in your first message and we'll confirm timing before starting.",
  },
  {
    q: "What do you need from me to begin?",
    a: "A short written brief is ideal - who the song is for, the occasion, any scripture or phrases that matter, and the emotional weight you want it to carry. Reference tracks are welcome but not required.",
  },
  {
    q: "Can I request revisions?",
    a: "Yes. One round of revisions is included to make sure the song truly lands. Further revisions can be accommodated on request.",
  },
  {
    q: "What format is the final song delivered in?",
    a: "High-resolution WAV and MP3 files, plus a PDF chord chart on request. Ideal for personal listening, church presentations, or adding to a worship setlist.",
  },
  {
    q: "Can we use the song in our church service or event?",
    a: "Absolutely. Commissioned songs are delivered with full rights for personal and church use. Commercial usage (film, broadcast, resale) can be discussed separately.",
  },
  {
    q: "How is the commission priced?",
    a: "Pricing depends on scope - solo vocal & guitar versus a full-band production is a different body of work. Reach out with your brief and we'll send a quote within 48 hours.",
  },
];

export default function BookingsPage() {
  return (
    <main className="bg-transparent overflow-x-clip">
      <div className="mx-auto w-full max-w-3xl px-6 pt-32 md:pt-40 pb-14 md:pb-16">
        <header className="text-center">
          <div className="eyebrow">Commissioned Work</div>
          <h1 className="font-display mt-4 text-4xl md:text-6xl font-normal text-white tracking-tight">
            Songs that{" "}
            <span className="italic text-[var(--colour-amber)]">carry weight</span>
          </h1>
          <p className="mt-5 text-sm md:text-base text-white/65 max-w-xl mx-auto leading-relaxed">
            Original songs written and recorded to carry a specific
            message, ministry, or milestone.
          </p>
        </header>

        <section
          className="mt-14 panel-scrim p-7 md:p-10"
          aria-labelledby="commission-heading"
        >
          <div className="eyebrow eyebrow-amber">Request an original song</div>
          <h2
            id="commission-heading"
            className="font-display mt-3 text-2xl md:text-3xl font-normal text-white tracking-tight"
          >
            Your story, set to music
          </h2>
          <p className="mt-4 text-sm md:text-base text-white/70 leading-relaxed">
            Bespoke songs crafted for personal testimonies, weddings,
            memorials, church themes, or moments that deserve to be
            remembered. Each commission is approached prayerfully and
            with care.
          </p>
          <div className="mt-7">
            <Link href="/contact" className="btn btn-primary">
              Start a conversation →
            </Link>
          </div>
        </section>
      </div>

      <ProcessSteps
        eyebrow="How it works"
        title="From brief to final master"
        steps={processSteps}
      />

      <FAQ
        eyebrow="Frequently asked"
        title="Questions, answered"
        items={faqItems}
      />

      <section className="mx-auto w-full max-w-3xl px-6 pb-24 md:pb-32">
        <div className="panel-scrim p-8 md:p-10 text-center">
          <div className="eyebrow eyebrow-amber">Ready when you are</div>
          <h2 className="font-display mt-3 text-2xl md:text-3xl font-normal text-white tracking-tight">
            Let&apos;s write something that matters
          </h2>
          <p className="mt-4 text-sm md:text-base text-white/65 max-w-md mx-auto leading-relaxed">
            Every song begins with a conversation. Share the story -
            we&apos;ll take it from there.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 justify-center">
            <Link href="/contact" className="btn btn-primary">
              Start a conversation →
            </Link>
            <Link href="/about" className="btn btn-ghost">
              About →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
