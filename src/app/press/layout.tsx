import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Press & Media",
  description:
    "Press kit for All The Glory — artist bio, high-resolution photos, and booking information for media, venues, and event organisers.",
  alternates: { canonical: "/press" },
  openGraph: {
    title: "Press & Media — All The Glory",
    description:
      "Press kit for All The Glory — artist bio, high-resolution photos, and booking information.",
    url: "/press",
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

export default function PressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
