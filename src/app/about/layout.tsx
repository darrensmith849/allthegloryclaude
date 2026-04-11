import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story behind Daniel Jenkins — worship leader, songwriter, and recording artist from Harare, Zimbabwe.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About — Daniel Jenkins",
    description:
      "The story behind Daniel Jenkins — worship leader, songwriter, and recording artist from Harare, Zimbabwe.",
    url: "/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
