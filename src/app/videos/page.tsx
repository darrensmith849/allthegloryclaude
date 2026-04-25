import type { Metadata } from "next";
import { site } from "@/content/site";
import { videos } from "@/content/videos";
import FeaturedVideoHero from "./FeaturedVideoHero";

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
      {/* Hero header — editorial, tight */}
      <section className="mx-auto w-full max-w-3xl px-6 pt-32 md:pt-40 text-center">
        <div className="eyebrow">Videos</div>
        <h1 className="font-display mt-4 text-5xl md:text-7xl font-normal text-white tracking-tight">
          Songs in{" "}
          <span className="italic text-[var(--colour-amber)]">motion</span>
        </h1>
        <p className="mt-5 text-sm md:text-base text-white/65 max-w-xl mx-auto leading-relaxed">
          Music videos, worship sessions, and the moments behind the songs.
        </p>
      </section>

      {/* Featured video — wider, more cinematic. Wraps to a 6xl container so
          the iframe gets real screen presence instead of feeling boxed. */}
      <section className="mx-auto w-full max-w-6xl px-4 md:px-6 mt-10 md:mt-14">
        <FeaturedVideoHero videoId={videos.featuredId} />
      </section>

      {/* Action row — primary watch CTA + secondary channel link */}
      <section className="mx-auto w-full max-w-3xl px-6 mt-9 md:mt-12">
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-3">
            {videos.featuredWatchUrl && (
              <a
                href={videos.featuredWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary inline-flex items-center gap-2"
                aria-label="Watch the featured video on YouTube (opens in a new tab)"
              >
                Watch the video
                <ExternalLinkIcon />
              </a>
            )}
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${videos.featuredWatchUrl ? "btn btn-ghost" : "btn btn-primary"} inline-flex items-center gap-2`}
              aria-label="Visit the All The Glory YouTube channel (opens in a new tab)"
            >
              {videos.featuredWatchUrl ? "Visit the channel" : "Watch on YouTube"}
              <ExternalLinkIcon />
            </a>
          </div>
        </div>
      </section>

      {/* Subscribe panel — premium editorial card with the channel handle.
          Pulls double duty as the closing CTA so users don't have to scroll
          back up to take action. */}
      <section className="mx-auto w-full max-w-3xl px-6 mt-16 md:mt-24 pb-24 md:pb-32">
        <div className="panel-scrim p-7 md:p-10 text-center">
          <div className="eyebrow eyebrow-amber">Official Channel</div>
          <h2 className="font-display mt-3 text-3xl md:text-4xl font-normal text-white tracking-tight">
            @Allthe_glory
          </h2>
          <p className="mt-4 text-sm md:text-base text-white/65 max-w-md mx-auto leading-relaxed">
            New releases drop on the channel first. Subscribe to catch every
            video the moment it goes live.
          </p>
          <div className="mt-7 flex justify-center">
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary inline-flex items-center gap-2"
              aria-label="Subscribe to the All The Glory YouTube channel (opens in a new tab)"
            >
              Subscribe on YouTube
              <ExternalLinkIcon />
            </a>
          </div>
        </div>
      </section>
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
