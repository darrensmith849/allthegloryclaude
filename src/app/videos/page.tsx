import type { Metadata } from "next";
import Image from "next/image";
import { site } from "@/content/site";

const channelUrl = site.socials.youtube;

export const metadata: Metadata = {
  title: "Videos",
  description:
    "Watch All The Glory on YouTube — official music videos, worship sessions, and live content.",
  alternates: { canonical: "/videos" },
  openGraph: {
    title: "Videos — All The Glory",
    description:
      "Watch All The Glory on YouTube — official music videos, worship sessions, and live content.",
    url: "/videos",
    type: "website",
    images: [
      {
        url: "/media/videos-cover.jpg",
        width: 1200,
        height: 630,
        alt: "All The Glory on YouTube",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Videos — All The Glory",
    description:
      "Watch All The Glory on YouTube — official music videos, worship sessions, and live content.",
    images: ["/media/videos-cover.jpg"],
  },
};

export default function VideosPage() {
  return (
    <main className="bg-transparent overflow-x-clip">
      <div className="mx-auto w-full max-w-4xl px-6 pt-32 md:pt-40 pb-20 md:pb-28 min-h-[78vh] md:min-h-[82vh]">
        <header className="text-center">
          <div className="text-xs uppercase tracking-[0.28em] text-white/60">
            Videos
          </div>
          <h1 className="subtitle-glyph mt-3 text-3xl md:text-5xl font-semibold text-white">
            Official YouTube channel
          </h1>
          <p className="mt-4 text-sm md:text-base text-white/65 max-w-md mx-auto leading-relaxed">
            Music videos, worship sessions, and future live content — all on
            YouTube.
          </p>
        </header>

        {/* Channel feature banner — premium destination art, NOT a fake player.
            No play glyph, no click-everything wrapper, no embedded-video framing. */}
        <figure className="relative mt-12 md:mt-14 overflow-hidden rounded-2xl border border-white/10 panel-scrim aspect-[16/9] md:aspect-[21/9]">
          <Image
            src="/media/videos-cover.webp"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 960px"
            className="object-cover"
          />

          {/* Soft gradient at the bottom only, for legibility of the overlay text */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

          {/* Subtle YouTube wordmark — top-right, small and decorative */}
          <div className="absolute top-4 right-4 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/10">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="white"
              aria-hidden="true"
            >
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#09080e" />
            </svg>
            <span className="text-[9px] uppercase tracking-[0.22em] text-white/85 font-semibold">
              YouTube
            </span>
          </div>

          {/* Channel handle — bottom-left, treated as channel banner art */}
          <figcaption className="absolute bottom-5 left-5 right-5 md:bottom-7 md:left-7">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/65">
              Official Channel
            </p>
            <p className="mt-1.5 text-lg md:text-2xl font-semibold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)]">
              @Allthe_glory
            </p>
          </figcaption>
        </figure>

        {/* Real action area, distinct from the banner */}
        <div className="mt-9 md:mt-11 flex flex-col items-center gap-3">
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary inline-flex items-center gap-2"
            aria-label="Watch All The Glory on YouTube (opens in a new tab)"
          >
            Watch on YouTube
            <ExternalLinkIcon />
          </a>
          <p className="text-xs uppercase tracking-[0.24em] text-white/55">
            Subscribe for upcoming releases
          </p>
        </div>
      </div>
    </main>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
