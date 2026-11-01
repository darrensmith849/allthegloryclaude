import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/platform/components/dashboard/Shell";
import { companySections, findSection } from "@/platform/components/dashboard/nav";
import { companyViews } from "@/platform/components/dashboard/views/company";

export const dynamicParams = false;

export function generateStaticParams() {
  return companySections.map((s) => ({ section: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const section = findSection(companySections, (await params).section);
  return { title: section ? `Company · ${section.label}` : "Company" };
}

export default async function CompanySectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section: slug } = await params;
  const section = findSection(companySections, slug);
  const View = companyViews[slug];
  if (!section || !View) notFound();

  return (
    <DashboardShell
      kind="company"
      workspaceKicker="Company dashboard"
      workspaceName="Operations"
      workspaceSub="Operator tenant · demonstration"
      viewingAs="Company administrator"
      nav={companySections.map((s) => ({ href: `/demo/company/${s.slug}`, label: s.label, icon: s.icon }))}
      currentHref={`/demo/company/${slug}`}
      eyebrow="Company dashboard · demonstration"
      title={section.title}
      description={section.description}
    >
      <View />
    </DashboardShell>
  );
}
