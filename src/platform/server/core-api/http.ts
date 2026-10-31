import "server-only";
import type { ApplicationInput, EnquiryInput } from "@/platform/domain/schemas";
import { CoreApiUnavailableError, type AnalyticsEvent, type CoreApi, type SubmissionContext, type SubmissionResult } from "./types";

// Client for the private Hetzner API (Phase 2). Requests carry a bearer token
// and an HMAC-SHA256 signature over `timestamp.body`, so the API can reject
// replayed or tampered requests even if TLS is terminated at Cloudflare.

async function sign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join("");
}

export class HttpCoreApi implements CoreApi {
  readonly mode = "http" as const;

  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly signingSecret: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async post<T>(path: string, body: unknown, idempotencyKey?: string): Promise<T> {
    const json = JSON.stringify(body);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const headers: Record<string, string> = {
      "content-type": "application/json",
      authorization: `Bearer ${this.token}`,
      "x-request-timestamp": timestamp,
      "x-request-signature": await sign(this.signingSecret, `${timestamp}.${json}`),
    };
    if (idempotencyKey) headers["idempotency-key"] = idempotencyKey;

    let res: Response;
    try {
      res = await this.fetchImpl(new URL(path, this.baseUrl), { method: "POST", headers, body: json, signal: AbortSignal.timeout(8000) });
    } catch (error) {
      throw new CoreApiUnavailableError(`Core API unreachable: ${(error as Error).message}`);
    }
    if (res.status >= 500 || res.status === 429) throw new CoreApiUnavailableError(`Core API returned ${res.status}`);
    if (!res.ok) throw new Error(`Core API rejected the request with ${res.status}`);
    return (await res.json()) as T;
  }

  submitEnquiry(input: EnquiryInput, ctx: SubmissionContext): Promise<SubmissionResult> {
    return this.post("/v1/public/enquiries", { input, context: ctx }, ctx.idempotencyKey);
  }

  submitApplication(input: ApplicationInput, ctx: SubmissionContext): Promise<SubmissionResult> {
    return this.post("/v1/public/applications", { input, context: ctx }, ctx.idempotencyKey);
  }

  async recordEvents(events: AnalyticsEvent[]): Promise<void> {
    await this.post("/v1/public/events", { events });
  }
}

export class DisabledCoreApi implements CoreApi {
  readonly mode = "disabled" as const;
  submitEnquiry(): Promise<SubmissionResult> {
    return Promise.reject(new CoreApiUnavailableError("Submissions are not enabled in this environment"));
  }
  submitApplication(): Promise<SubmissionResult> {
    return Promise.reject(new CoreApiUnavailableError("Submissions are not enabled in this environment"));
  }
  async recordEvents(): Promise<void> {}
}
