import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story behind All The Glory — a testimony of grace, surrender, and the relentless pursuit of light in the darkest places.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About — All The Glory",
    description:
      "The story behind All The Glory — a testimony of grace, surrender, and the pursuit of light.",
    url: "/about",
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

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
