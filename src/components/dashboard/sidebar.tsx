"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ThemeSwitch } from "@/components/study/theme-toggle";
import { TEAM_NAV, useDashUser } from "@/lib/dashboard/who";
import { canAddToHomeScreen, openDashAppCard } from "@/components/dashboard/app-card";

const NAV = [
  { href: "/dashboard/names", label: "Names of God", glyph: "א" },
  { href: "/dashboard", label: "Who am I?", glyph: "✶" },
  { href: "/dashboard/word-study", label: "Word Journal", glyph: "α" },
  { href: "/dashboard/notes", label: "Study Notes", glyph: "✎" },
  { href: "/dashboard/notes?day=deleted", label: "Recycle bin", glyph: "🗑\uFE0E" },
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
  // Phones not yet using the Home Screen app: a way back to the steps.
  const [addable, setAddable] = useState(false);
  useEffect(() => setAddable(canAddToHomeScreen()), []);
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
        <Suspense fallback={<NavItems nav={nav} pathname={pathname} waiting={waiting} bin={false} />}>
          <NavItemsLive nav={nav} pathname={pathname} waiting={waiting} />
        </Suspense>
      </nav>
      <div className="mt-auto pt-8 flex flex-col gap-1">
        {addable && (
          <button
            type="button"
            className="dash-nav-link dash-nav-foot dash-nav-add text-left"
            onClick={() => {
              setOpen(false);
              openDashAppCard();
            }}
          >
            ＋ Add to my Home Screen
          </button>
        )}
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
              // Back to the dashboard login (which has the team login), so a
              // Home Screen app stays inside the app.
              await fetch("/api/study/logout", { method: "POST" }).catch(() => {});
              window.location.assign("/dashboard/login?team=1");
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

type NavItem = (typeof NAV)[number];
interface NavItemsProps {
  nav: NavItem[];
  pathname: string | null;
  waiting: number;
}

function NavItemsLive(props: NavItemsProps) {
  return <NavItems {...props} bin={useSearchParams().get("day") === "deleted"} />;
}

function NavItems({ nav, pathname, waiting, bin }: NavItemsProps & { bin: boolean }) {
  return (
    <>
      {nav.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : item.href.includes("day=deleted")
              ? pathname === "/dashboard/notes" && bin
              : item.href === "/dashboard/notes"
                ? pathname?.startsWith(item.href) && !bin
                : pathname?.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`dash-nav-link ${active ? "is-active" : ""}`}>
            <span className="dash-nav-glyph">{item.glyph}</span>
            <span>{item.label}</span>
            {item.href === "/dashboard/community" && waiting > 0 && <span className="dash-nav-badge">{waiting}</span>}
          </Link>
        );
      })}
    </>
  );
}
