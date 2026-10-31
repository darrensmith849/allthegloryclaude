import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/platform/styles/dashboard.css";

// Demonstration dashboards. A separate layout and stylesheet from the public
// site: no public header, footer or audio player ships here, and nothing in
// /demo is ever indexed (next.config.ts also sends X-Robots-Tag).
export const metadata: Metadata = {
  title: { default: "Platform demonstration", template: "%s · Demonstration" },
  robots: { index: false, follow: false, nocache: true },
};

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {children}
    </>
  );
}
