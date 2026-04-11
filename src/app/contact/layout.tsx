import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Daniel Jenkins.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact — Daniel Jenkins",
    description: "Get in touch with Daniel Jenkins.",
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
