"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeSwitch } from "@/components/study/theme-toggle";
import { TEAM_NAV, useDashUser } from "@/lib/dashboard/who";

const NAV = [
  { href: "/dashboard/names", label: "Names of God", glyph: "א" },
  { href: "/dashboard", label: "Who am I?", glyph: "✶" },
  { href: "/dashboard/word-study", label: "Word Journal", glyph: "α" },
  { href: "/dashboard/notes", label: "Study Notes", glyph: "✎" },
  { href: "/dashboard/members", label: "Members", glyph: "☍" },
  { href: "/dashboard/community", label: "Community", glyph: "❧" },
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
  // The owner sees everything; a team member only their part.
  const user = useDashUser();
  const team = user?.role === "team";
  const nav = team ? NAV.filter((item) => TEAM_NAV.includes(item.href)) : user === undefined ? [] : NAV;
  // Things waiting in Community (shared posts to approve, new check-in replies).
  const [waiting, setWaiting] = useState(0);
  useEffect(() => {
    fetch("/api/members/community?count=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { pending?: number; unread?: number; reported?: number } | null) =>
        setWaiting((d?.pending ?? 0) + (d?.unread ?? 0) + (d?.reported ?? 0)),
      )
      .catch(() => {});
  }, [pathname]);
  // Phones: the menu folds away behind a Menu button so each page starts at
  // the top of the screen; it closes again once you pick a page.
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const here = nav.find((item) => (item.href === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(item.href)));
  return (
    <aside className="dash-sidebar">
      <div className="dash-brand">
        <div className="dash-brand-row">
          <div className="min-w-0">
            <div className="eyebrow eyebrow-amber">All The Glory</div>
            <div className="font-display text-[20px] tracking-tight mt-1">
              <span className="dash-brand-title">{user === undefined ? "\u00a0" : team ? `Team · ${user.name}` : "Private dashboard"}</span>
              {here && <span className="dash-brand-here">{here.label}</span>}
            </div>
          </div>
          <button
            type="button"
            className="dash-menu-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="dash-side-menu"
          >
            {open ? "Close ✕" : "Menu"}
            {!open && waiting > 0 && <span className="dash-nav-badge">{waiting}</span>}
          </button>
        </div>
        <ThemeSwitch className={`mt-4 dash-side-theme ${open ? "is-open" : ""}`} />
      </div>
      <div id="dash-side-menu" className={`dash-side-menu ${open ? "is-open" : ""}`}>
      <nav className="mt-7 flex flex-col gap-1">
        {nav.map((item) => {
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
              {item.href === "/dashboard/community" && waiting > 0 && <span className="dash-nav-badge">{waiting}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-8 flex flex-col gap-1">
        <Link href="/study" className="dash-nav-link dash-nav-foot">
          The Study (members) ↗
        </Link>
        <Link href="/" className="dash-nav-link dash-nav-foot">
          ← Back to the public site
        </Link>
        <button
          type="button"
          className="dash-nav-link dash-nav-foot text-left"
          onClick={async () => {
            if (team) {
              await fetch("/api/study/logout", { method: "POST" }).catch(() => {});
              window.location.assign("/the-study");
              return;
            }
            await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
            window.location.assign("/dashboard/login");
          }}
        >
          Log out
        </button>
      </div>
      </div>
    </aside>
  );
}
