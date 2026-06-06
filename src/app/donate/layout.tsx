import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Support All The Glory. The album is free - if it blessed you, your donation helps fund what's next.",
  alternates: { canonical: "/donate" },
  openGraph: {
    title: "Donate - All The Glory",
    description:
      "Support All The Glory. The album is free - if it blessed you, your donation helps fund what's next.",
    url: "/donate",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "All The Glory - From Darkness To Light",
      },
    ],
  },
};

export default function DonateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
