import { sampleRoster } from "../../../src/platform/demo-data/roster";

/** The platform is mounted at /agency on All the Glory. */
export const at = (path: string) => (path === "/" ? "/agency" : `/agency${path}`);

const publicPaths = [
  "/",
  "/about",
  "/roster",
  ...sampleRoster.map((p) => `/roster/${p.slug}`),
  "/services",
  "/how-it-works",
  "/artist-business-suite",
  "/websites",
  "/opportunities",
  "/partners",
  "/partners/proposed-collaboration",
  "/clients",
  "/creatives",
  "/contact",
  "/apply",
  "/privacy",
  "/cookies",
  "/terms",
];

const company = ["overview", "pipeline", "clients", "talent", "projects", "contracts", "finance", "analytics", "partners", "admin"];
const artist = ["overview", "profile", "opportunities", "schedule", "projects", "rights", "earnings", "documents", "insights", "support"];
const client = ["overview", "brief", "quote", "payments", "review", "files", "messages"];
const partner = ["overview", "referrals", "programmes", "support", "impact", "consent"];

const demoPaths = [
  "/demo",
  ...company.map((s) => `/demo/company/${s}`),
  ...["msasa-room", "kopje-sound"].flatMap((t) => artist.map((s) => `/demo/artist/${t}/${s}`)),
  ...client.map((s) => `/demo/client/${s}`),
  ...partner.map((s) => `/demo/partner/${s}`),
];

export const publicRoutes = publicPaths.map(at);
export const demoRoutes = demoPaths.map(at);

export const widths = [390, 768, 1024, 1440] as const;
