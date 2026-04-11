import type { Metadata } from "next";
import { site } from "@/content/site";
import { videos } from "@/content/videos";
import FeaturedVideoHero from "./FeaturedVideoHero";

const channelUrl = site.socials.youtube;

export const metadata: Metadata = {
  title: "Videos",
  description:
    "Watch Daniel Jenkins on YouTube — official music videos, worship sessions, and live content.",
  alternates: { canonical: "/videos" },
  openGraph: {
    title: "Videos — Daniel Jenkins",
    description:
      "Watch Daniel Jenkins on YouTube — official music videos, worship sessions, and live content.",
    url: "/videos",
    type: "website",
    images: [
      {
        url: "/media/videos-cover.jpg",
        width: 1200,
        height: 630,
        alt: "Daniel Jenkins on YouTube",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Videos — Daniel Jenkins",
    description:
      "Watch Daniel Jenkins on YouTube — official music videos, worship sessions, and live content.",
    images: ["/media/videos-cover.jpg"],
  },
};

export default function VideosPage() {
  return (
    <main className="bg-transparent overflow-x-clip">
      <div className="mx-auto w-full max-w-4xl px-6 pt-32 md:pt-40 pb-20 md:pb-28 min-h-[78vh] md:min-h-[82vh]">
        <header className="text-center">
          <div className="eyebrow">Videos</div>
          <h1 className="font-display mt-4 text-4xl md:text-6xl font-normal text-white tracking-tight">
            Official YouTube channel
          </h1>
          <p className="mt-4 text-sm md:text-base text-white/65 max-w-md mx-auto leading-relaxed">
            Music videos, worship sessions, and future live content — all on
            YouTube.
          </p>
        </header>

        {/* Channel feature — silent, looping trailer when a video ID is set,
            otherwise falls back to the static cover art. Both states share the
            same frame, overlay chrome, and dimensions (no layout shift). */}
        <FeaturedVideoHero videoId={videos.featuredId} />

        {/* Real action area, distinct from the banner */}
        <div className="mt-9 md:mt-11 flex flex-col items-center gap-3">
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary inline-flex items-center gap-2"
            aria-label="Watch Daniel Jenkins on YouTube (opens in a new tab)"
          >
            Watch on YouTube
            <ExternalLinkIcon />
          </a>
          <p className="text-xs uppercase tracking-[0.24em] text-white/55">
            New releases drop on the channel first
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
