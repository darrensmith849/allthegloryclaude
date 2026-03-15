/** Hero-level album data (used by modo-hero + album page) */
export const album = {
  title: "Ⅎɹoɯ ᗡɐɹʞuǝss †o 𝕃Ɨ𝕘𝓱𝐓",
  subtitle: "Ⅎɹoɯ ᗡɐɹʞuǝss †o 𝕃Ɨ𝕘𝓱𝐓",
  coverImage: "/media/ocean.jpg",
  ctas: [
    { label: "Listen", href: "/album/from-darkness-to-light" },
    { label: "Watch", href: "/videos" },
  ],
  tracks: [
    { title: "John 11 vs 35", previewSrc: "/audio/previews/01-john-11-vs-35.mp3" },
    { title: "John 19 vs 30", previewSrc: "/audio/previews/02-john-19-vs-30.mp3" },
    { title: "Matthew 14 vs 31", previewSrc: "/audio/previews/03-matthew-14-vs-31.mp3" },
    { title: "John 3 vs 16", previewSrc: "/audio/previews/04-john-3-vs-16.mp3" },
    { title: "Luke 15 vs 20", previewSrc: "/audio/previews/05-luke-15-vs-20.mp3" },
    { title: "Proverbs 3 vs 5", previewSrc: "/audio/previews/06-proverbs-3-vs-5.mp3" },
    { title: "2 Corinthians 5 vs 21", previewSrc: "/audio/previews/07-2-corinthians-5-vs-21.mp3" },
  ],
};

export type AlbumTrack = {
  number: number;
  title: string;
  previewSrc?: string;
};

/** Full album config (used by album + music pages) */
export const albumConfig = {
  title: "Ⅎɹoɯ ᗡɐɹʞuǝss †o 𝕃Ɨ𝕘𝓱𝐓",
  subtitle: "Ⅎɹoɯ ᗡɐɹʞuǝss †o 𝕃Ɨ𝕘𝓱𝐓",
  year: 2025,
  cover: "/media/ocean.jpg",
  streamingLinks: {
    spotify: "#",
    appleMusic: "#",
    youtube: "#",
  },
  tracklist: [
    { number: 1, title: "John 11 vs 35", previewSrc: "/audio/previews/01-john-11-vs-35.mp3" },
    { number: 2, title: "John 19 vs 30", previewSrc: "/audio/previews/02-john-19-vs-30.mp3" },
    { number: 3, title: "Matthew 14 vs 31", previewSrc: "/audio/previews/03-matthew-14-vs-31.mp3" },
    { number: 4, title: "John 3 vs 16", previewSrc: "/audio/previews/04-john-3-vs-16.mp3" },
    { number: 5, title: "Luke 15 vs 20", previewSrc: "/audio/previews/05-luke-15-vs-20.mp3" },
    { number: 6, title: "Proverbs 3 vs 5", previewSrc: "/audio/previews/06-proverbs-3-vs-5.mp3" },
    { number: 7, title: "2 Corinthians 5 vs 21", previewSrc: "/audio/previews/07-2-corinthians-5-vs-21.mp3" },
  ] as AlbumTrack[],
};
