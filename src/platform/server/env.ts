import "server-only";
import { z } from "zod";

// Server-only configuration for the platform. Read lazily so a missing
// optional value never breaks static page generation, and validated so a
// misconfigured deployment fails loudly instead of silently dropping
// submissions. Every variable is prefixed AGENCY so it never collides with
// All the Glory's own configuration.

z.config({ jitless: true });

const schema = z
  .object({
    deploymentEnv: z.enum(["development", "preview", "production"]),
    coreApiMode: z.enum(["dev-file", "http", "disabled"]).optional(),
    devStorePath: z.string().default(".data/agency-dev-store.json"),
    coreApiUrl: z.string().url().optional(),
    coreApiToken: z.string().min(32).optional(),
    coreApiSigningSecret: z.string().min(32).optional(),
    turnstileSecretKey: z.string().min(1).optional(),
    /** Empty means "the origin serving the request" — same-origin only. */
    allowedOrigins: z.array(z.string().url()).default([]),
    rateLimitMax: z.coerce.number().int().positive().default(8),
    rateLimitWindowSeconds: z.coerce.number().int().positive().default(600),
  })
  .transform((env) => ({
    ...env,
    coreApiMode: env.coreApiMode ?? (env.deploymentEnv === "development" ? "dev-file" : "disabled"),
  }))
  .superRefine((env, ctx) => {
    if (env.coreApiMode === "dev-file" && env.deploymentEnv === "production") {
      ctx.addIssue({ code: "custom", message: "AGENCY_CORE_API_MODE=dev-file is not allowed when AGENCY_DEPLOYMENT_ENV=production" });
    }
    if (env.coreApiMode === "http" && !(env.coreApiUrl && env.coreApiToken && env.coreApiSigningSecret)) {
      ctx.addIssue({ code: "custom", message: "AGENCY_CORE_API_MODE=http requires AGENCY_CORE_API_URL, AGENCY_CORE_API_TOKEN and AGENCY_CORE_API_SIGNING_SECRET" });
    }
    if (env.deploymentEnv !== "development" && env.coreApiMode !== "disabled" && !env.turnstileSecretKey) {
      ctx.addIssue({ code: "custom", message: "AGENCY_TURNSTILE_SECRET_KEY is required whenever submissions are enabled outside development" });
    }
  });

export type ServerEnv = z.output<typeof schema>;

const blank = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined);

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  cached = schema.parse({
    // A production build is production unless told otherwise, so a missing
    // variable can never enable the development store or the Turnstile bypass.
    deploymentEnv: blank(process.env.AGENCY_DEPLOYMENT_ENV) ?? (process.env.NODE_ENV === "production" ? "production" : "development"),
    coreApiMode: blank(process.env.AGENCY_CORE_API_MODE),
    devStorePath: blank(process.env.AGENCY_DEV_STORE_PATH),
    coreApiUrl: blank(process.env.AGENCY_CORE_API_URL),
    coreApiToken: blank(process.env.AGENCY_CORE_API_TOKEN),
    coreApiSigningSecret: blank(process.env.AGENCY_CORE_API_SIGNING_SECRET),
    turnstileSecretKey: blank(process.env.AGENCY_TURNSTILE_SECRET_KEY),
    allowedOrigins: (blank(process.env.AGENCY_ALLOWED_ORIGINS) ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => new URL(s).origin),
    rateLimitMax: blank(process.env.AGENCY_RATE_LIMIT_MAX),
    rateLimitWindowSeconds: blank(process.env.AGENCY_RATE_LIMIT_WINDOW_SECONDS),
  });
  return cached;
}

/**
 * Allowed origins for a request: the configured list, or the origin the
 * browser addressed (Host header). Comparing the browser-set Origin with Host
 * is the standard same-origin check; request.url is not reliable behind
 * proxies (Next.js reports "localhost" under `next start`).
 */
export function allowedOriginsFor(request: Request): string[] {
  const configured = serverEnv().allowedOrigins;
  if (configured.length) return configured;
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? url.protocol.replace(":", "");
  return host ? [`${proto}://${host}`] : [url.origin];
}

/** For tests only. */
export function resetServerEnvCache(): void {
  cached = undefined;
}
