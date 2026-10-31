// Roles, permissions and the authorisation decision used by every server
// handler (MASTER_PLAN §8–§9). The browser never makes these decisions; the
// demo dashboards only *display* what a role would see.

export const roles = [
  "platform_owner",
  "company_admin",
  "operations_manager",
  "finance_operator",
  "talent_manager",
  "artist",
  "client",
  "partner_operator",
  "auditor",
] as const;
export type Role = (typeof roles)[number];

export const roleLabels: Record<Role, string> = {
  platform_owner: "Platform owner",
  company_admin: "Company administrator",
  operations_manager: "Operations / project manager",
  finance_operator: "Finance operator",
  talent_manager: "Roster / talent manager",
  artist: "Artist / creative",
  client: "Client",
  partner_operator: "Partner operator",
  auditor: "Read-only auditor",
};

export const permissions = [
  "leads:read", "leads:write",
  "clients:read", "clients:write",
  "marketing:read", "marketing:export",
  "talent:read", "talent:verify",
  "opportunities:read", "opportunities:write", "opportunities:apply",
  "projects:read", "projects:write",
  "deliverables:submit", "deliverables:approve",
  "contracts:read", "contracts:write", "contracts:sign",
  "finance:read", "finance:write", "invoices:issue", "invoices:read-own", "payouts:approve",
  "payout-statements:read-own", "payment-requests:draft",
  "identity:read",
  "documents:read",
  "analytics:read",
  "partner-referrals:read", "partner-impact:read",
  "support-status:read", "support-status:write",
  "profile:write-own", "brief:write-own",
  "staff:manage", "audit:read", "settings:write",
] as const;
export type Permission = (typeof permissions)[number];

const companyOperations: Permission[] = [
  "leads:read", "leads:write", "clients:read", "clients:write", "talent:read",
  "opportunities:read", "opportunities:write", "projects:read", "projects:write",
  "deliverables:approve", "contracts:read", "contracts:write", "documents:read",
  "analytics:read", "support-status:read", "marketing:read",
];

const financeOnly: Permission[] = ["finance:read", "finance:write", "invoices:issue", "payouts:approve", "identity:read"];

export const roleMatrix: Record<Role, readonly Permission[]> = {
  platform_owner: [...companyOperations, ...financeOnly, "marketing:export", "talent:verify", "partner-referrals:read", "partner-impact:read", "staff:manage", "audit:read", "settings:write"],
  company_admin: [...companyOperations, "finance:read", "marketing:export", "talent:verify", "partner-referrals:read", "partner-impact:read", "staff:manage", "audit:read", "settings:write"],
  operations_manager: companyOperations,
  finance_operator: [...financeOnly, "clients:read", "projects:read", "contracts:read", "documents:read"],
  talent_manager: ["talent:read", "talent:verify", "opportunities:read", "opportunities:write", "projects:read", "documents:read", "analytics:read"],
  artist: ["profile:write-own", "opportunities:read", "opportunities:apply", "projects:read", "deliverables:submit", "contracts:read", "contracts:sign", "payout-statements:read-own", "payment-requests:draft", "documents:read", "analytics:read", "support-status:read"],
  client: ["brief:write-own", "projects:read", "deliverables:approve", "contracts:read", "contracts:sign", "invoices:read-own", "documents:read"],
  partner_operator: ["partner-referrals:read", "partner-impact:read", "support-status:read", "support-status:write", "opportunities:read"],
  auditor: ["leads:read", "clients:read", "talent:read", "projects:read", "contracts:read", "finance:read", "documents:read", "analytics:read", "audit:read"],
};

/**
 * Tenants. An operator is a company running projects (this company today,
 * other verified organisations in Phase 4). Artists and clients are members of
 * an operator tenant with ownership-scoped roles; each artist workspace is a
 * themed, scoped view of that tenant rather than a separate deployment.
 * Partners are separate tenants that see records only through consent.
 */
export type OrganisationKind = "operator" | "partner";

export interface Membership {
  organisationId: string;
  organisationKind: OrganisationKind;
  role: Role;
  /** Set for artist members: the creative record they act as. */
  artistId?: string;
  /** Set for client members: the client record they act for. */
  clientId?: string;
}

export interface Actor {
  userId: string;
  memberships: Membership[];
  /** Step-up authentication within the session (MFA). */
  mfaVerified?: boolean;
}

export interface Resource {
  /** Owning tenant. Every tenant-owned record carries one. */
  organisationId: string;
  /** Creatives attached to the record (project participants, statement owner). */
  artistIds?: string[];
  /** Client the record belongs to. */
  clientId?: string;
  /** Partner organisations with an active consent grant for this record. */
  consentedPartnerIds?: string[];
}

export type Decision =
  | { allowed: true }
  | { allowed: false; reason: "tenant-boundary" | "missing-permission" | "not-owner" | "no-consent" | "mfa-required" };

const mfaRequired: ReadonlySet<Permission> = new Set(["finance:write", "invoices:issue", "payouts:approve", "identity:read", "staff:manage", "settings:write", "marketing:export"]);

/**
 * Decide whether an actor may perform `permission` on `resource`.
 * Order matters: tenant boundary → role permission → ownership scope → MFA.
 */
export function authorize(actor: Actor, permission: Permission, resource: Resource): Decision {
  // Partners never belong to the owning tenant; they reach records only through explicit consent.
  const partnerMemberships = actor.memberships.filter((m) => m.organisationKind === "partner" && m.role === "partner_operator");
  const membership = actor.memberships.find((m) => m.organisationId === resource.organisationId);

  if (!membership) {
    const partner = partnerMemberships.find((m) => roleMatrix[m.role].includes(permission));
    if (partner) {
      return resource.consentedPartnerIds?.includes(partner.organisationId) ? { allowed: true } : { allowed: false, reason: "no-consent" };
    }
    return { allowed: false, reason: "tenant-boundary" };
  }

  if (!roleMatrix[membership.role].includes(permission)) return { allowed: false, reason: "missing-permission" };

  if (membership.role === "artist" && !(membership.artistId && resource.artistIds?.includes(membership.artistId))) {
    return { allowed: false, reason: "not-owner" };
  }
  if (membership.role === "client" && !(membership.clientId && resource.clientId === membership.clientId)) {
    return { allowed: false, reason: "not-owner" };
  }

  if (mfaRequired.has(permission) && !actor.mfaVerified) return { allowed: false, reason: "mfa-required" };

  return { allowed: true };
}

export function can(role: Role, permission: Permission): boolean {
  return roleMatrix[role].includes(permission);
}
