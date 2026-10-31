import type { ApplicationInput, EnquiryInput } from "@/platform/domain/schemas";

// The contract between the Cloudflare edge and the private core API on
// Hetzner. PostgreSQL behind that API is the only system of record; the edge
// keeps no competing copy (MASTER_PLAN §10).

export interface SubmissionContext {
  idempotencyKey: string;
  receivedAt: string;
  /** Hashed client address — never the raw IP. */
  clientKey: string;
  userAgent: string | null;
  turnstileMode: "verified" | "development-bypass";
  policyVersions: { privacy: string; marketingConsent: string };
}

export interface SubmissionResult {
  id: string;
  reference: string;
  /** True when this idempotency key was already processed; the original result is returned. */
  replayed: boolean;
  /** Whether the internal alert was queued. Persistence succeeding without an alert is reported, not hidden. */
  alertQueued: boolean;
}

export interface AnalyticsEvent {
  name: string;
  path: string;
  /** Anonymous, per-tab session identifier; no cookies. */
  session: string;
  props?: Record<string, string | number | boolean>;
  occurredAt: string;
}

export interface CoreApi {
  readonly mode: "dev-file" | "http" | "disabled";
  submitEnquiry(input: EnquiryInput, ctx: SubmissionContext): Promise<SubmissionResult>;
  submitApplication(input: ApplicationInput, ctx: SubmissionContext): Promise<SubmissionResult>;
  recordEvents(events: AnalyticsEvent[]): Promise<void>;
}

export class CoreApiUnavailableError extends Error {}
