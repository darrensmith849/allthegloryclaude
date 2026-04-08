import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bookings",
  description:
    "Bookings and ministry enquiries for All The Glory — worship nights, church services, conferences, and intimate gatherings.",
  alternates: { canonical: "/events" },
  openGraph: {
    title: "Bookings — All The Glory",
    description:
      "Bookings and ministry enquiries for All The Glory — worship nights, church services, conferences, and intimate gatherings.",
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
