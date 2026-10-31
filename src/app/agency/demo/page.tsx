import type { Metadata } from "next";
import Link from "@/platform/components/ui/Link";
import { DemoBanner } from "@/platform/components/dashboard/Shell";
import { artistSections, clientSections, companySections, partnerSections } from "@/platform/components/dashboard/nav";
import { Icon, type IconName } from "@/platform/components/ui/Icon";
import { partnerDisplayName, partnerAssociations } from "@/platform/config/approvals";
import { brand } from "@/platform/config/brand";

export const metadata: Metadata = {
  title: "All demonstrations",
  description: "Company, artist, client and partner dashboards, shown with invented demonstration data.",
};

const views: { no: string; href: string; title: string; who: string; body: string; icon: IconName; sections: readonly { label: string }[] }[] = [
  {
    no: "01",
    href: "/demo/company/overview",
    title: "Company dashboard",
    who: "Staff: owner, administrators, operations, finance, roster, auditors",
    body: "The operating view: leads, clients and consent, talent verification, projects, contracts, finance, analytics, partners, permissions and audit.",
    icon: "briefcase",
    sections: companySections,
  },
  {
    no: "02",
    href: "/demo/artist/msasa-room/overview",
    title: "Artist workspace",
    who: "Each verified creative — branded per tenant",
    body: "Profile and media, opportunities, bookings, projects, split sheets, statements, compliance status, insights and training.",
    icon: "mic",
    sections: artistSections,
  },
  {
    no: "03",
    href: "/demo/client/overview",
    title: "Client portal",
    who: "Labels, artists, agencies, brands, film, TV and games",
    body: "Brief, fixed quote and agreements, payments and invoices, drafts and contracted revisions, files and messages.",
    icon: "people",
    sections: clientSections,
  },
  {
    no: "04",
    href: "/demo/partner/overview",
    title: "Partner workspace",
    who: partnerDisplayName(partnerAssociations.artsSupportPartner, "Arts-support partner (proposed)"),
    body: "Referred creatives, programmes, support workflow status and aggregated impact — all scoped by the creative's consent.",
    icon: "heart",
    sections: partnerSections,
  },
];

export default function DemoHub() {
  return (
    <>
      <DemoBanner />
      <main id="main" className="demo-hub" tabIndex={-1}>
        <div className="demo-hub__rings" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="container">
          <header className="demo-hub__head">
            <p className="micro">Platform demonstration · Phase 1</p>
            <h1>
              Four views. <em>One platform</em> underneath.
            </h1>
            <p className="demo-hub__lede">
              {brand.name} runs the company, every artist workspace, every client portal and every partner workspace from one shared, multi-tenant
              application. These demonstrations use invented data — no real person, client, partner, price or payment appears anywhere.
            </p>
          </header>

          <div className="demo-hub__grid">
            {views.map((v) => (
              <article className="demo-tile" key={v.href}>
                <span className="demo-tile__no">{v.no}</span>
                <h2>
                  <Link href={v.href}>{v.title}</Link>
                </h2>
                <p>{v.body}</p>
                <p className="demo-tile__who">{v.who}</p>
                <ul aria-label={`${v.title} sections`}>
                  {v.sections.map((s) => (
                    <li key={s.label}>{s.label}</li>
                  ))}
                </ul>
                <span className="demo-tile__go" aria-hidden="true">
                  Open <Icon name="arrow-right" />
                </span>
              </article>
            ))}
          </div>

          <div className="demo-hub__notes">
            <section className="panel" aria-labelledby="tenant-model">
              <h2 id="tenant-model">The tenant model</h2>
              <ul>
                <li>Every record carries its organisation (tenant); the server enforces the boundary, never the browser.</li>
                <li>Artists and clients act inside an operator tenant, limited to records they own.</li>
                <li>Partners are separate tenants that see only what a creative has consented to share.</li>
                <li>
                  Artist workspaces are themed views of the same code — switch between{" "}
                  <Link href="/demo/artist/msasa-room/overview">Msasa Room</Link> and <Link href="/demo/artist/kopje-sound/overview">Kopje Sound</Link> to
                  see two tenants, one codebase.
                </li>
              </ul>
            </section>
            <section className="panel" aria-labelledby="phase-two">
              <h2 id="phase-two">What arrives in Phase 2</h2>
              <ul>
                <li>Secure sign-in with server-side sessions and MFA for administrators and finance.</li>
                <li>Permission checks on every request, using the role matrix already shown in the company dashboard.</li>
                <li>PostgreSQL on private infrastructure as the single system of record.</li>
                <li>Real roster onboarding, CRM, projects, quotes, contracts, invoices and payout records.</li>
              </ul>
            </section>
            <section className="panel" aria-labelledby="demo-rules">
              <h2 id="demo-rules">How to read the demonstration</h2>
              <ul>
                <li>Names marked “sample”, “demo” or “fictional” are invented.</li>
                <li>Amounts are demonstration figures, not prices, rates or payments.</li>
                <li>Buttons that would change data are deliberately inactive.</li>
                <li>The proposed partner collaboration is unconfirmed and unnamed.</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
