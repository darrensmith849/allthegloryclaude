import type { Metadata, Viewport } from "next";
import { StudyShell } from "@/components/study/shell";
import { ThemeScript } from "@/components/study/theme-toggle";
import { readFont } from "@/lib/fonts";
import "../dashboard/dashboard.css";

// The Study: members' own Bible study journals and the owner's
// chronological study. Its own icon, share card and "Add to Home Screen"
// app (public/study-manifest.webmanifest). Members' pages need a login, so
// search engines only ever see the front door.
const description =
  "Read through the Bible in the order it happened, one day at a time - with notes, the Hebrew and Greek, and a journal of your own.";

export const metadata: Metadata = {
  title: "The Study",
  description,
  manifest: "/study-manifest.webmanifest",
  icons: {
    icon: [{ url: "/study/favicon.png", sizes: "64x64", type: "image/png" }],
    apple: "/study/apple-icon.png",
  },
  appleWebApp: { capable: true, title: "The Study", statusBarStyle: "default" },
  alternates: { canonical: "/study" },
  openGraph: {
    title: "The Study · All The Glory",
    description,
    url: "/study",
    siteName: "All The Glory",
    type: "website",
    images: [{ url: "/study/og.jpg", width: 1200, height: 630, alt: "The Study - All The Glory" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Study · All The Glory",
    description,
    images: ["/study/og.jpg"],
  },
};

export const viewport: Viewport = { themeColor: "#f6f1e7" };

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={readFont.variable}>
      <ThemeScript />
      <StudyShell>{children}</StudyShell>
    </div>
  );
}
