export const site = {
  name: "All The Glory",
  // The one address: everything shared uses it (www redirects here - custom-worker.ts).
  url: "https://alltheglory.co.za",
  description:
    "Worship music woven through Scripture - the album From Darkness To Light - and The Study, a free Bible study reading the Bible in the order it happened.",
  socials: {
    instagram: "https://www.instagram.com/allthe_glory",
    youtube: "https://www.youtube.com/@Allthe_glory",
    spotify: "https://open.spotify.com/artist/31qIQqqntN5cVt0NGK8uUa",
    appleMusic: "https://music.apple.com/za/album/from-darkness-to-light/6781827636",
    youtubeMusic: "", // TODO: paste the YouTube Music artist URL when live (CD Baby distribution)
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "Music", href: "/album/from-darkness-to-light" },
    { label: "The Study", href: "/the-study" },
    { label: "Videos", href: "/videos" },
    { label: "Commissions", href: "/commissions" },
    { label: "Testimony", href: "/testimony" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Give", href: "/give" },
  ],
};
