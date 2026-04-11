import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sow",
  description:
    "Support the music. The album is free — if it blessed you, sowing into the work helps fund what's next.",
  alternates: { canonical: "/sow" },
  openGraph: {
    title: "Sow — Daniel Jenkins",
    description:
      "Support the music. The album is free — if it blessed you, sowing into the work helps fund what's next.",
    url: "/sow",
  },
};

export default function SowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
