import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Commission",
  description:
    "Commissioned songs by Daniel Jenkins — original music written and recorded for personal stories, weddings, testimonies, and meaningful moments.",
  alternates: { canonical: "/events" },
  openGraph: {
    title: "Commission — Daniel Jenkins",
    description:
      "Commissioned songs by Daniel Jenkins — original music written and recorded for meaningful moments.",
    url: "/events",
  },
};

export default function BookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
