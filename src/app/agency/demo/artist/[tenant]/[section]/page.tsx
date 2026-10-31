import type { Metadata } from "next";
import Link from "@/platform/components/ui/Link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/platform/components/dashboard/Shell";
import { artistSections, findSection } from "@/platform/components/dashboard/nav";
import { artistViews } from "@/platform/components/dashboard/views/artist";
import { themeToStyle } from "@/platform/config/theme";
import { artistTenantSlugs, artistWorkspace, isArtistTenant, tenantThemes } from "@/platform/demo-data/dashboards/artist";
import { findSampleProfile } from "@/platform/demo-data/roster";

export const dynamicParams = false;

export function generateStaticParams() {
  return artistTenantSlugs.flatMap((tenant) => artistSections.map((s) => ({ tenant, section: s.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ tenant: string; section: string }> }): Promise<Metadata> {
  const { tenant, section } = await params;
  const s = findSection(artistSections, section);
  const name = findSampleProfile(tenant)?.name ?? "Artist";
  return { title: s ? `${name} workspace · ${s.label}` : "Artist workspace" };
}

export default async function ArtistSectionPage({ params }: { params: Promise<{ tenant: string; section: string }> }) {
  const { tenant, section: slug } = await params;
  const section = findSection(artistSections, slug);
  const View = artistViews[slug];
  if (!isArtistTenant(tenant) || !section || !View) notFound();

  const w = artistWorkspace(tenant);

  // One component tree, two tenants: only the theme tokens and data differ.
  const switcher = (
    <nav className="tenant-switch" aria-label="Switch demonstration workspace">
      <span className="tenant-switch__label">Tenant</span>
      {artistTenantSlugs.map((t) => (
        <Link key={t} href={`/demo/artist/${t}/${slug}`} aria-current={t === tenant ? "true" : undefined}>
          <span className="tenant-switch__swatch" style={{ background: tenantThemes[t].accent, color: tenantThemes[t].accent }} aria-hidden="true" />
          {findSampleProfile(t)?.name}
        </Link>
      ))}
    </nav>
  );

  return (
    <DashboardShell
      kind="artist"
      workspaceKicker="Artist workspace"
      workspaceName={w.profile.name}
      workspaceSub="Sample profile · fictional tenant"
      viewingAs="Artist / creative"
      nav={artistSections.map((s) => ({ href: `/demo/artist/${tenant}/${s.slug}`, label: s.label, icon: s.icon }))}
      currentHref={`/demo/artist/${tenant}/${slug}`}
      eyebrow={`${w.profile.name} · artist workspace · demonstration`}
      title={section.title}
      description={section.description}
      headerSlot={switcher}
      themeStyle={themeToStyle(w.theme)}
    >
      <View w={w} />
    </DashboardShell>
  );
}
