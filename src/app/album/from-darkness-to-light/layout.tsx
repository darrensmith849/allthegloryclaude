import type { Metadata } from "next";
import { album } from "@/content/album";

export const metadata: Metadata = {
  title: album.name,
  description: `${album.name} — a 7-track worship album woven through scripture. Free to download.`,
  alternates: { canonical: album.path },
  openGraph: {
    title: `${album.name} — Daniel Jenkins`,
    description: `${album.name} — a 7-track worship album woven through scripture. Free to download.`,
    url: album.path,
    type: "music.album",
    images: [
      {
        url: album.coverImage,
        width: 1200,
        height: 1200,
        alt: `${album.name} — album artwork`,
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
