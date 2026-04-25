import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Videos",
  description:
    "Watch All The Glory on YouTube — a curated gallery of worship films, music videos, and live moments.",
  alternates: { canonical: "/videos" },
  openGraph: {
    title: "Videos — All The Glory",
    description:
      "A curated gallery of worship films, music videos, and live moments — all on YouTube.",
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
      "A curated gallery of worship films, music videos, and live moments — all on YouTube.",
    images: ["/media/videos-cover.jpg"],
  },
};

export default function VideosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
