"use client";

// The Study (/study): the member area of the site. A slim top bar instead
// of the owner's dashboard sidebar - members only ever see the study: the
// owner's notes (when open to them), their own journal and words, and
// their account.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { memberClient, StudyClientProvider } from "@/lib/study/client";
import type { Member, StudySettings } from "@/lib/study/members";

interface Me {
  loaded: boolean;
  member: Member | null;
  study: StudySettings | null;
  refresh: () => Promise<void>;
}

const MeContext = createContext<Me>({ loaded: false, member: null, study: null, refresh: async () => {} });
export const useMe = () => useContext(MeContext);

// Can this visitor read the owner's study?
export function canRead(me: Pick<Me, "member" | "study">): boolean {
  return me.study?.reading === "public" || (me.study?.reading === "members" && Boolean(me.member));
}

export function StudyShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [me, setMe] = useState<{ loaded: boolean; member: Member | null; study: StudySettings | null }>({
    loaded: false,
    member: null,
    study: null,
  });

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/study/me", { cache: "no-store" });
      const data = (await r.json()) as { member: Member | null; study: StudySettings };
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
    ...(readable ? [{ href: "/study/read", label: "Read the study" }] : []),
    ...(me.member
      ? [
          { href: "/study/journal", label: "My journal" },
          { href: "/study/words", label: "My words" },
          { href: "/study/account", label: "Account" },
        ]
      : []),
  ];
  const bare = ["/study/login", "/study/join", "/study/reset"].includes(pathname ?? "");

  const body = <MeContext.Provider value={{ ...me, refresh }}>{children}</MeContext.Provider>;

  if (bare) return <div className="study-root">{body}</div>;

  return (
    <div className="study-root">
      <header className="study-top">
        <Link href="/study" className="study-brand">
          <span className="eyebrow eyebrow-amber">All The Glory</span>
          <span className="study-brand-name">The Study</span>
        </Link>
        <nav className="study-nav" aria-label="The Study">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={`study-nav-link ${pathname?.startsWith(n.href) ? "is-active" : ""}`}>
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
        </nav>
      </header>
      <main className="dash-main study-main">
        {client ? <StudyClientProvider value={client}>{body}</StudyClientProvider> : body}
      </main>
    </div>
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
