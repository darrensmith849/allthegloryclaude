import type { IconName } from "@/platform/components/ui/Icon";

// Public copy for the five connected businesses (MASTER_PLAN §3), the project
// process and the contracting/money flow (§5). No prices or thresholds: those
// stay unpublished until approved (src/config/approvals.ts).

export interface Business {
  key: string;
  index: string;
  title: string;
  summary: string;
  items: string[];
  href: string;
  cta: string;
  icon: IconName;
}

export const businesses: Business[] = [
  {
    key: "production",
    index: "01",
    title: "Production house",
    summary: "Records made to a release standard — written, arranged, recorded, mixed and mastered by people who know where the music comes from.",
    items: ["Music production and arrangement", "Songwriting and composition", "Vocal production", "Recording, mixing and mastering", "Remote session recording", "Musical direction", "Release-ready deliverables and stems"],
    href: "/services#production",
    cta: "Production services",
    icon: "mic",
  },
  {
    key: "network",
    index: "02",
    title: "Talent and session network",
    summary: "Verified producers, engineers, writers, musicians and vocalists — discoverable, bookable and able to deliver remotely to anywhere in the world.",
    items: ["Searchable verified profiles", "Audio and video samples", "Availability, turnaround and pricing bands", "Remote international delivery", "Quality assurance before client delivery"],
    href: "/roster",
    cta: "Explore the roster",
    icon: "people",
  },
  {
    key: "agency",
    index: "03",
    title: "Agency and managed projects",
    summary: "One accountable team between client and creatives: brief, scope, contract, deliver and pay — with every split and statement on the record.",
    items: ["Brief intake and creative matching", "Quotes and project scopes", "Contracts and split sheets", "Milestones, revisions and approvals", "Client invoicing and transparent payouts", "Change requests and dispute handling"],
    href: "/how-it-works",
    cta: "How projects work",
    icon: "briefcase",
  },
  {
    key: "digital",
    index: "04",
    title: "Artist digital studio",
    summary: "Premium artist websites, press kits and release pages, with first-party analytics that show what is actually working.",
    items: ["Premium artist websites", "Electronic press kits", "Release landing pages", "Branding and digital assets", "Analytics and campaign tracking", "Hosting and ongoing support"],
    href: "/websites",
    cta: "Websites and launches",
    icon: "globe",
  },
  {
    key: "infrastructure",
    index: "05",
    title: "Artist business infrastructure",
    summary: "The professional back office most artists never get: contracts, invoices, earnings, rights records and readiness for funding — in one workspace.",
    items: ["Professional profiles and portfolios", "Opportunities and bookings", "Contracts, invoices and payout records", "Rights and split-sheet records", "CRM and contact history", "Training, funding and support referrals"],
    href: "/artist-business-suite",
    cta: "Artist Business Suite",
    icon: "layers",
  },
];

export const projectSteps = [
  { title: "Brief", body: "Tell us what you are making, for whom, by when and within what budget range. We ask the questions that prevent surprises later." },
  { title: "Match", body: "We propose creatives from the network for the brief, with a written scope and a fixed quote once the work is defined." },
  { title: "Create", body: "Work happens in milestones, remote-first, with drafts, contracted revision rounds and every contributor credited on a split sheet." },
  { title: "Deliver", body: "We quality-check, you approve, final files and stems are delivered — and every creative receives a transparent payout statement." },
];

export const moneyFlow = [
  { title: "Client submits a brief", detail: "Through the website or the client portal." },
  { title: "We scope and price the work", detail: "A written scope and a fixed quote, revised only by agreed change requests." },
  { title: "We contract with the client", detail: "One agreement with one accountable company." },
  { title: "We assign approved creatives", detail: "Each creative accepts their part, fee and split before work starts." },
  { title: "Client pays a deposit and milestones", detail: "Payments go to the company, never informally to individuals." },
  { title: "Creatives deliver through the platform", detail: "Drafts, stems and files are versioned and private by default." },
  { title: "We quality-check and obtain approvals", detail: "Nothing reaches the client until it meets the brief." },
  { title: "Commission and approved costs are recorded", detail: "Commission is set per contract and visible to the creative." },
  { title: "Creatives receive payout statements", detail: "Line by line: what the client paid, costs, commission and their share." },
  { title: "Creatives are paid on schedule", detail: "On the contracted schedule, with every payment on the record." },
];

export const packages = [
  {
    name: "Single",
    for: "Artists releasing one record",
    includes: ["Production or co-production", "Session players as required", "Mix and master", "Split sheet for every contributor", "Release-ready masters and stems"],
  },
  {
    name: "EP or album",
    for: "Artists and labels planning a body of work",
    includes: ["Pre-production and song selection", "Producer and engineer team", "Milestone schedule and approvals", "Consistent mix and master across the project", "Optional release campaign page"],
  },
  {
    name: "Session booking",
    for: "Producers who need a specific player or voice",
    includes: ["Matched session creative", "Remote recording to your session tempo and key", "Agreed number of takes and comps", "Clean, labelled stems", "Fee and rights agreed in writing"],
  },
  {
    name: "Managed project",
    for: "Agencies, brands, film, TV and games",
    includes: ["Single point of contact", "Creative team assembled to brief", "Contract, licensing and split administration", "Milestone invoicing", "Delivery to your technical specification"],
  },
  {
    name: "Digital launch",
    for: "Artists and releases that need a home online",
    includes: ["Artist website or press kit", "Release landing page", "Campaign tracking links", "First-party analytics", "Hosting and support options"],
  },
];

export const principles = [
  { title: "Widen access", body: "The network exists to make African talent easier to find and hire — not to hoard relationships." },
  { title: "Pay transparently", body: "Every creative sees what the client paid, the costs, the commission and their share." },
  { title: "Protect rights", body: "Split sheets and contracts are agreed before work starts, not argued about after release." },
  { title: "Publish only what is true", body: "No borrowed credits, implied endorsements or invented partnerships. Ever." },
];
