import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sow",
  description:
    "Support All The Glory. The album is free — if it blessed you, sowing into the work helps fund what's next.",
  alternates: { canonical: "/sow" },
  openGraph: {
    title: "Sow — All The Glory",
    description:
      "Support All The Glory. The album is free — if it blessed you, sowing into the work helps fund what's next.",
    url: "/sow",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "All The Glory — From Darkness To Light",
      },
    ],
  },
};

export default function SowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
