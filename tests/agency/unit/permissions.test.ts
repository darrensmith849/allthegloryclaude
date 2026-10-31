import { describe, expect, it } from "vitest";
import { authorize, can, roleMatrix, roles, type Actor } from "@/platform/domain/permissions";

const ORG_A = "org_a";
const ORG_B = "org_b";
const PARTNER = "org_partner";

const admin: Actor = { userId: "u1", memberships: [{ organisationId: ORG_A, organisationKind: "operator", role: "company_admin" }], mfaVerified: true };
const finance: Actor = { userId: "u2", memberships: [{ organisationId: ORG_A, organisationKind: "operator", role: "finance_operator" }] };
const artist: Actor = { userId: "u3", memberships: [{ organisationId: ORG_A, organisationKind: "operator", role: "artist", artistId: "art_1" }] };
const client: Actor = { userId: "u4", memberships: [{ organisationId: ORG_A, organisationKind: "operator", role: "client", clientId: "cli_1" }] };
const partner: Actor = { userId: "u5", memberships: [{ organisationId: PARTNER, organisationKind: "partner", role: "partner_operator" }] };
const auditor: Actor = { userId: "u6", memberships: [{ organisationId: ORG_A, organisationKind: "operator", role: "auditor" }] };

describe("tenant isolation", () => {
  it("denies any access across operator tenants", () => {
    expect(authorize(admin, "projects:read", { organisationId: ORG_B })).toEqual({ allowed: false, reason: "tenant-boundary" });
  });

  it("allows staff within their own tenant", () => {
    expect(authorize(admin, "projects:read", { organisationId: ORG_A })).toEqual({ allowed: true });
  });
});

describe("ownership scopes", () => {
  it("lets an artist see only records they participate in", () => {
    expect(authorize(artist, "projects:read", { organisationId: ORG_A, artistIds: ["art_1", "art_2"] }).allowed).toBe(true);
    expect(authorize(artist, "projects:read", { organisationId: ORG_A, artistIds: ["art_2"] })).toEqual({ allowed: false, reason: "not-owner" });
    expect(authorize(artist, "projects:read", { organisationId: ORG_A })).toEqual({ allowed: false, reason: "not-owner" });
  });

  it("lets a client see only their own projects", () => {
    expect(authorize(client, "projects:read", { organisationId: ORG_A, clientId: "cli_1" }).allowed).toBe(true);
    expect(authorize(client, "projects:read", { organisationId: ORG_A, clientId: "cli_2" })).toEqual({ allowed: false, reason: "not-owner" });
  });

  it("never gives artists or clients finance-wide or identity access", () => {
    for (const actor of [artist, client]) {
      expect(authorize(actor, "finance:read", { organisationId: ORG_A, artistIds: ["art_1"], clientId: "cli_1" }).allowed).toBe(false);
      expect(authorize(actor, "identity:read", { organisationId: ORG_A, artistIds: ["art_1"], clientId: "cli_1" }).allowed).toBe(false);
    }
  });
});

describe("partners", () => {
  it("see records only with an explicit consent grant", () => {
    expect(authorize(partner, "partner-referrals:read", { organisationId: ORG_A, consentedPartnerIds: [PARTNER] }).allowed).toBe(true);
    expect(authorize(partner, "partner-referrals:read", { organisationId: ORG_A, consentedPartnerIds: [] })).toEqual({ allowed: false, reason: "no-consent" });
  });

  it("cannot reach commercial or finance records even with consent", () => {
    expect(authorize(partner, "finance:read", { organisationId: ORG_A, consentedPartnerIds: [PARTNER] })).toEqual({ allowed: false, reason: "tenant-boundary" });
    expect(authorize(partner, "contracts:read", { organisationId: ORG_A, consentedPartnerIds: [PARTNER] }).allowed).toBe(false);
  });
});

describe("sensitive permissions", () => {
  it("require MFA for finance writes", () => {
    expect(authorize(finance, "payouts:approve", { organisationId: ORG_A })).toEqual({ allowed: false, reason: "mfa-required" });
    expect(authorize({ ...finance, mfaVerified: true }, "payouts:approve", { organisationId: ORG_A }).allowed).toBe(true);
  });

  it("keep the auditor read-only", () => {
    const writes = roleMatrix.auditor.filter((p) => /:(write|issue|approve|manage|verify|sign|submit|export|draft)/.test(p));
    expect(writes).toEqual([]);
    expect(authorize(auditor, "projects:write", { organisationId: ORG_A })).toEqual({ allowed: false, reason: "missing-permission" });
  });

  it("give no role a permission to read support case detail (only status exists)", () => {
    for (const role of roles) expect(roleMatrix[role].some((p) => p.startsWith("support-detail"))).toBe(false);
    expect(can("company_admin", "support-status:read")).toBe(true);
  });
});
