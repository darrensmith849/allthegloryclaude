import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Press Kit - From Darkness To Light",
  description:
    "Official press kit for From Darkness To Light, the debut worship album from All The Glory. Honest worship for broken hearts, weary souls, and anyone longing for hope.",
  alternates: { canonical: "/press" },
  // Unlisted but publicly accessible by direct link. Tell search engines
  // to skip indexing so the page only travels through links the artist
  // shares directly with press / radio / playlist contacts.
  robots: { index: false, follow: false },
  openGraph: {
    title: "All The Glory - From Darkness To Light Press Kit",
    description:
      "Private press kit and listening preview for the debut worship album from All The Glory, releasing 17 July 2026.",
    url: "/press",
    images: [
      {
        url: "/og-dove.jpg",
        width: 1200,
        height: 630,
        alt: "All The Glory - From Darkness To Light",
      },
    ],
  },
};

export default function PressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
