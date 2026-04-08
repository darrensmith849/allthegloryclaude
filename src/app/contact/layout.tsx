import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with All The Glory.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact — All The Glory",
    description: "Get in touch with All The Glory.",
    url: "/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
