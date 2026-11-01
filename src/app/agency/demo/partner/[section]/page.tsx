import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/platform/components/dashboard/Shell";
import { findSection, partnerSections } from "@/platform/components/dashboard/nav";
import { Callout } from "@/platform/components/dashboard/primitives";
import { partnerViews } from "@/platform/components/dashboard/views/partner";
import { partnerName } from "@/platform/demo-data/dashboards/partner";

export const dynamicParams = false;

export function generateStaticParams() {
  return partnerSections.map((s) => ({ section: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const section = findSection(partnerSections, (await params).section);
  return { title: section ? `Partner workspace · ${section.label}` : "Partner workspace" };
}

export default async function PartnerSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section: slug } = await params;
  const section = findSection(partnerSections, slug);
  const View = partnerViews[slug];
  if (!section || !View) notFound();

  return (
    <DashboardShell
      kind="partner"
      workspaceKicker="Partner workspace"
      workspaceName={partnerName}
      workspaceSub="Separate partner tenant · consent-scoped"
      viewingAs="Partner operator"
      nav={partnerSections.map((s) => ({ href: `/demo/partner/${s.slug}`, label: s.label, icon: s.icon }))}
      currentHref={`/demo/partner/${slug}`}
      eyebrow="Partner workspace · demonstration"
      title={section.title}
      description={section.description}
    >
      <div style={{ marginBottom: "1.5rem" }}>
        <Callout tone="warn" icon="alert">
          <strong>Proposed collaboration — not a confirmed partnership.</strong> The partner organisation is not named, and nothing here implies an
          agreement, endorsement or shared membership. It shows how a partner workspace would work once an agreement exists.
        </Callout>
      </div>
      <View />
    </DashboardShell>
  );
}
