import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/platform/components/dashboard/Shell";
import { clientSections, findSection } from "@/platform/components/dashboard/nav";
import { clientViews } from "@/platform/components/dashboard/views/client";
import { clientName, projectName } from "@/platform/demo-data/dashboards/client";

export const dynamicParams = false;

export function generateStaticParams() {
  return clientSections.map((s) => ({ section: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const section = findSection(clientSections, (await params).section);
  return { title: section ? `Client portal · ${section.label}` : "Client portal" };
}

export default async function ClientSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section: slug } = await params;
  const section = findSection(clientSections, slug);
  const View = clientViews[slug];
  if (!section || !View) notFound();

  return (
    <DashboardShell
      kind="client"
      workspaceKicker="Client portal"
      workspaceName={clientName}
      workspaceSub={projectName}
      viewingAs="Client"
      nav={clientSections.map((s) => ({ href: `/demo/client/${s.slug}`, label: s.label, icon: s.icon }))}
      currentHref={`/demo/client/${slug}`}
      eyebrow="Client portal · demonstration"
      title={section.title}
      description={section.description}
    >
      <View />
    </DashboardShell>
  );
}
