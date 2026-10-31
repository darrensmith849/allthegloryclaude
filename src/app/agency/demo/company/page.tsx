import { withRoute } from "@/platform/config/client-env";
import { redirect } from "next/navigation";

export default function CompanyIndex() {
  redirect(withRoute("/demo/company/overview"));
}
