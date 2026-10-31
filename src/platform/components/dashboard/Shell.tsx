import Link from "@/platform/components/ui/Link";
import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "@/platform/components/ui/Icon";
import { NavScroller } from "./NavScroller";

export type DashboardKind = "company" | "artist" | "client" | "partner";

const dashboards: { kind: DashboardKind; href: string; label: string }[] = [
  { kind: "company", href: "/demo/company/overview", label: "Company" },
  { kind: "artist", href: "/demo/artist/msasa-room/overview", label: "Artist" },
  { kind: "client", href: "/demo/client/overview", label: "Client" },
  { kind: "partner", href: "/demo/partner/overview", label: "Partner" },
];

/** Persistent banner on every demonstration page. */
export function DemoBanner({ current }: { current?: DashboardKind }) {
  return (
    <div className="demo-banner" role="region" aria-label="Demonstration notice">
      <div className="demo-banner__inner">
        <p className="demo-banner__label">
          <span className="demo-banner__flag">Demonstration</span>
          <span>
            <strong>Invented data.</strong> No real people, clients, partners, prices or payments.
          </span>
        </p>
        <nav className="demo-banner__nav" aria-label="Demonstration views">
          <NavScroller>
            <li>
              <Link href="/" className="demo-banner__back">
                <Icon name="arrow-right" />
                Back to website
              </Link>
            </li>
            <li>
              <Link href="/demo" aria-current={current === undefined ? "page" : undefined}>
                All demos
              </Link>
            </li>
            {dashboards.map((d) => (
              <li key={d.kind}>
                <Link href={d.href} aria-current={current === d.kind ? "page" : undefined}>
                  {d.label}
                </Link>
              </li>
            ))}
          </NavScroller>
        </nav>
      </div>
    </div>
  );
}

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

export function DashboardShell({
  kind,
  workspaceKicker,
  workspaceName,
  workspaceSub,
  viewingAs,
  nav,
  currentHref,
  eyebrow,
  title,
  description,
  headerSlot,
  themeStyle,
  children,
}: {
  kind: DashboardKind;
  workspaceKicker: string;
  workspaceName: string;
  workspaceSub?: string;
  viewingAs: string;
  nav: NavItem[];
  currentHref: string;
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  headerSlot?: ReactNode;
  themeStyle?: Record<string, string>;
  children: ReactNode;
}) {
  return (
    <>
      <DemoBanner current={kind} />
      <div className="dash" style={themeStyle as CSSProperties | undefined}>
        <aside className="dash__side" aria-label={`${workspaceName} workspace`}>
          <div className="dash__workspace">
            <span className="dash__workspace-kicker">{workspaceKicker}</span>
            <span className="dash__workspace-name">{workspaceName}</span>
            {workspaceSub ? <span className="dash__workspace-sub">{workspaceSub}</span> : null}
          </div>
          <nav className="dash__nav" aria-label={`${workspaceName} sections`}>
            <NavScroller>
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} aria-current={item.href === currentHref ? "page" : undefined}>
                    <Icon name={item.icon} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </NavScroller>
          </nav>
          <div className="dash__side-foot">
            <span>
              Viewing as <strong>{viewingAs}</strong>
            </span>
            <span>Phase 2 replaces this demonstration with authenticated, permission-checked access.</span>
          </div>
        </aside>
        <main id="main" className="dash__main" tabIndex={-1}>
          <div className="dash__content">
            <header className="dash-head">
              {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
              <div className="dash-head__top">
                <h1>{title}</h1>
                {headerSlot ? <div className="dash-head__slot">{headerSlot}</div> : null}
              </div>
              {description ? <p className="dash-head__desc">{description}</p> : null}
            </header>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
