import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What All The Glory collects, why, who processes it, and your rights — plain English.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy — All The Glory",
    description:
      "What All The Glory collects, why, who processes it, and your rights — plain English.",
    url: "/privacy",
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

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
