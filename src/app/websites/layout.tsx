import type { Metadata } from "next";
import "./websites.css";

// /websites - Daniel's web design page, styled after the Manuchie site in
// his own colours (./websites.css). It uses the site's own fonts (Fraunces
// + Inter from the root layout) but stands alone: the album nav, footer,
// socials, music player and sky backdrop are hidden here (see
// components/site/*).

const title = "Websites by Daniel Jenkins";
const description =
  "Beautiful websites, built with purpose. Custom websites for companies, ministries and people - see sites I've built and start a project.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/websites" },
  // Shared by direct link and carries a phone number, so it stays out of
  // search results (same as /daniel-jenkins).
  robots: { index: false, follow: false },
  icons: { icon: "/media/websites/icon.png?v=dove", apple: "/media/websites/apple-icon.png?v=dove" },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/websites",
    images: [{ url: "/media/websites/og.jpg", width: 1200, height: 630, alt: "Websites by Daniel Jenkins" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [{ url: "/media/websites/og.jpg", width: 1200, height: 630, alt: "Websites by Daniel Jenkins" }],
  },
};

export default function WebsitesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
