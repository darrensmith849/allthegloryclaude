import Image from "next/image";
import Link from "next/link";
import { site } from "@/content/site";

/**
 * Press & Media kit. Built to answer every question a booking agent,
 * venue producer, or journalist might have in one page — short bio,
 * long bio, photos, downloadable assets, and a direct contact route.
 *
 * Downloadable assets (bio PDF, tech rider, logo pack) link to /downloads
 * paths that can be populated with real files later — until they exist,
 * the browser will 404 gracefully, so it's safe to ship now.
 */

const shortBio =
  "All The Glory is a worship project born from darkness and brought into light — honest songs about struggle, freedom, and hope, grounded in scripture. The debut album From Darkness To Light is available free, because worship was never meant to carry a price tag.";

const longBio = [
  "All The Glory is a worship project that began as a personal reckoning — a season of surrender that turned into song. The music sits at the intersection of modern worship and editorial storytelling: seven tracks, each anchored to a verse of scripture, each carrying the weight of a moment that changed everything.",
  "The debut album, From Darkness To Light, was released in 2025 and is offered free for download. It's built around seven verses — John 19:30, Matthew 14:31, John 11:35, Luke 15:20, Proverbs 3:5, John 3:16, and 2 Corinthians 5:21 — and is intended for personal listening, church settings, and quiet moments of reflection.",
  "Alongside the album, All The Glory writes commissioned songs — bespoke works for weddings, memorials, ministry themes, and church moments that deserve to be remembered. Every song is approached prayerfully, with care, and with the aim of pointing back to the One the music is ultimately for.",
];

const pressPhotos = [
  { src: "/media/guitar.jpg", alt: "Artist press photo — with guitar" },
  { src: "/media/ocean.jpg", alt: "Album artwork — From Darkness To Light" },
  { src: "/media/videos-cover.jpg", alt: "Artist press photo — cinematic" },
];

export default function PressPage() {
  return (
    <main className="bg-transparent overflow-x-clip">
      <div className="mx-auto w-full max-w-5xl px-6 pt-32 md:pt-40 pb-16">
        <header className="text-center">
          <div className="eyebrow">Press & Media</div>
          <h1 className="font-display mt-4 text-4xl md:text-6xl font-normal text-white tracking-tight">
            Everything you need, <span className="italic text-[var(--colour-amber)]">in one place</span>
          </h1>
          <p className="mt-5 text-sm md:text-base text-white/65 max-w-xl mx-auto leading-relaxed">
            Bio, photos, and booking enquiries for press, venues, and
            event organisers. Have a question this page doesn&apos;t
            answer? Get in touch.
          </p>
        </header>
      </div>

      {/* Short bio + asset downloads */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-10 md:pb-14">
        <div className="grid gap-5 md:grid-cols-[1.4fr_1fr] md:gap-6">
          <div className="panel-scrim p-7 md:p-9">
            <div className="eyebrow eyebrow-amber">Short bio</div>
            <p className="mt-4 font-display text-lg md:text-xl text-white/90 italic leading-relaxed">
              {shortBio}
            </p>
          </div>
          <div className="panel-scrim p-7 md:p-9">
            <div className="eyebrow eyebrow-amber">Downloadable assets</div>
            <ul className="mt-5 flex flex-col gap-3 text-sm">
              <li>
                <a
                  href="/downloads/press-bio.pdf"
                  className="flex items-center justify-between gap-3 py-2 text-white/80 hover:text-white transition-colors border-b border-white/10"
                  download
                >
                  <span>Artist bio — PDF</span>
                  <span aria-hidden="true" className="text-white/40">↓</span>
                </a>
              </li>
              <li>
                <a
                  href="/downloads/press-photos.zip"
                  className="flex items-center justify-between gap-3 py-2 text-white/80 hover:text-white transition-colors border-b border-white/10"
                  download
                >
                  <span>High-res photos — ZIP</span>
                  <span aria-hidden="true" className="text-white/40">↓</span>
                </a>
              </li>
              <li>
                <a
                  href="/downloads/tech-rider.pdf"
                  className="flex items-center justify-between gap-3 py-2 text-white/80 hover:text-white transition-colors border-b border-white/10"
                  download
                >
                  <span>Tech rider — PDF</span>
                  <span aria-hidden="true" className="text-white/40">↓</span>
                </a>
              </li>
              <li>
                <a
                  href="/downloads/from-darkness-to-light.zip"
                  className="flex items-center justify-between gap-3 py-2 text-white/80 hover:text-white transition-colors"
                  download
                >
                  <span>Album — ZIP</span>
                  <span aria-hidden="true" className="text-white/40">↓</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Long bio */}
      <section className="mx-auto w-full max-w-3xl px-6 py-10 md:py-14">
        <div className="panel-scrim p-7 md:p-10">
          <div className="eyebrow eyebrow-amber">Long bio</div>
          <h2 className="font-display mt-3 text-2xl md:text-3xl font-normal text-white tracking-tight">
            The story, in full
          </h2>
          <div className="mt-6 space-y-5">
            {longBio.map((p, i) => (
              <p key={i} className="text-sm md:text-base text-white/75 leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Photo grid */}
      <section
        aria-labelledby="press-photos-heading"
        className="mx-auto w-full max-w-5xl px-6 py-10 md:py-14"
      >
        <header className="mb-8 md:mb-10 text-center">
          <div className="eyebrow eyebrow-amber">Press photos</div>
          <h2
            id="press-photos-heading"
            className="font-display mt-3 text-2xl md:text-3xl font-normal text-white tracking-tight"
          >
            High-resolution, royalty-free for editorial use
          </h2>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {pressPhotos.map((photo) => (
            <div
              key={photo.src}
              className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-black/20"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-white/45">
          Download the full press-photo pack above. Please credit{" "}
          <span className="text-white/70">{site.name}</span> when published.
        </p>
      </section>

      {/* Contact CTA */}
      <section className="mx-auto w-full max-w-3xl px-6 pt-10 pb-24 md:pb-32">
        <div className="panel-scrim p-8 md:p-10 text-center">
          <div className="eyebrow eyebrow-amber">Booking & press enquiries</div>
          <h2 className="font-display mt-3 text-2xl md:text-3xl font-normal text-white tracking-tight">
            Get in touch
          </h2>
          <p className="mt-4 text-sm md:text-base text-white/65 max-w-md mx-auto leading-relaxed">
            For interviews, venue bookings, or commissioned work —
            we&apos;ll come back to you within two working days.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 justify-center">
            <Link href="/contact" className="btn btn-primary">
              Contact us →
            </Link>
            <Link href="/events" className="btn btn-ghost">
              Commission a song →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
