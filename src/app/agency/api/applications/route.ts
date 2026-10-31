import { handlePublicSubmission } from "@/platform/server/submissions";

export const dynamic = "force-dynamic";

export function POST(request: Request): Promise<Response> {
  return handlePublicSubmission(request, "application");
}
