import type { Metadata, Viewport } from "next";
import LayoutShell from "./layout-shell";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Private dashboard.",
  robots: { index: false, follow: false },
  manifest: "/dashboard-manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "ATG Dashboard",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = { themeColor: "#f6f1e7" };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <LayoutShell>{children}</LayoutShell>;
}
