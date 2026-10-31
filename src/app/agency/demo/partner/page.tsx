import { withRoute } from "@/platform/config/client-env";
import { redirect } from "next/navigation";

export default function PartnerIndex() {
  redirect(withRoute("/demo/partner/overview"));
}
