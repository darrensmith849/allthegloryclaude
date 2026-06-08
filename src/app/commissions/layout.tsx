import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Commissions",
  description:
    "Commissions for All The Glory - bespoke songs written and recorded for personal testimonies, weddings, memorials, church themes, and milestone moments.",
  alternates: { canonical: "/commissions" },
  openGraph: {
    title: "Commissions - All The Glory",
    description:
      "Commissions for All The Glory - bespoke songs written and recorded for personal testimonies, weddings, memorials, church themes, and milestone moments.",
    url: "/commissions",
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

export default function BookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
