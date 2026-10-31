import { withRoute } from "@/platform/config/client-env";
import { notFound, redirect } from "next/navigation";
import { artistTenantSlugs, isArtistTenant } from "@/platform/demo-data/dashboards/artist";

export const dynamicParams = false;

export function generateStaticParams() {
  return artistTenantSlugs.map((tenant) => ({ tenant }));
}

export default async function TenantIndex({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  if (!isArtistTenant(tenant)) notFound();
  redirect(withRoute(`/demo/artist/${tenant}/overview`));
}
