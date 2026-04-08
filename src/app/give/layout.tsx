import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Give",
  description:
    "Support All The Glory. The album is free — if it blessed you, your giving helps fund what's next.",
  alternates: { canonical: "/give" },
  openGraph: {
    title: "Give — All The Glory",
    description:
      "Support All The Glory. The album is free — if it blessed you, your giving helps fund what's next.",
    url: "/give",
  },
};

export default function GiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
