import type { Metadata } from "next";

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
  return children;
}
