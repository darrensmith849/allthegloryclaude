import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with All The Glory.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact - All The Glory",
    description: "Get in touch with All The Glory.",
    url: "/contact",
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

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
