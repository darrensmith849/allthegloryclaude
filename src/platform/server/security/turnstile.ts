// Cloudflare Turnstile server-side verification.
// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileOutcome = { ok: true; mode: "verified" | "development-bypass" } | { ok: false; reason: string };

export async function verifyTurnstile(options: {
  token: string;
  secretKey: string | undefined;
  remoteIp: string;
  idempotencyKey: string;
  allowDevelopmentBypass: boolean;
  fetchImpl?: typeof fetch;
}): Promise<TurnstileOutcome> {
  if (!options.secretKey) {
    // Only reachable when DEPLOYMENT_ENV=development (enforced in env.ts).
    return options.allowDevelopmentBypass ? { ok: true, mode: "development-bypass" } : { ok: false, reason: "turnstile-not-configured" };
  }
  if (!options.token) return { ok: false, reason: "missing-token" };

  const body = new FormData();
  body.append("secret", options.secretKey);
  body.append("response", options.token);
  if (options.remoteIp !== "unknown") body.append("remoteip", options.remoteIp);
  body.append("idempotency_key", options.idempotencyKey);

  try {
    const res = await (options.fetchImpl ?? fetch)(VERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(5000) });
    const outcome = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    return outcome.success ? { ok: true, mode: "verified" } : { ok: false, reason: outcome["error-codes"]?.join(",") || "rejected" };
  } catch {
    return { ok: false, reason: "verification-unavailable" };
  }
}
