import type { Metadata } from "next";
import { album } from "@/content/album";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: album.name,
  description: `${album.name} - a 7-track worship album woven through scripture. Free to download.`,
  alternates: { canonical: album.path },
  openGraph: {
    title: `${album.name} - All The Glory`,
    description: `${album.name} - a 7-track worship album woven through scripture. Free to download.`,
    url: album.path,
    type: "music.album",
    // The shared card, not album.coverImage - the raw painting is 717x528,
    // which scrapers letterbox or crop badly in a preview.
    images: [
      {
        url: "/og-card.jpg",
        secureUrl: `${site.url}/og-card.jpg`,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: `${album.name} - All The Glory`,
      },
    ],
  },
};

export default function AlbumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
