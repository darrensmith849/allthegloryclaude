import type { Metadata } from "next";

// /websites - Daniel's web design page. It uses the All The Glory look
// (the site's own fonts, sky backdrop and panels come from the root
// layout), but stands alone: the album nav, footer, socials and music
// player are hidden here (see components/site/*).

const title = "Websites by Daniel Jenkins";
const description =
  "Beautiful, custom websites for companies, ministries and people - designed with care and built from scratch. See sites I've built and start a project.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/websites" },
  // Shared by direct link and carries a phone number, so it stays out of
  // search results (same as /daniel-jenkins).
  robots: { index: false, follow: false },
  icons: { icon: "/media/websites/icon.png", apple: "/media/websites/apple-icon.png" },
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
