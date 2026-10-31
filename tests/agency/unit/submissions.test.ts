import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { resetServerEnvCache } from "@/platform/server/env";
import { isAllowedOrigin } from "@/platform/server/security/origin";
import { FixedWindowRateLimiter } from "@/platform/server/security/rate-limit";
import { verifyTurnstile } from "@/platform/server/security/turnstile";
import { validEnquiry } from "./fixtures";

const dir = mkdtempSync(join(tmpdir(), "platform-test-"));
const storePath = join(dir, "store.json");
const ORIGIN = "http://localhost:3000";

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${ORIGIN}/api/enquiries`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN, "x-forwarded-for": "203.0.113.7", ...headers },
    body: JSON.stringify(body),
  });
}

const meta = (key: string) => ({ idempotencyKey: key, turnstileToken: "", website: "", startedAt: Date.now() - 60_000 });

async function freshPipeline(env: Record<string, string> = {}) {
  vi.resetModules();
  Object.assign(process.env, { AGENCY_DEPLOYMENT_ENV: "development", AGENCY_CORE_API_MODE: "dev-file", AGENCY_DEV_STORE_PATH: storePath, AGENCY_ALLOWED_ORIGINS: ORIGIN, AGENCY_RATE_LIMIT_MAX: "50", ...env });
  resetServerEnvCache();
  return import("@/platform/server/submissions");
}

describe("security primitives", () => {
  it("checks origin, falling back to Sec-Fetch-Site", () => {
    expect(isAllowedOrigin(new Headers({ origin: ORIGIN }), [ORIGIN])).toBe(true);
    expect(isAllowedOrigin(new Headers({ origin: "https://evil.example" }), [ORIGIN])).toBe(false);
    expect(isAllowedOrigin(new Headers({ "sec-fetch-site": "same-origin" }), [ORIGIN])).toBe(true);
    expect(isAllowedOrigin(new Headers({}), [ORIGIN])).toBe(false);
  });

  it("rate-limits per key within a window", async () => {
    let now = 0;
    const limiter = new FixedWindowRateLimiter(2, 1000, () => now);
    expect((await limiter.consume("k")).allowed).toBe(true);
    expect((await limiter.consume("k")).allowed).toBe(true);
    const third = await limiter.consume("k");
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBe(1);
    expect((await limiter.consume("other")).allowed).toBe(true);
    now = 1001;
    expect((await limiter.consume("k")).allowed).toBe(true);
  });

  it("verifies Turnstile tokens and only bypasses in development without a secret", async () => {
    const ok = vi.fn(async () => Response.json({ success: true }));
    expect(await verifyTurnstile({ token: "t", secretKey: "s", remoteIp: "1.1.1.1", idempotencyKey: "k", allowDevelopmentBypass: false, fetchImpl: ok as unknown as typeof fetch })).toEqual({ ok: true, mode: "verified" });
    const bad = vi.fn(async () => Response.json({ success: false, "error-codes": ["invalid-input-response"] }));
    expect((await verifyTurnstile({ token: "t", secretKey: "s", remoteIp: "1.1.1.1", idempotencyKey: "k", allowDevelopmentBypass: true, fetchImpl: bad as unknown as typeof fetch })).ok).toBe(false);
    expect((await verifyTurnstile({ token: "", secretKey: "s", remoteIp: "1.1.1.1", idempotencyKey: "k", allowDevelopmentBypass: true })).ok).toBe(false);
    expect(await verifyTurnstile({ token: "", secretKey: undefined, remoteIp: "x", idempotencyKey: "k", allowDevelopmentBypass: true })).toEqual({ ok: true, mode: "development-bypass" });
    expect((await verifyTurnstile({ token: "", secretKey: undefined, remoteIp: "x", idempotencyKey: "k", allowDevelopmentBypass: false })).ok).toBe(false);
  });
});

describe("public submission pipeline", () => {
  beforeEach(() => rmSync(storePath, { force: true }));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("records an enquiry with contact, consent, audit and an internal alert", async () => {
    const { handlePublicSubmission } = await freshPipeline();
    const res = await handlePublicSubmission(request({ data: validEnquiry, meta: meta("k".repeat(24)) }), "enquiry");
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.reference).toMatch(/^ENQ-[A-Z0-9]{6}$/);

    const store = JSON.parse(readFileSync(storePath, "utf8"));
    expect(store.contacts).toHaveLength(1);
    expect(store.contacts[0].email).toBe("client@example.com");
    expect(store.enquiries[0].state).toBe("new");
    expect(store.consents.map((c: { purpose: string }) => c.purpose)).toEqual(["privacy-notice"]);
    expect(store.outbox.some((o: { channel: string }) => o.channel === "internal-alert")).toBe(true);
    expect(store.auditEvents.some((a: { action: string }) => a.action === "enquiry.received")).toBe(true);
  });

  it("is idempotent: a retried submission returns the original reference", async () => {
    const { handlePublicSubmission } = await freshPipeline();
    const first = await (await handlePublicSubmission(request({ data: validEnquiry, meta: meta("r".repeat(24)) }), "enquiry")).json();
    const retry = await handlePublicSubmission(request({ data: validEnquiry, meta: meta("r".repeat(24)) }), "enquiry");
    expect(retry.status).toBe(200);
    expect((await retry.json()).reference).toBe(first.reference);
    expect(JSON.parse(readFileSync(storePath, "utf8")).enquiries).toHaveLength(1);
  });

  it("deduplicates contacts and records marketing consent only when ticked", async () => {
    const { handlePublicSubmission } = await freshPipeline();
    await handlePublicSubmission(request({ data: validEnquiry, meta: meta("a".repeat(24)) }), "enquiry");
    await handlePublicSubmission(request({ data: { ...validEnquiry, email: " CLIENT@example.com", marketingOptIn: true }, meta: meta("b".repeat(24)) }), "enquiry");
    const store = JSON.parse(readFileSync(storePath, "utf8"));
    expect(store.contacts).toHaveLength(1);
    expect(store.enquiries).toHaveLength(2);
    expect(store.consents.filter((c: { purpose: string }) => c.purpose === "marketing")).toHaveLength(1);
  });

  it("rejects cross-site requests", async () => {
    const { handlePublicSubmission } = await freshPipeline();
    const res = await handlePublicSubmission(request({ data: validEnquiry, meta: meta("c".repeat(24)) }, { origin: "https://evil.example" }), "enquiry");
    expect(res.status).toBe(403);
  });

  it("returns field errors for invalid input", async () => {
    const { handlePublicSubmission } = await freshPipeline();
    const res = await handlePublicSubmission(request({ data: { ...validEnquiry, email: "x" }, meta: meta("d".repeat(24)) }), "enquiry");
    expect(res.status).toBe(422);
    expect((await res.json()).errors.email).toBeTruthy();
  });

  it("rejects honeypot and too-fast submissions generically", async () => {
    const { handlePublicSubmission } = await freshPipeline();
    const honeypot = await handlePublicSubmission(request({ data: validEnquiry, meta: { ...meta("e".repeat(24)), website: "x" } }), "enquiry");
    expect(honeypot.status).toBe(400);
    expect((await honeypot.json()).errors).toBeUndefined();
    const fast = await handlePublicSubmission(request({ data: validEnquiry, meta: { ...meta("f".repeat(24)), startedAt: Date.now() } }), "enquiry");
    expect(fast.status).toBe(400);
  });

  it("rate-limits repeated submissions from one address", async () => {
    const { handlePublicSubmission } = await freshPipeline({ AGENCY_RATE_LIMIT_MAX: "2" });
    for (const k of ["g", "h"]) expect((await handlePublicSubmission(request({ data: validEnquiry, meta: meta(k.repeat(24)) }), "enquiry")).status).toBe(201);
    const limited = await handlePublicSubmission(request({ data: validEnquiry, meta: meta("i".repeat(24)) }), "enquiry");
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBeTruthy();
  });

  it("fails safely with 503 when submissions are disabled", async () => {
    const { handlePublicSubmission } = await freshPipeline({ AGENCY_CORE_API_MODE: "disabled" });
    const res = await handlePublicSubmission(request({ data: validEnquiry, meta: meta("j".repeat(24)) }), "enquiry");
    expect(res.status).toBe(503);
    expect((await res.json()).message).toMatch(/Nothing was lost/);
  });
});

describe("environment guard", () => {
  it("defaults a production build to production with submissions disabled and no bypass", async () => {
    vi.resetModules();
    const saved = { ...process.env };
    for (const k of Object.keys(process.env)) if (k.startsWith("AGENCY_")) delete process.env[k];
    Object.assign(process.env, { NODE_ENV: "production" });
    const { serverEnv, resetServerEnvCache: reset } = await import("@/platform/server/env");
    reset();
    expect(serverEnv()).toMatchObject({ deploymentEnv: "production", coreApiMode: "disabled" });
    process.env = saved;
  });

  it("allows only the serving origin when no origins are configured", async () => {
    vi.resetModules();
    delete process.env.AGENCY_ALLOWED_ORIGINS;
    const { allowedOriginsFor, resetServerEnvCache: reset } = await import("@/platform/server/env");
    reset();
    expect(allowedOriginsFor(new Request("https://alltheglory.co.za/agency/api/enquiries"))).toEqual(["https://alltheglory.co.za"]);
    const proxied = { url: "http://localhost:3000/agency/api/enquiries", headers: new Headers({ host: "127.0.0.1:3300", "x-forwarded-proto": "http" }) } as unknown as Request;
    expect(allowedOriginsFor(proxied)).toEqual(["http://127.0.0.1:3300"]);
  });

  it("refuses the development store in production", async () => {
    vi.resetModules();
    Object.assign(process.env, { AGENCY_DEPLOYMENT_ENV: "production", AGENCY_CORE_API_MODE: "dev-file", AGENCY_TURNSTILE_SECRET_KEY: "x" });
    const { serverEnv, resetServerEnvCache: reset } = await import("@/platform/server/env");
    reset();
    expect(() => serverEnv()).toThrow(/dev-file is not allowed/);
    Object.assign(process.env, { AGENCY_DEPLOYMENT_ENV: "development" });
    delete process.env.AGENCY_TURNSTILE_SECRET_KEY;
  });
});
