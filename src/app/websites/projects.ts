// The websites Daniel has built, shown on /websites. Each one links out to
// the live site. Media lives in public/media/websites: <key>.mp4 is a short
// silent scroll-through of the site (each with its own pace), <key>-icon is
// its favicon.

export type Project = {
  key: string;
  name: string;
  kind: string;
  blurb: string;
  host: string;
  url?: string; // not live yet = no link
  video: string;
  icon: string;
};

const M = "/media/websites";

export const PROJECTS: Project[] = [
  {
    key: "virgin",
    name: "Virgin Estate Agents",
    kind: "Real estate · Zimbabwe",
    blurb: "Property for sale and rent across Zimbabwe, with search by area and type and WhatsApp enquiries built in.",
    host: "virginestateagentsandpropertyconsultants.co.zw",
    url: "https://virginestateagentsandpropertyconsultants.co.zw/",
    video: `${M}/virgin.mp4`,
    icon: `${M}/virgin-icon.png`,
  },
  {
    key: "crosscoders",
    name: "CrossCoders",
    kind: "Nonprofit · Software",
    blurb: "A Christian software nonprofit that builds free apps and websites for churches.",
    host: "crosscoders.co.za",
    url: "https://www.crosscoders.co.za/",
    video: `${M}/crosscoders.mp4`,
    icon: `${M}/crosscoders-icon.png`,
  },
  {
    key: "endgame",
    name: "Endgame Strategy Lab",
    kind: "Strategy & marketing · Johannesburg",
    blurb: "A strategy and digital marketing consultancy helping brands across South Africa grow.",
    host: "endgamestrategylab.co.za",
    url: "https://endgamestrategylab.co.za/",
    video: `${M}/endgame.mp4`,
    icon: `${M}/endgame-icon.png`,
  },
  {
    key: "alltheglory",
    name: "All The Glory",
    kind: "Music & ministry",
    blurb: "A worship album, a free chronological Bible study and a members' area, all in one place.",
    host: "alltheglory.co.za",
    url: "https://www.alltheglory.co.za/",
    video: `${M}/alltheglory.mp4`,
    icon: `${M}/alltheglory-icon.png`,
  },
  {
    key: "manuchie",
    name: "Manuchie",
    kind: "Music producer · Harare",
    blurb: "An artist site for the producer and music director behind Zimpraise.",
    host: "manuchie",
    video: `${M}/manuchie.mp4`,
    icon: `${M}/manuchie-icon.svg`,
  },
];

const WA_TEXT = "Hi Daniel! I've just seen your websites and I'd love to chat about getting a website built.";

export const CONTACT = {
  email: "daniel@alltheglory.co.za",
  emailHref: `mailto:daniel@alltheglory.co.za?subject=${encodeURIComponent("Website enquiry")}`,
  whatsapp: "+27 84 665 1423",
  whatsappHref: `https://wa.me/27846651423?text=${encodeURIComponent(WA_TEXT)}`,
};
