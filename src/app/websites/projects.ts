// The websites Daniel has built, listed on /websites. Each links out to the
// live site; `icon` is the site's own favicon (public/media/websites).
// `color` / `ink` are the site's brand colour and the text colour that
// sits on it - a row floods with them when you point at it.

export type Project = {
  key: string;
  name: string;
  tags: string[];
  host: string;
  url?: string; // not live yet = no link
  icon: string;
  color: string;
  ink: string;
};

const M = "/media/websites";

export const PROJECTS: Project[] = [
  {
    key: "virgin",
    name: "Virgin Estate Agents",
    tags: ["Real estate", "Zimbabwe"],
    host: "virginestateagentsandpropertyconsultants.co.zw",
    url: "https://virginestateagentsandpropertyconsultants.co.zw/",
    icon: `${M}/virgin-icon.png`,
    color: "#1f4434",
    ink: "#f4f1ea",
  },
  {
    key: "endgame",
    name: "Endgame Strategy Lab",
    tags: ["Marketing", "Johannesburg"],
    host: "endgamestrategylab.co.za",
    url: "https://endgamestrategylab.co.za/",
    icon: `${M}/endgame-icon.png`,
    color: "#7de6f5",
    ink: "#03161b",
  },
  {
    key: "crosscoders",
    name: "CrossCoders",
    tags: ["Nonprofit", "Software"],
    host: "crosscoders.co.za",
    url: "https://www.crosscoders.co.za/",
    icon: `${M}/crosscoders-icon.png`,
    color: "#13b24a",
    ink: "#ffffff",
  },
  {
    key: "alltheglory",
    name: "All The Glory",
    tags: ["Music", "Ministry"],
    host: "alltheglory.co.za",
    url: "https://www.alltheglory.co.za/",
    icon: `${M}/alltheglory-icon.png`,
    color: "#d8b25a",
    ink: "#141008",
  },
  {
    key: "manuchie",
    name: "Manuchie",
    tags: ["Music producer", "Harare"],
    host: "manuchie",
    icon: `${M}/manuchie-icon.svg`,
    color: "#ce5018",
    ink: "#ffffff",
  },
];

const WA_TEXT = "Hi Daniel! I've just seen your websites and I'd love to chat about getting a website built.";

export const CONTACT = {
  email: "daniel@alltheglory.co.za",
  emailHref: `mailto:daniel@alltheglory.co.za?subject=${encodeURIComponent("Website enquiry")}`,
  whatsapp: "+27 84 665 1423",
  whatsappHref: `https://wa.me/27846651423?text=${encodeURIComponent(WA_TEXT)}`,
};
