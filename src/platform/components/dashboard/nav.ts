import type { IconName } from "@/platform/components/ui/Icon";

// Section definitions for each demonstration. Pages derive their static
// params from these lists, so a section exists only if it is listed here.

export interface SectionDef {
  slug: string;
  label: string;
  icon: IconName;
  title: string;
  description: string;
}

export const companySections = [
  { slug: "overview", label: "Overview", icon: "home", title: "Company overview", description: "The operating picture across enquiries, projects, contracts, money and the roster." },
  { slug: "pipeline", label: "Leads and opportunities", icon: "inbox", title: "Leads, enquiries and opportunities", description: "Every enquiry moves through explicit lifecycle states, and every opportunity is matched against verified profiles." },
  { slug: "clients", label: "Clients and consent", icon: "people", title: "Clients, contacts and consent", description: "Deduplicated contacts with a recorded lawful purpose. Marketing consent is separate, explicit and withdrawable." },
  { slug: "talent", label: "Talent and verification", icon: "shield", title: "Talent directory and verification", description: "Nobody is listed publicly until identity, portfolio, rights and engagement terms are verified." },
  { slug: "projects", label: "Projects and files", icon: "briefcase", title: "Projects, milestones and deliverables", description: "Milestone-based delivery with private, versioned, virus-scanned files and explicit approvals." },
  { slug: "contracts", label: "Contracts and splits", icon: "document", title: "Contracts, signatures and split sheets", description: "Every agreement and split sheet is versioned, and nothing starts before the right signatures exist." },
  { slug: "finance", label: "Finance", icon: "wallet", title: "Quotes, invoices, payments and payouts", description: "Money held as integer minor units, commission configured per contract, and payout statements calculated by the settlement engine." },
  { slug: "analytics", label: "Analytics", icon: "chart", title: "Website and campaign analytics", description: "First-party, cookie-free measurement. Staff and admin sessions are excluded from public traffic." },
  { slug: "partners", label: "Partners and impact", icon: "heart", title: "Partner referrals and impact", description: "Referral outcomes and aggregated impact, shared only with consent." },
  { slug: "admin", label: "Staff, audit, settings", icon: "settings", title: "Staff permissions, audit log and settings", description: "Least-privilege roles enforced on the server, an immutable audit trail, and the approvals register." },
] as const satisfies readonly SectionDef[];

export const artistSections = [
  { slug: "overview", label: "Overview", icon: "home", title: "Workspace overview", description: "Today's priorities: what needs signing, delivering and getting paid." },
  { slug: "profile", label: "Profile and media", icon: "mic", title: "Profile, portfolio and credits", description: "What clients see, what stays private, and which credits are still being verified." },
  { slug: "opportunities", label: "Opportunities", icon: "compass", title: "Opportunities, applications and enquiries", description: "Matched work, the status of every application, and enquiries routed through the company." },
  { slug: "schedule", label: "Bookings", icon: "calendar", title: "Bookings and availability", description: "Availability you control. Holds and bookings come from contracted work only." },
  { slug: "projects", label: "Projects", icon: "briefcase", title: "Projects, tasks and submissions", description: "Briefs, deadlines and the approval state of every file you deliver." },
  { slug: "rights", label: "Contracts and splits", icon: "document", title: "Contracts and split sheets", description: "Every agreement you are party to, and split sheets validated to exactly 100%." },
  { slug: "earnings", label: "Earnings", icon: "wallet", title: "Earnings, statements and payouts", description: "Line-by-line statements: what the client paid, approved costs, commission and your share." },
  { slug: "documents", label: "Documents", icon: "lock", title: "Documents and compliance", description: "Status only. Identity, tax and banking documents are held privately and never displayed here." },
  { slug: "insights", label: "Insights", icon: "chart", title: "Website and campaign insights", description: "First-party analytics for your profile, website and release pages." },
  { slug: "support", label: "Training and support", icon: "heart", title: "Training and partner support", description: "Your learning pathway and the status of any support referral — details stay with the partner." },
] as const satisfies readonly SectionDef[];

export const clientSections = [
  { slug: "overview", label: "Overview", icon: "home", title: "Project overview", description: "Where your project stands, what is due and what needs your decision." },
  { slug: "brief", label: "Brief", icon: "inbox", title: "Your brief", description: "The brief as agreed, with every refinement versioned." },
  { slug: "quote", label: "Quote and agreements", icon: "document", title: "Quote, scope and agreements", description: "A fixed quote for a written scope. Changes happen only through signed change requests." },
  { slug: "payments", label: "Payments and invoices", icon: "wallet", title: "Payments, invoices and receipts", description: "Deposit and milestone payments to the company, each with an invoice and a receipt." },
  { slug: "review", label: "Review and approvals", icon: "eye", title: "Drafts, revisions and approvals", description: "Review drafts, use your contracted revision rounds, and approve each milestone." },
  { slug: "files", label: "Files", icon: "upload", title: "Reference uploads and final files", description: "Private by default, delivered through signed links after scanning." },
  { slug: "messages", label: "Messages", icon: "message", title: "Project messages", description: "One thread with your project lead, kept with the project record." },
] as const satisfies readonly SectionDef[];

export const partnerSections = [
  { slug: "overview", label: "Overview", icon: "home", title: "Partner overview", description: "Referred creatives, programme activity and support status — nothing beyond what consent allows." },
  { slug: "referrals", label: "Referrals", icon: "people", title: "Referred creatives", description: "Names appear only where the creative has granted consent." },
  { slug: "programmes", label: "Programmes", icon: "layers", title: "Programmes, benefits and events", description: "Membership benefits, training and events available to referred creatives." },
  { slug: "support", label: "Support status", icon: "shield", title: "Support workflow status", description: "Authorised workflow status only. Case details are held by the partner organisation, not on this platform." },
  { slug: "impact", label: "Impact", icon: "chart", title: "Aggregated impact", description: "Outcomes for consenting creatives, aggregated, with small groups suppressed." },
  { slug: "consent", label: "Consent and documents", icon: "lock", title: "Consent grants and document history", description: "Who has shared what, until when — and the agreements behind the collaboration." },
] as const satisfies readonly SectionDef[];

export function findSection<T extends readonly SectionDef[]>(list: T, slug: string): T[number] | undefined {
  return list.find((s) => s.slug === slug);
}
