import { withRoute } from "@/platform/config/client-env";
import { redirect } from "next/navigation";

export default function ClientIndex() {
  redirect(withRoute("/demo/client/overview"));
}
