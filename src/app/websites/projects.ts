// The websites Daniel has built, shown on /websites. Each links out to the
// live site. `shot` is one screenshot of the site's front page, `logo` its
// own icon (favicon), `color` its brand colour.

export type Project = {
  key: string;
  name: string;
  kind: string;
  blurb: string;
  host: string;
  url?: string; // not live yet = no link
  shot: string;
  logo: string;
  color: string;
};

const M = "/media/websites";

export const PROJECTS: Project[] = [
  {
    key: "alltheglory",
    shot: `${M}/alltheglory-shot.webp`,
    name: "All The Glory",
    kind: "Music & ministry",
    blurb: "My own home for a worship album and a free chronological Bible study, with a music player and a members' area.",
    host: "alltheglory.co.za",
    url: "https://www.alltheglory.co.za/",
    logo: "/media/logo-dove-440.webp",
    color: "#d8b25a",
  },
  {
    key: "manuchie",
    shot: `${M}/manuchie-shot.webp`,
    name: "Manuchie",
    kind: "Music producer · Harare",
    blurb: "An artist site for the producer and music director behind Zimpraise.",
    host: "manuchie",
    logo: `${M}/manuchie-icon.svg`,
    color: "#d9682c",
  },
  {
    key: "virgin",
    shot: `${M}/virgin-shot.webp`,
    name: "Virgin Estate Agents",
    kind: "Real estate · Zimbabwe",
    blurb: "A property website with searchable listings across Zimbabwe, agent profiles and instant WhatsApp enquiries.",
    host: "virginestateagentsandpropertyconsultants.co.zw",
    url: "https://virginestateagentsandpropertyconsultants.co.zw/",
    logo: `${M}/virgin-icon.png`,
    color: "#3f8a68",
  },
  {
    key: "endgame",
    shot: `${M}/endgame-shot.webp`,
    name: "Endgame Strategy Lab",
    kind: "Strategy & marketing · Johannesburg",
    blurb: "A bold, modern site for a strategy and digital marketing consultancy, with its services, a blog and an easy way to get in touch.",
    host: "endgamestrategylab.co.za",
    url: "https://endgamestrategylab.co.za/",
    logo: `${M}/endgame-icon.png`,
    color: "#3fb8cc",
  },
  {
    key: "crosscoders",
    shot: `${M}/crosscoders-shot.webp`,
    name: "CrossCoders",
    kind: "Christian nonprofit",
    blurb: "A warm, welcoming site for a nonprofit that builds free software for churches, with ways to apply and to give.",
    host: "crosscoders.co.za",
    url: "https://www.crosscoders.co.za/",
    logo: `${M}/crosscoders-icon.svg`,
    color: "#2fbf63",
  },
];

const WA_TEXT = "Hi Daniel! I've just seen your websites and I'd love to chat about getting a website built.";

export const CONTACT = {
  email: "daniel@alltheglory.co.za",
  emailHref: `mailto:daniel@alltheglory.co.za?subject=${encodeURIComponent("Website enquiry")}`,
  whatsapp: "+27 84 665 1423",
  whatsappHref: `https://wa.me/27846651423?text=${encodeURIComponent(WA_TEXT)}`,
  instagram: "@allthe_glory",
  instagramHref: "https://www.instagram.com/allthe_glory",
  linkedin: "Daniel Jenkins",
  linkedinHref: "https://www.linkedin.com/in/danieljenkinsofficial/",
};
