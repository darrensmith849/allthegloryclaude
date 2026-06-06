import type { Metadata } from "next";
import LayoutShell from "./layout-shell";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Private dashboard.",
  robots: { index: false, follow: false },
  manifest: "/dashboard-manifest.webmanifest",
  themeColor: "#0a0810",
  appleWebApp: {
    capable: true,
    title: "ATG Dashboard",
    statusBarStyle: "black-translucent",
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <LayoutShell>{children}</LayoutShell>;
}
