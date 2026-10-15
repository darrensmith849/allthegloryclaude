import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Inter_Tight } from "next/font/google";

// /websites - Daniel's web design showcase, a standalone share link on the
// All The Glory domain. Same type family as /daniel-jenkins so both
// personal pages feel like one brand: a display serif, a tight sans for
// reading and a mono for labels and web addresses.
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], display: "swap", variable: "--ws-serif" });
const sans = Inter_Tight({ subsets: ["latin"], display: "swap", variable: "--ws-sans" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap", variable: "--ws-mono" });

const title = "Websites by Daniel Jenkins";
const description = "Custom websites for companies, brands and people. See a few I've built, then message me to chat about yours.";

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
  return <div className={`${serif.variable} ${sans.variable} ${mono.variable}`}>{children}</div>;
}
