"use client";

// The Study (/study): the member area of the site. A slim top bar instead
// of the owner's dashboard sidebar - members only ever see the study: the
// owner's notes (when open to them), their own journal and words, and
// their account.

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { memberClient, StudyClientProvider } from "@/lib/study/client";
import { ThemeSwitch } from "./theme-toggle";
import type { Member, StudySettings } from "@/lib/study/members";

export type MeMember = Member & { emailUpdates?: boolean };

interface Me {
  loaded: boolean;
  member: MeMember | null;
  study: StudySettings | null;
  refresh: () => Promise<void>;
}

const ME_KEY = "atg:study:me"; // this tab's last /api/study/me answer

// The local copies of a member's journal (cleared on logout, so nothing of
// it stays on a shared device). Unsent work - drafts and words waiting to
// send - stays until it's sent, unless the account itself is deleted.
const JOURNAL_CACHES = ["notes", "notesSynced", "days", "words", "wordsSynced", "wordsRejected"];

// Forget the cached sign-in (after logging in or out) and, for the member
// who was signed in, their journal's local copy.
export function forgetMe(everything = false) {
  try {
    const cached = JSON.parse(window.sessionStorage.getItem(ME_KEY) ?? "null") as { member?: { id?: string } } | null;
    window.sessionStorage.removeItem(ME_KEY);
    const id = cached?.member?.id;
    if (!id) return;
    const prefix = `atg:study:${id}:`;
    for (const k of Object.keys(window.localStorage)) {
      if (!k.startsWith(prefix)) continue;
      const name = k.slice(prefix.length);
      const value = window.localStorage.getItem(k);
      if (everything || JOURNAL_CACHES.includes(name) || !value || value === "[]" || value === "{}") {
        window.localStorage.removeItem(k);
      }
    }
  } catch {
    // private window
  }
}

const MeContext = createContext<Me>({ loaded: false, member: null, study: null, refresh: async () => {} });
export const useMe = () => useContext(MeContext);

// "Daniel's study" once the owner has put their name on it.
export function studyName(study: StudySettings | null): string {
  const author = study?.author?.trim();
  return author && author !== "All The Glory" ? `${author}'s study` : "Read the study";
}

// Can this visitor read the owner's study?
export function canRead(me: Pick<Me, "member" | "study">): boolean {
  return me.study?.reading === "public" || (me.study?.reading === "members" && Boolean(me.member));
}

export function StudyShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [me, setMe] = useState<{ loaded: boolean; member: MeMember | null; study: StudySettings | null }>({
    loaded: false,
    member: null,
    study: null,
  });

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/study/me", { cache: "no-store" });
      const data = (await r.json()) as { member: MeMember | null; study: StudySettings };
      setMe({ loaded: true, member: data.member, study: data.study });
      try {
        window.sessionStorage.setItem(ME_KEY, JSON.stringify({ member: data.member, study: data.study }));
      } catch {
        // private window
      }
    } catch {
      setMe((m) => ({ ...m, loaded: true }));
    }
  }, []);
  useEffect(() => {
    // Show the page straight away from this tab's last answer, then check.
    try {
      const cached = JSON.parse(window.sessionStorage.getItem(ME_KEY) ?? "null") as {
        member: MeMember | null;
        study: StudySettings;
      } | null;
      if (cached?.study) setMe({ loaded: true, member: cached.member, study: cached.study });
    } catch {
      // private window
    }
    void refresh();
  }, [refresh]);

  const readable = canRead(me);
  const client = useMemo(
    () => (me.member ? memberClient(me.member.id, { canReadStudy: readable, author: me.study?.author }) : null),
    [me.member, readable, me.study?.author],
  );

  // The left menu: only the study - like the owner's dashboard menu.
  const nav = [
    { href: "/study", label: me.member ? "Today" : "Home", glyph: "✦" },
    ...(readable ? [{ href: me.member ? "/study/journal?daniel=1" : "/study/read", label: studyName(me.study), glyph: "✶" }] : []),
    ...(me.member
      ? [
          { href: "/study/journal", label: "My journal", glyph: "✎" },
          { href: "/study/words", label: "All words", glyph: "α" },
          { href: "/study/prayers", label: "Prayer list", glyph: "♡" },
          { href: "/study/community", label: "Community", glyph: "❧" },
          { href: "/study/account", label: "Account", glyph: "⚙" },
          { href: "/study#invite", label: "Invite a friend", glyph: "✉" },
        ]
      : []),
  ];
  // Phones: the menu is one scrolling row - keep the open page's pill in
  // view, and drop the edge fade once it's scrolled to the end.
  const navRef = useRef<HTMLElement>(null);
  const markNavEnd = useCallback(() => {
    const el = navRef.current;
    if (el) el.classList.toggle("is-end", el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  const bare = ["/study/login", "/study/join", "/study/reset"].includes(pathname ?? "");

  const body = (
    <MeContext.Provider value={{ ...me, refresh }}>
      <BackBar />
      {children}
    </MeContext.Provider>
  );

  if (bare) return <div className="study-root">{body}</div>;

  const logout = async () => {
    await fetch("/api/study/logout", { method: "POST" }).catch(() => {});
    forgetMe();
    window.location.assign("/study");
  };

  return (
    <div className="study-root study-app">
      <aside className="dash-sidebar study-sidebar">
        <Link href="/study" className="study-side-brand">
          <Image src="/media/dove-mark.png" alt="" width={40} height={40} className="study-brand-dove" priority />
          <span>
            <span className="eyebrow eyebrow-amber block">All The Glory</span>
            <span className="study-side-title">The Study</span>
          </span>
        </Link>
        <ThemeSwitch className="mt-4 study-side-theme" />
        <nav className="study-side-nav" aria-label="The Study" ref={navRef} onScroll={markNavEnd}>
          <Suspense fallback={<NavLinks nav={nav} pathname={pathname} daniel={false} navRef={navRef} onMoved={markNavEnd} />}>
            <NavLinksLive nav={nav} pathname={pathname} navRef={navRef} onMoved={markNavEnd} />
          </Suspense>
          {me.loaded && !me.member && (
            <>
              <Link href={`/the-study?login=1&next=${encodeURIComponent(pathname ?? "/study")}`} className="dash-nav-link">
                <span className="dash-nav-glyph">→</span>
                <span>Log in</span>
              </Link>
              {me.study?.signup === "open" && (
                <Link href="/the-study#join" className="dash-btn dash-btn-primary study-side-join">
                  Join The Study
                </Link>
              )}
            </>
          )}
        </nav>
        <div className="study-side-foot">
          <a href="/" className="dash-nav-link dash-nav-foot">
            ← alltheglory.co.za
          </a>
          {me.member && (
            <button type="button" className="dash-nav-link dash-nav-foot text-left" onClick={logout}>
              Log out
            </button>
          )}
        </div>
      </aside>
      <main className="dash-main study-main">
        {client ? <StudyClientProvider value={client}>{body}</StudyClientProvider> : body}
        <StudyFooter />
      </main>
    </div>
  );
}

// "← Back" on every page but the front door: to the page they came from in
// The Study (or elsewhere on the site), else to the page above this one.
let movedInApp = false;
const PAGE: Record<string, { name: string; parent: string }> = {
  "/study/journal": { name: "My journal", parent: "/study" },
  "/study/read": { name: "Daniel's study", parent: "/study" },
  "/study/account": { name: "Account", parent: "/study" },
  "/study/community": { name: "Community", parent: "/study" },
  "/study/words": { name: "All words", parent: "/study/journal" },
};

function BackBar() {
  const pathname = usePathname() ?? "/study";
  const router = useRouter();
  const me = useMe();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) first.current = false;
    else movedInApp = true;
  }, [pathname]);

  const page = PAGE[pathname];
  if (!page) return null;
  const name = pathname === "/study/read" ? studyName(me.study) : page.name;
  const back = () => {
    const fromSite = typeof document !== "undefined" && document.referrer.startsWith(window.location.origin);
    if ((movedInApp || fromSite) && window.history.length > 1) router.back();
    else router.push(page.parent);
  };
  return (
    <div className="study-backbar">
      <button type="button" className="study-back" onClick={back}>
        ← Back
      </button>
      <span className="study-crumb">
        <Link href="/study">The Study</Link> <span aria-hidden>›</span> {name}
      </span>
    </div>
  );
}

