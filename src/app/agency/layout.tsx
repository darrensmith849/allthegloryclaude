import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { brand } from "@/platform/config/brand";
import { publicEnv } from "@/platform/config/public-env";
import "@/platform/styles/tokens.css";
import "@/platform/styles/base.css";
import "@/platform/styles/components.css";

// The Africa music platform, mounted at /agency on All the Glory. Everything
// under this segment is the platform's own: its styles are scoped to `.ngoma`
// (src/platform/styles) and the album site's nav, footer, player and backdrop
// hide themselves on /agency (src/components/site/*).

const indexable = publicEnv.indexing === "enabled";

export const metadata: Metadata = {
  title: { default: `${brand.name} — ${brand.tagline}`, template: `%s · ${brand.name}` },
  description: brand.description,
  applicationName: brand.name,
  // Nothing is indexable until launch is approved (NEXT_PUBLIC_AGENCY_INDEXING).
  robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
  alternates: { canonical: null },
  icons: { icon: "/agency/icon.svg", apple: "/agency/icon.svg" },
  openGraph: { type: "website", siteName: brand.name, title: brand.tagline, description: brand.shortDescription, locale: "en_GB", url: "/agency", images: [] },
  twitter: { card: "summary", title: brand.tagline, description: brand.shortDescription, images: [] },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#0c141a",
};

export default function AgencyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ngoma" lang="en-GB">
      {children}
    </div>
  );
}
