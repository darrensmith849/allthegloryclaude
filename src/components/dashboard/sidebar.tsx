"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeSwitch } from "@/components/study/theme-toggle";

const NAV = [
  { href: "/dashboard", label: "Who am I?", glyph: "✶" },
  { href: "/dashboard/word-study", label: "Word Journal", glyph: "α" },
  { href: "/dashboard/notes", label: "Study Notes", glyph: "✎" },
  { href: "/dashboard/members", label: "Members", glyph: "☍" },
  { href: "/dashboard/today", label: "Today", glyph: "✦" },
  { href: "/dashboard/calendar", label: "Calendar", glyph: "▦" },
  { href: "/dashboard/tasks", label: "Tasks", glyph: "▢" },
  { href: "/dashboard/guitar", label: "Guitar", glyph: "♪" },
  { href: "/dashboard/book", label: "Book", glyph: "❦" },
  { href: "/dashboard/reminders", label: "Reminders", glyph: "☼" },
  { href: "/dashboard/analytics", label: "Analytics", glyph: "◔" },
  { href: "/dashboard/settings", label: "Settings", glyph: "⚙" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  return (
    <aside className="dash-sidebar">
      <div className="dash-brand">
        <div className="eyebrow eyebrow-amber">All The Glory</div>
        <div className="font-display text-[20px] tracking-tight mt-1">Private dashboard</div>
        <ThemeSwitch className="mt-4" />
      </div>
      <nav className="mt-7 flex flex-col gap-1">
        {NAV.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`dash-nav-link ${active ? "is-active" : ""}`}
            >
              <span className="dash-nav-glyph">{item.glyph}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-8 flex flex-col gap-1">
        <Link href="/study" className="dash-nav-link text-[12px] opacity-70">
          The Study (members) ↗
        </Link>
        <Link href="/" className="dash-nav-link text-[12px] opacity-70">
          ← Back to the public site
        </Link>
        <button
          type="button"
          className="dash-nav-link text-[12px] opacity-70 text-left"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
            window.location.assign("/dashboard/login");
          }}
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
