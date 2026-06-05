import type { Metadata } from "next";
import DashboardSidebar from "@/components/dashboard/sidebar";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Private dashboard.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dash-root">
      <DashboardSidebar />
      <main className="dash-main">{children}</main>
    </div>
  );
}
