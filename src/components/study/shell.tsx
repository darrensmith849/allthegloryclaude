"use client";

// The Study (/study): the member area of the site. A slim top bar instead
// of the owner's dashboard sidebar - members only ever see the study: the
// owner's notes (when open to them), their own journal and words, and
// their account.

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { memberClient, StudyClientProvider } from "@/lib/study/client";
import { AlbumPlayerProvider, ListenButton } from "./album-player";
import type { Member, StudySettings } from "@/lib/study/members";

export type MeMember = Member & { emailUpdates?: boolean };

interface Me {
  loaded: boolean;
  member: MeMember | null;
  study: StudySettings | null;
  refresh: () => Promise<void>;
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
    } catch {
      setMe((m) => ({ ...m, loaded: true }));
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const readable = canRead(me);
  const client = useMemo(
    () => (me.member ? memberClient(me.member.id, { canReadStudy: readable }) : null),
    [me.member, readable],
  );

  const nav = [
    ...(readable ? [{ href: "/study/read", label: studyName(me.study) }] : []),
    ...(me.member
      ? [
          { href: "/study/journal", label: "My journal" },
          { href: "/study/account", label: "Account" },
        ]
      : []),
  ];
  const bare = ["/study/login", "/study/join", "/study/reset"].includes(pathname ?? "");

  const body = <MeContext.Provider value={{ ...me, refresh }}>{children}</MeContext.Provider>;

  if (bare) return <div className="study-root">{body}</div>;

  return (
    <div className="study-root">
      <AlbumPlayerProvider>
        <header className="study-top">
          <Link href="/study" className="study-brand">
            <Image src="/media/dove-mark.png" alt="" width={34} height={34} className="study-brand-dove" priority />
            <span className="study-brand-words">
              <span className="study-brand-name">All The Glory</span>
              <span className="study-brand-sub">The Study</span>
            </span>
          </Link>
          <nav className="study-nav" aria-label="The Study">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`study-nav-link ${pathname?.startsWith(n.href) ? "is-active" : ""}`}
              >
                {n.label}
              </Link>
            ))}
            {me.loaded && !me.member && (
              <>
                <Link href={`/study/login?next=${encodeURIComponent(pathname ?? "/study")}`} className="study-nav-link">
                  Log in
                </Link>
                {me.study?.signup === "open" && (
                  <Link href="/study/join" className="dash-btn dash-btn-primary study-join">
                    Join
                  </Link>
                )}
              </>
            )}
            <ListenButton />
          </nav>
        </header>
        <main className="dash-main study-main">
          {client ? <StudyClientProvider value={client}>{body}</StudyClientProvider> : body}
        </main>
        <StudyFooter />
      </AlbumPlayerProvider>
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
        <a href="/album/from-darkness-to-light">The album</a>
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
    if (me.loaded && !me.member) router.replace(`/study/login?next=${encodeURIComponent(pathname ?? "/study")}`);
  }, [me.loaded, me.member, router, pathname]);
  if (!me.member) return <p className="dash-reader-empty">{me.loaded ? "Taking you to log in…" : "Opening…"}</p>;
  return <>{children}</>;
}
