export default function BookingsPage() {
  return (
    <main className="relative overflow-hidden bg-[#05070b] text-white">
      {/* Background atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_30%),radial-gradient(circle_at_70%_40%,rgba(110,76,255,0.10),transparent_28%),radial-gradient(circle_at_30%_80%,rgba(255,200,120,0.08),transparent_24%)]" />
      <div className="absolute inset-0 bg-black/35" />

      <section className="relative mx-auto max-w-6xl px-6 pb-20 pt-24 md:px-8 md:pt-32">
        {/* Hero */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.38em] text-[#d6b25e]">
            Bookings & Enquiries
          </p>

          <h1 className="text-4xl font-light tracking-[-0.04em] text-[#f6f1e8] md:text-6xl">
            Book Daniel for live worship
            <span className="block text-[#d6b25e]">& commissioned songs</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/72 md:text-lg">
            Daniel is available for worship gatherings, church services, conferences,
            special ministry events, and select commissioned songs written with care
            for meaningful moments, stories, and milestones.
          </p>
        </div>

        {/* Offer cards */}
        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-md shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#d6b25e]">
              Live Bookings
            </p>

            <h2 className="mt-4 text-3xl font-light tracking-[-0.03em] text-[#f6f1e8]">
              Invite Daniel to minister live
            </h2>

            <p className="mt-5 text-base leading-8 text-white/74">
              Available for worship nights, church services, conferences, prayer
              gatherings, intimate events, and special appearances. Each invitation
              is approached prayerfully, with a desire to serve the room well and
              honour what God is doing.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-white/78">
              {[
                "Church services and worship nights",
                "Conferences and ministry events",
                "Private gatherings and special occasions",
                "Zimbabwe and selected travel invitations",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#d6b25e]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <a
              href="/contact"
              className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#d6b25e] px-6 text-sm font-semibold uppercase tracking-[0.16em] text-black transition hover:scale-[1.02] hover:bg-[#e7c56f]"
            >
              Enquire about a booking
            </a>
          </div>

          <div className="rounded-[28px] border border-[#d6b25e]/22 bg-[#d6b25e]/[0.06] p-8 backdrop-blur-md shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#d6b25e]">
              Commissioned Songs
            </p>

            <h2 className="mt-4 text-3xl font-light tracking-[-0.03em] text-[#f6f1e8]">
              Request an original song
            </h2>

            <p className="mt-5 text-base leading-8 text-white/74">
              Daniel also accepts select commissioned song requests. These are
              original songs created with intention for personal stories, weddings,
              memorials, church themes, testimonies, or moments that deserve to be
              remembered in a meaningful way.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-white/78">
              {[
                "Personal songs with a specific story or message",
                "Wedding or anniversary songs",
                "Memorial or tribute songs",
                "Church themes, events, or ministry moments",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#d6b25e]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <a
              href="/contact"
              className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/14 bg-white/[0.03] px-6 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:scale-[1.02] hover:bg-white/[0.07]"
            >
              Request a commissioned song
            </a>
          </div>
        </div>

        {/* Who this is for */}
        <div className="mt-16 rounded-[30px] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-md">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#d6b25e]">
                Who this is for
              </p>

              <h3 className="mt-4 text-3xl font-light tracking-[-0.03em] text-[#f6f1e8]">
                For churches, families, and meaningful moments
              </h3>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
                Whether you are inviting Daniel to lead worship or looking to mark a
                story through music, this page is for people who want something
                thoughtful, sincere, and rooted in meaning rather than something
                generic.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                "Churches and ministries",
                "Conferences and worship events",
                "Couples and families",
                "People wanting a song with personal meaning",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/80"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Process */}
        <div className="mt-16">
          <div className="mb-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#d6b25e]">
              Simple Process
            </p>
            <h3 className="mt-3 text-3xl font-light tracking-[-0.03em] text-[#f6f1e8]">
              How it works
            </h3>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Send an enquiry",
                body: "Share your event, occasion, location, date, or the kind of song you have in mind.",
              },
              {
                step: "02",
                title: "Discuss the details",
                body: "You’ll receive a response to clarify the vision, practical details, and availability.",
              },
              {
                step: "03",
                title: "Confirm the invitation",
                body: "Once aligned, the booking or commissioned project can be confirmed and scheduled.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md"
              >
                <span className="text-xs uppercase tracking-[0.3em] text-[#d6b25e]">
                  {item.step}
                </span>
                <h4 className="mt-4 text-xl font-light text-[#f6f1e8]">
                  {item.title}
                </h4>
                <p className="mt-3 text-sm leading-7 text-white/70">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-[32px] border border-[#d6b25e]/20 bg-[linear-gradient(135deg,rgba(214,178,94,0.14),rgba(255,255,255,0.03))] p-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-[#d6b25e]">
            Get in touch
          </p>

          <h3 className="mt-4 text-3xl font-light tracking-[-0.03em] text-[#f6f1e8] md:text-4xl">
            Enquire about a live booking or commissioned song
          </h3>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/72">
            Whether you are planning a worship gathering, special event, or looking
            to create a song with personal meaning, you are welcome to get in touch.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/contact"
              className="inline-flex min-h-[54px] items-center justify-center rounded-full bg-[#d6b25e] px-7 text-sm font-semibold uppercase tracking-[0.16em] text-black transition hover:scale-[1.02] hover:bg-[#e7c56f]"
            >
              Send an enquiry
            </a>

            <a
              href="/album/from-darkness-to-light"
              className="inline-flex min-h-[54px] items-center justify-center rounded-full border border-white/14 bg-white/[0.03] px-7 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:scale-[1.02] hover:bg-white/[0.07]"
            >
              Listen to the music
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
