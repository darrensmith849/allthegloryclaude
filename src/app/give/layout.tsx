import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Give",
  description:
    "Support the mission. 100% of every donation goes to CrossCoders — free software for under-resourced churches, a venture of the Kingdom Come Foundation.",
  alternates: { canonical: "/give" },
  openGraph: {
    title: "Give — All The Glory",
    description:
      "100% of every donation goes to CrossCoders, a venture of the Kingdom Come Foundation.",
    url: "/give",
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

export default function DonateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
