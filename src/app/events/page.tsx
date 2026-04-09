import Link from "next/link";

export default function BookingsPage() {
  return (
    <main className="bg-transparent overflow-x-clip">
      <div className="mx-auto w-full max-w-5xl px-6 pt-32 md:pt-40 pb-20 md:pb-28 min-h-[78vh] md:min-h-[82vh]">
        {/* Hero */}
        <header className="mx-auto max-w-3xl text-center">
          <div className="eyebrow">Bookings & Enquiries</div>
          <h1 className="font-display mt-4 text-4xl md:text-6xl font-normal text-white tracking-tight">
            Live worship &{" "}
            <span className="italic text-[var(--colour-amber)]">
              commissioned songs
            </span>
          </h1>
          <p className="mt-5 text-sm md:text-base text-white/65 max-w-xl mx-auto leading-relaxed">
            For invitations, ministry enquiries, and original songs
            written and recorded upon request.
          </p>
        </header>

        {/* Two offers */}
        <div className="mt-14 md:mt-20 grid gap-5 md:gap-6 lg:grid-cols-2">
          <section
            className="panel-scrim p-7 md:p-10 flex flex-col"
            aria-labelledby="live-heading"
          >
            <div className="eyebrow eyebrow-amber">Live Bookings</div>
            <h2
              id="live-heading"
              className="font-display mt-3 text-2xl md:text-3xl font-normal text-white tracking-tight"
            >
              Invite Daniel to minister
            </h2>
            <p className="mt-4 text-sm md:text-base text-white/70 leading-relaxed">
              Worship nights, church services, conferences, and intimate
              gatherings — across Zimbabwe and beyond. Each invitation is
              received prayerfully.
            </p>
            <div className="mt-7 md:mt-auto pt-4">
              <Link href="/contact" className="btn btn-primary">
                Enquire about a booking →
              </Link>
            </div>
          </section>

          <section
            className="panel-scrim p-7 md:p-10 flex flex-col"
            aria-labelledby="song-heading"
          >
            <div className="eyebrow eyebrow-amber">Commissioned Songs</div>
            <h2
              id="song-heading"
              className="font-display mt-3 text-2xl md:text-3xl font-normal text-white tracking-tight"
            >
              Request an original song
            </h2>
            <p className="mt-4 text-sm md:text-base text-white/70 leading-relaxed">
              Bespoke songs — written and recorded — to carry a personal
              story, testimony, or moment worth remembering.
            </p>
            <div className="mt-7 md:mt-auto pt-4">
              <Link href="/contact" className="btn btn-ghost">
                Request a song →
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
