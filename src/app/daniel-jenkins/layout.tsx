import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Inter_Tight } from "next/font/google";

// This page has its own editorial type, separate from the album site:
// a refined display serif, a tight modern sans for reading, and a small
// typewriter mono for labels.
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], display: "swap", variable: "--dj-serif" });
const sans = Inter_Tight({ subsets: ["latin"], display: "swap", variable: "--dj-sans" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap", variable: "--dj-mono" });

export const metadata: Metadata = {
  title: { absolute: "Daniel Jenkins - Singer, Songwriter, Lead Guitarist" },
  description:
    "Daniel Jenkins - recording artist, singer-songwriter, lead guitarist and live performer from Harare, Zimbabwe. Experience, showreels and contact.",
  alternates: { canonical: "/daniel-jenkins" },
  // A personal resume page shared by direct link. It carries phone
  // numbers, so keep it out of search results.
  robots: { index: false, follow: false },
  openGraph: {
    title: "Daniel Jenkins - Singer, Songwriter, Lead Guitarist",
    description:
      "Live performer with 500+ shows at sea across 30+ countries. Watch the showreels.",
    url: "/daniel-jenkins",
    images: [
      {
        url: "/media/daniel/hero-sm.webp",
        width: 1000,
        height: 555,
        alt: "Daniel Jenkins sitting by a red door with his guitar",
      },
    ],
  },
};

export default function DanielLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${serif.variable} ${sans.variable} ${mono.variable}`}>{children}</div>;
}
