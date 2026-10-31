export interface NavLink {
  href: string;
  label: string;
}

export const primaryNav: NavLink[] = [
  { href: "/roster", label: "Roster" },
  { href: "/services", label: "Services" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/artist-business-suite", label: "Artist Suite" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/about", label: "About" },
];

export const audienceNav: NavLink[] = [
  { href: "/clients", label: "For clients" },
  { href: "/creatives", label: "For creatives" },
];

export const footerNav: { heading: string; links: NavLink[] }[] = [
  {
    heading: "Work with us",
    links: [
      { href: "/services", label: "Services" },
      { href: "/how-it-works", label: "How projects work" },
      { href: "/clients", label: "For clients" },
      { href: "/contact", label: "Start a project brief" },
    ],
  },
  {
    heading: "Creatives",
    links: [
      { href: "/roster", label: "Roster" },
      { href: "/creatives", label: "For creatives" },
      { href: "/artist-business-suite", label: "Artist Business Suite" },
      { href: "/opportunities", label: "Opportunity network" },
      { href: "/apply", label: "Apply to the roster" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About and mission" },
      { href: "/websites", label: "Websites and launches" },
      { href: "/partners", label: "Partner programme" },
      { href: "/demo", label: "Platform demonstration" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/cookies", label: "Cookies" },
      { href: "/terms", label: "Terms" },
    ],
  },
];