// The thin flyer-style footer: back to the rest of All The Glory.
function StudyFooter() {
  return (
    <footer className="study-foot">
      <div className="study-foot-mark">All The Glory</div>
      <nav className="study-foot-links" aria-label="All The Glory">
        <a href="/">Home</a>
        <a href="/videos">Videos</a>
        <a href="/testimony">Testimony</a>
        <a href="/about">About</a>
        <a href="/give">Give</a>
        <a href="/contact">Contact</a>
      </nav>
      <div className="study-foot-small">
        <a href="/privacy">Privacy</a> · Readings follow Tyndale&apos;s One Year Chronological Bible (NIV)
      </div>
    </footer>
  );
}

// Wraps a page only members can see: sends anyone else to log in.
export function MemberOnly({ children }: { children: React.ReactNode }) {
  const me = useMe();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (me.loaded && !me.member) router.replace(`/the-study?login=1&next=${encodeURIComponent(pathname ?? "/study")}`);
  }, [me.loaded, me.member, router, pathname]);
  if (!me.member) return <p className="dash-reader-empty">{me.loaded ? "Taking you to log in…" : "Opening…"}</p>;
  return <>{children}</>;
}

// The menu's links. "Daniel's study" for members is the journal with
// ?daniel=1, so it's the one lit up there (not "My journal"). On phones the
// row scrolls: the lit link is brought into view, next to its neighbours.
type NavItem = { href: string; label: string; glyph: string };
interface NavProps {
  nav: NavItem[];
  pathname: string | null;
  navRef: RefObject<HTMLElement | null>;
  onMoved: () => void;
}

function NavLinksLive(props: NavProps) {
  const daniel = useSearchParams().get("daniel") === "1";
  return <NavLinks {...props} daniel={daniel} />;
}

function NavLinks({ nav, pathname, daniel, navRef, onMoved }: NavProps & { daniel: boolean }) {
  useEffect(() => {
    const el = navRef.current;
    const active = el?.querySelector<HTMLElement>(".is-active");
    if (el && active && el.scrollWidth > el.clientWidth) {
      el.scrollLeft = Math.max(0, active.offsetLeft - el.clientWidth / 2 + active.offsetWidth / 2);
    }
    onMoved();
  }, [pathname, daniel, nav.length, navRef, onMoved]);

  return (
    <>
      {nav.map((n) => {
        const active =
          n.href === "/study"
            ? pathname === "/study"
            : n.href.includes("daniel=1")
              ? pathname?.startsWith("/study/read") || (pathname === "/study/journal" && daniel)
              : n.href === "/study/journal"
                ? pathname?.startsWith("/study/journal") && !daniel
                : !n.href.includes("#") && !n.href.includes("?") && pathname?.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href} className={`dash-nav-link ${active ? "is-active" : ""}`}>
            <span className="dash-nav-glyph">{n.glyph}</span>
            <span>{n.label}</span>
          </Link>
        );
      })}
    </>
  );
}
