import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "@/styles/globals.css";
import Nav from "@/components/site/nav";
import SiteFooter from "@/components/site/site-footer";
import SocialDock from "@/components/site/social-dock";
import StickyBackdrop from "@/components/site/sticky-backdrop";
import PageTransition from "@/components/site/page-transition";
import CommandPalette from "@/components/ui/command-palette";
import { site } from "@/content/site";
import { album } from "@/content/album";

// Premium editorial serif for display headings.
// Fraunces is a warm, variable serif with optical sizing - feels
// hand-set at large sizes and reads cleanly at small ones.
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  axes: ["opsz", "SOFT"],
});

// Clean modern sans for body copy.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

// Structured data - built from the actual content sources, no hardcoded facts.
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "MusicGroup",
      "@id": `${site.url}#artist`,
      name: site.name,
      url: site.url,
      sameAs: Object.values(site.socials),
      image: `${site.url}/og-image.jpg`,
    },
    {
      "@type": "MusicAlbum",
      "@id": `${site.url}${album.path}#album`,
      name: album.name,
      url: `${site.url}${album.path}`,
      image: `${site.url}${album.coverImage}`,
      datePublished: String(album.releaseYear),
      numTracks: album.tracks.length,
      byArtist: { "@id": `${site.url}#artist` },
      track: album.tracks.map((t, i) => ({
        "@type": "MusicRecording",
        position: i + 1,
        name: t.title,
        byArtist: { "@id": `${site.url}#artist` },
      })),
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}#website`,
      url: site.url,
      name: site.name,
      description: site.description,
      publisher: { "@id": `${site.url}#artist` },
    },
  ],
};

export const metadata: Metadata = {
  title: {
    default: site.name,
    template: `%s - ${site.name}`,
  },
  description: site.description,
  metadataBase: new URL(site.url),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: site.name,
    description: site.description,
    type: "website",
    url: site.url,
    siteName: site.name,
    images: [
      {
        url: "/og-image.jpg",
        secureUrl: `${site.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "All The Glory - From Darkness To Light",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
    images: [
      {
        url: `${site.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "All The Glory - From Darkness To Light",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable}`}
    >
      <body className="min-h-screen bg-transparent font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        <StickyBackdrop />
        <div className="relative z-10">
          <Nav />
          <SocialDock />
          <PageTransition>{children}</PageTransition>
          <SiteFooter />
        </div>
        <CommandPalette />
        <div className="grain-overlay" aria-hidden="true" />
      </body>
    </html>
  );
}
