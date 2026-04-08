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
            Watch on YouTube
          </h1>
          <p className="mt-4 text-sm md:text-base text-white/65 max-w-md mx-auto leading-relaxed">
            Watch official videos, worship sessions, music releases, and future
            live content on YouTube.
          </p>
        </header>

        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open the All The Glory YouTube channel in a new tab"
          className="group block mt-12 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--colour-amber)] rounded-2xl"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 panel-scrim aspect-[16/9]">
            <Image
              src="/media/videos-cover.webp"
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 900px"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />

            {/* Gradient wash for legibility */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-black/10 to-black/75" />

            {/* Centered play glyph */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/10 backdrop-blur-sm border border-white/25 flex items-center justify-center transition-all duration-500 group-hover:bg-white/20 group-hover:border-white/40 group-hover:scale-105">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="ml-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                  aria-hidden="true"
                >
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              </div>
            </div>

            {/* YouTube badge — top-left */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="white"
                aria-hidden="true"
              >
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#09080e" />
              </svg>
              <span className="text-[10px] uppercase tracking-[0.22em] text-white/85 font-semibold">
                YouTube
              </span>
            </div>

            {/* Channel handle — bottom-left */}
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.26em] text-white/60">
                  Official Channel
                </div>
                <div className="mt-1 text-base md:text-lg font-semibold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
                  All The Glory
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/70 group-hover:text-white transition-colors">
                <span>Visit channel</span>
                <ExternalLinkIcon />
              </div>
            </div>
          </div>

          {/* CTA row beneath the card */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <span className="btn btn-primary inline-flex items-center gap-2">
              Watch on YouTube
              <ExternalLinkIcon />
            </span>
            <span className="text-xs uppercase tracking-[0.24em] text-white/55">
              Subscribe for upcoming releases
            </span>
          </div>
        </a>
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
