import type { Metadata } from "next";
import "@/styles/globals.css";
import Nav from "@/components/site/nav";
import SiteFooter from "@/components/site/site-footer";
import SocialDock from "@/components/site/social-dock";
import StickyBackdrop from "@/components/site/sticky-backdrop";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: {
    default: site.name,
    template: `%s - ${site.name}`,
  },
  description: site.description,
  metadataBase: new URL("https://example.com"),
  openGraph: {
    title: site.name,
    description: site.description,
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-transparent">
        <StickyBackdrop />
        <div className="relative z-10">
          <Nav />
          <SocialDock />
          {children}
          <SiteFooter />
        </div>
        <div className="grain-overlay" aria-hidden="true" />
      </body>
    </html>
  );
}
