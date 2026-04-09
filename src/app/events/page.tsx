import Link from "next/link";

export default function BookingsPage() {
  return (
    <main className="bg-transparent overflow-x-clip">
      <div className="mx-auto w-full max-w-3xl px-6 pt-32 md:pt-40 pb-20 md:pb-28 min-h-[78vh] md:min-h-[82vh] flex flex-col">
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
    </main>
  );
}
