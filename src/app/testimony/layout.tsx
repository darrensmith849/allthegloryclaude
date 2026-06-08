import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Testimony",
  description:
    "From darkness into light - my testimony of coming out of drugs and finding Jesus.",
  alternates: { canonical: "/testimony" },
  openGraph: {
    title: "Testimony - All The Glory",
    description:
      "From darkness into light - my testimony of coming out of drugs and finding Jesus.",
    url: "/testimony",
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

export default function TestimonyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
