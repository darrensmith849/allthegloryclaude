import { describe, expect, it } from "vitest";
import { normaliseEmail, normalisePhone } from "@/platform/domain/contacts";
import { canTransitionApplication, canTransitionEnquiry } from "@/platform/domain/lifecycle";
import { applicationSchema, enquiryRequestSchema, enquirySchema, fieldErrors } from "@/platform/domain/schemas";
import { isMarketable, type ConsentRecord } from "@/platform/domain/consent";
import { validEnquiry } from "./fixtures";

describe("enquiry schema", () => {
  it("accepts a complete brief", () => {
    expect(enquirySchema.safeParse(validEnquiry).success).toBe(true);
  });

  it("requires privacy acknowledgement but never marketing consent", () => {
    const noPrivacy = enquirySchema.safeParse({ ...validEnquiry, privacyAccepted: false });
    expect(noPrivacy.success).toBe(false);
    const { marketingOptIn: _omit, ...withoutMarketing } = validEnquiry;
    const parsed = enquirySchema.parse(withoutMarketing);
    expect(parsed.marketingOptIn).toBe(false);
  });

  it("reports readable field errors", () => {
    const result = enquirySchema.safeParse({ ...validEnquiry, email: "nope", services: [], brief: "short", references: ["ftp://x"] });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrors(result.error);
      expect(Object.keys(errors).sort()).toEqual(["brief", "email", "references", "services"]);
      expect(errors.references).toMatch(/https/);
    }
  });

  it("rejects unknown option values and oversized input", () => {
    expect(enquirySchema.safeParse({ ...validEnquiry, services: ["hacking"] }).success).toBe(false);
    expect(enquirySchema.safeParse({ ...validEnquiry, brief: "x".repeat(4001) }).success).toBe(false);
  });

  it("rejects a filled honeypot and malformed idempotency keys", () => {
    const meta = { idempotencyKey: "a".repeat(32), turnstileToken: "", website: "", startedAt: Date.now() };
    expect(enquiryRequestSchema.safeParse({ data: validEnquiry, meta }).success).toBe(true);
    expect(enquiryRequestSchema.safeParse({ data: validEnquiry, meta: { ...meta, website: "spam" } }).success).toBe(false);
    expect(enquiryRequestSchema.safeParse({ data: validEnquiry, meta: { ...meta, idempotencyKey: "short" } }).success).toBe(false);
  });
});

describe("application schema", () => {
  const valid = {
    name: "Test Creative",
    email: "creative@example.com",
    country: "Zimbabwe",
    roles: ["producer"],
    genres: ["afro-pop"],
    experience: "established",
    portfolioLinks: ["https://example.com/work"],
    statement: "Producer and arranger focused on vocal-led records and remote collaboration.",
    rightsConfirmed: true,
    privacyAccepted: true,
  };

  it("requires rights confirmation and at least one portfolio link", () => {
    expect(applicationSchema.safeParse(valid).success).toBe(true);
    expect(applicationSchema.safeParse({ ...valid, rightsConfirmed: false }).success).toBe(false);
    expect(applicationSchema.safeParse({ ...valid, portfolioLinks: [] }).success).toBe(false);
  });

  it("caps roles and genres", () => {
    expect(applicationSchema.safeParse({ ...valid, roles: ["producer", "mix-engineer", "songwriter", "vocalist", "keys", "composer"] }).success).toBe(false);
  });
});

describe("contact normalisation", () => {
  it("dedupes on a conservative email key", () => {
    expect(normaliseEmail("  Client@Example.COM ")).toBe("client@example.com");
    expect(normaliseEmail("first.last+tag@example.com")).toBe("first.last+tag@example.com");
  });

  it("keeps only international phone numbers", () => {
    expect(normalisePhone("+263 77 000 0000")).toBe("+263770000000");
    expect(normalisePhone("00263770000000")).toBe("+263770000000");
    expect(normalisePhone("0770000000")).toBeNull();
    expect(normalisePhone("")).toBeNull();
  });
});

describe("consent", () => {
  const record = (granted: boolean, at: string, withdrawnAt: string | null = null): ConsentRecord => ({
    id: at, contactId: "con_1", purpose: "marketing", granted, wordingVersion: "v1", source: "project-brief", recordedAt: at, withdrawnAt,
  });

  it("markets only with current, explicit consent and no suppression", () => {
    expect(isMarketable([], false)).toBe(false);
    expect(isMarketable([record(true, "2026-01-01")], false)).toBe(true);
    expect(isMarketable([record(true, "2026-01-01")], true)).toBe(false);
    expect(isMarketable([record(true, "2026-01-01", "2026-02-01")], false)).toBe(false);
    expect(isMarketable([record(true, "2026-01-01"), record(false, "2026-03-01")], false)).toBe(false);
  });
});

describe("lifecycles", () => {
  it("move beyond new only through allowed transitions", () => {
    expect(canTransitionEnquiry("new", "triaged")).toBe(true);
    expect(canTransitionEnquiry("new", "won")).toBe(false);
    expect(canTransitionApplication("received", "verified")).toBe(false);
    expect(canTransitionApplication("verification", "verified")).toBe(true);
  });
});
