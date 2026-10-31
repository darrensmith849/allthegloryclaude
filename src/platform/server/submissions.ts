import "server-only";
import type { z } from "zod";
import { brand } from "@/platform/config/brand";
import { applicationRequestSchema, enquiryRequestSchema, fieldErrors } from "@/platform/domain/schemas";
import { coreApi, CoreApiUnavailableError, type SubmissionContext, type SubmissionResult } from "./core-api";
import { allowedOriginsFor, serverEnv } from "./env";
import { isAllowedOrigin } from "./security/origin";
import { clientAddress, FixedWindowRateLimiter, hashKey, type RateLimiter } from "./security/rate-limit";
import { verifyTurnstile } from "./security/turnstile";

// The public submission pipeline shared by the brief and roster-application
// endpoints. Every failure that the visitor can recover from returns a
// specific, human message; the form keeps their input (MASTER_PLAN §17).

const MAX_BODY_BYTES = 32 * 1024;
/** Faster than this from first render to submit is treated as automated. */
const MIN_FILL_MS = 2500;

export type SubmissionKind = "enquiry" | "application";

export interface SubmissionResponseBody {
  ok: boolean;
  reference?: string;
  message: string;
  errors?: Record<string, string>;
}

let limiter: RateLimiter | undefined;
function rateLimiter(): RateLimiter {
  const env = serverEnv();
  limiter ??= new FixedWindowRateLimiter(env.rateLimitMax, env.rateLimitWindowSeconds * 1000);
  return limiter;
}

function respond(status: number, body: SubmissionResponseBody, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store", ...headers } });
}

async function readJson(request: Request): Promise<unknown | { tooLarge: true } | undefined> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return { tooLarge: true };
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return { tooLarge: true };
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export async function handlePublicSubmission(request: Request, kind: SubmissionKind): Promise<Response> {
  const env = serverEnv();

  if (!isAllowedOrigin(request.headers, allowedOriginsFor(request))) {
    return respond(403, { ok: false, message: "This form can only be submitted from our website." });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return respond(415, { ok: false, message: "Unsupported request format." });
  }

  const ip = clientAddress(request.headers);
  const clientKey = await hashKey(ip, kind);
  const limit = await rateLimiter().consume(clientKey);
  if (!limit.allowed) {
    return respond(429, { ok: false, message: `Too many submissions from this connection. Please try again in about ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s). Your answers are still here.` }, { "retry-after": String(limit.retryAfterSeconds) });
  }

  const body = await readJson(request);
  if (body === undefined) return respond(400, { ok: false, message: "We could not read that submission. Please try again." });
  if (typeof body === "object" && body !== null && "tooLarge" in body) {
    return respond(413, { ok: false, message: "That submission is too large. Please shorten the longer answers." });
  }

  const schema: z.ZodType<{ data: unknown; meta: { idempotencyKey: string; turnstileToken: string; website: string; startedAt: number } }> =
    kind === "enquiry" ? enquiryRequestSchema : applicationRequestSchema;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    // Honeypot and meta problems are reported generically: never as field errors a bot can learn from.
    const metaProblem = Object.keys(errors).some((k) => k.startsWith("meta"));
    if (metaProblem) return respond(400, { ok: false, message: "We could not accept this submission. Please refresh the page and try again." });
    const dataErrors = Object.fromEntries(Object.entries(errors).map(([k, v]) => [k.replace(/^data\./, ""), v]));
    return respond(422, { ok: false, message: "Please check the highlighted fields.", errors: dataErrors });
  }

  const { meta, data } = parsed.data;
  if (Date.now() - meta.startedAt < MIN_FILL_MS) {
    return respond(400, { ok: false, message: "That was faster than we expected. Please review your answers and submit again." });
  }

  const turnstile = await verifyTurnstile({
    token: meta.turnstileToken,
    secretKey: env.turnstileSecretKey,
    remoteIp: ip,
    idempotencyKey: meta.idempotencyKey,
    allowDevelopmentBypass: env.deploymentEnv === "development",
  });
  if (!turnstile.ok) {
    return respond(403, { ok: false, message: "We could not verify this submission. Please complete the check again — your answers are still here." });
  }

  const ctx: SubmissionContext = {
    idempotencyKey: meta.idempotencyKey,
    receivedAt: new Date().toISOString(),
    clientKey,
    userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    turnstileMode: turnstile.mode,
    policyVersions: { privacy: brand.policyVersions.privacy, marketingConsent: brand.policyVersions.marketingConsent },
  };

  let result: SubmissionResult;
  try {
    const api = await coreApi();
    result = kind === "enquiry"
      ? await api.submitEnquiry(data as Parameters<typeof api.submitEnquiry>[0], ctx)
      : await api.submitApplication(data as Parameters<typeof api.submitApplication>[0], ctx);
  } catch (error) {
    const unavailable = error instanceof CoreApiUnavailableError;
    console.error(`[submission:${kind}] ${unavailable ? "core API unavailable" : "unexpected failure"}`, (error as Error).message);
    return respond(503, { ok: false, message: "We could not save your submission just now. Nothing was lost — please try again in a moment." });
  }

  if (!result.alertQueued) console.error(`[submission:${kind}] stored ${result.id} but the internal alert was not queued`);

  const message = kind === "enquiry"
    ? "Thank you. Your brief has been received and a project lead will review it."
    : "Thank you. Your application has been received and will be reviewed by the roster team.";
  return respond(result.replayed ? 200 : 201, { ok: true, reference: result.reference, message });
}
