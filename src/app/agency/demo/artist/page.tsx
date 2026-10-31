import { withRoute } from "@/platform/config/client-env";
import { redirect } from "next/navigation";
import { artistTenantSlugs } from "@/platform/demo-data/dashboards/artist";

export default function ArtistIndex() {
  redirect(withRoute(`/demo/artist/${artistTenantSlugs[0]}/overview`));
}
