import type { Metadata, Viewport } from "next";
import LayoutShell from "./layout-shell";
import { ThemeScript } from "@/components/study/theme-toggle";
import { readFont } from "@/lib/fonts";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Private dashboard.",
  robots: { index: false, follow: false },
  // Its own Home Screen app (the dark dove) - members' The Study is the light one.
  manifest: "/dashboard-manifest.webmanifest",
  icons: {
    icon: [{ url: "/dashboard-app/favicon.png", sizes: "64x64", type: "image/png" }],
    apple: "/dashboard-app/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "ATG Dashboard",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = { themeColor: "#f6f1e7" };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={readFont.variable}>
      <ThemeScript />
      <LayoutShell>{children}</LayoutShell>
    </div>
  );
}
