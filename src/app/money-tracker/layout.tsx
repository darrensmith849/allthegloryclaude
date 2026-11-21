import type { Metadata, Viewport } from "next";
import { ThemeScript } from "@/components/study/theme-toggle";
import { readFont } from "@/lib/fonts";
import "../dashboard/dashboard.css";

// The friends' Money tracker: the dashboard's Money screen on its own, kept in
// each person's own browser. Shared by link, kept out of search engines.
export const metadata: Metadata = {
  title: "Money Tracker",
  description: "Your own budget and spending tracker. Private to this device.",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Money", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#f6f1e7" };

export default function MoneyTrackerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={readFont.variable}>
      <ThemeScript />
      <div className="dash-root">
        <main className="dash-main">{children}</main>
      </div>
    </div>
  );
}
