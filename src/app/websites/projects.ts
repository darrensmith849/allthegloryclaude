// The websites Daniel has built, shown on /websites. Media lives in
// public/media/websites: <key>.mp4 is a short scroll-through recording of
// the live site, <key>-poster.webp its first frame, <key>-phone.webp the
// site's first screen on a phone, <key>-icon.png its favicon.
//
// `tint` is a bright version of the site's brand colour - the page glow and
// accents shift to it while that site is on screen. `palette` holds the
// site's real colours. `button` copies the look of the site's own main
// button, so each "Visit" link echoes the site it opens.

export type Project = {
  key: string;
  name: string;
  kind: string;
  blurb: string;
  host: string;
  url?: string; // not live yet = no link
  video?: string;
  poster: string;
  phone: string;
  icon: string;
  tint: string;
  palette: string[];
  button: { bg: string; fg: string; radius: string; upper?: boolean };
};

const M = "/media/websites";

export const PROJECTS: Project[] = [
  {
    key: "virgin",
    name: "Virgin Estate Agents",
    kind: "Real estate · Zimbabwe",
    blurb:
      "A property site for houses, apartments, stands and commercial property across Zimbabwe - search by area and type, with WhatsApp enquiries a tap away.",
    host: "virginestateagentsandpropertyconsultants.co.zw",
    url: "https://virginestateagentsandpropertyconsultants.co.zw/",
    video: `${M}/virgin.mp4`,
    poster: `${M}/virgin-poster.webp`,
    phone: `${M}/virgin-phone.webp`,
    icon: `${M}/virgin-icon.png`,
    tint: "#6fae8f",
    palette: ["#101815", "#1f4434", "#f4f1ea", "#ffffff"],
    button: { bg: "#1f4434", fg: "#ffffff", radius: "8px" },
  },
  {
    key: "crosscoders",
    name: "CrossCoders",
    kind: "Christian software nonprofit",
    blurb:
      "A warm, light site for a nonprofit that gives free software to churches - live product previews, a build application and a way for supporters to fuel the work.",
    host: "crosscoders.co.za",
    url: "https://www.crosscoders.co.za/",
    video: `${M}/crosscoders.mp4`,
    poster: `${M}/crosscoders-poster.webp`,
    phone: `${M}/crosscoders-phone.webp`,
    icon: `${M}/crosscoders-icon.png`,
    tint: "#3fd174",
    palette: ["#f7f2e8", "#1a1612", "#13b24a", "#c9a961"],
    button: { bg: "#13b24a", fg: "#ffffff", radius: "999px" },
  },
  {
    key: "endgame",
    name: "Endgame Strategy Lab",
    kind: "Strategy & marketing · Johannesburg",
    blurb:
      "A bold, neon-lit site for a strategy and digital marketing consultancy - services, a blog and a clear call to talk at every turn.",
    host: "endgamestrategylab.co.za",
    url: "https://endgamestrategylab.co.za/",
    video: `${M}/endgame.mp4`,
    poster: `${M}/endgame-poster.webp`,
    phone: `${M}/endgame-phone.webp`,
    icon: `${M}/endgame-icon.png`,
    tint: "#7de6f5",
    palette: ["#000000", "#032c3c", "#7de6f5", "#ffffff"],
    button: { bg: "#7de6f5", fg: "#04161b", radius: "0px", upper: true },
  },
  {
    key: "alltheglory",
    name: "All The Glory",
    kind: "Music & ministry",
    blurb:
      "Home of a worship album and a free chronological Bible study - with its own music player, a members' area and a private dashboard behind it all.",
    host: "alltheglory.co.za",
    url: "https://www.alltheglory.co.za/",
    video: `${M}/alltheglory.mp4`,
    poster: `${M}/alltheglory-poster.webp`,
    phone: `${M}/alltheglory-phone.webp`,
    icon: `${M}/alltheglory-icon.png`,
    tint: "#d8b25a",
    palette: ["#09080e", "#d8b25a", "#f4f0e8", "#8e857c"],
    button: { bg: "#d8b25a", fg: "#141008", radius: "10px", upper: true },
  },
  {
    key: "manuchie",
    name: "Manuchie",
    kind: "Producer & music director · Harare",
    blurb:
      "A dark, cinematic artist site for the producer and music director behind Zimpraise - his story, his sound and studio bookings.",
    host: "manuchie",
    poster: `${M}/manuchie-poster.webp`,
    phone: `${M}/manuchie-phone.webp`,
    icon: `${M}/manuchie-icon.svg`,
    tint: "#e0702f",
    palette: ["#0a0a0b", "#ce5018", "#e3ae54", "#f3f3f1"],
    button: { bg: "#f3f3f1", fg: "#0a0a0b", radius: "999px" },
  },
];

const WA_TEXT = "Hi Daniel! I've just seen your websites and I'd love to chat about getting a website built.";

export const CONTACT = {
  email: "daniel@alltheglory.co.za",
  emailHref: `mailto:daniel@alltheglory.co.za?subject=${encodeURIComponent("Website enquiry")}`,
  whatsapp: "+27 84 665 1423",
  whatsappHref: `https://wa.me/27846651423?text=${encodeURIComponent(WA_TEXT)}`,
};
