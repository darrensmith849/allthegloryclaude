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
    { title: "John 11 vs 35", verse: "\u201CJesus wept.\u201D", verseUrl: "https://www.biblegateway.com/passage/?search=John+11%3A35&version=ESV", previewSrc: "/audio/previews/01-john-11-vs-35.mp3" },
    { title: "John 19 vs 30", verse: "\u201CIt is finished.\u201D", verseUrl: "https://www.biblegateway.com/passage/?search=John+19%3A30&version=ESV", previewSrc: "/audio/previews/02-john-19-vs-30.mp3" },
    { title: "Matthew 14 vs 31", verse: "\u201CO you of little faith, why did you doubt?\u201D", verseUrl: "https://www.biblegateway.com/passage/?search=Matthew+14%3A31&version=ESV", previewSrc: "/audio/previews/03-matthew-14-vs-31.mp3" },
    { title: "John 3 vs 16", verse: "\u201CFor God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.\u201D", verseUrl: "https://www.biblegateway.com/passage/?search=John+3%3A16&version=ESV", previewSrc: "/audio/previews/04-john-3-vs-16.mp3" },
    { title: "Luke 15 vs 20", verse: "\u201CHis father saw him and felt compassion, and ran and embraced him and kissed him.\u201D", verseUrl: "https://www.biblegateway.com/passage/?search=Luke+15%3A20&version=ESV", previewSrc: "/audio/previews/05-luke-15-vs-20.mp3" },
    { title: "Proverbs 3 vs 5", verse: "\u201CTrust in the Lord with all your heart, and do not lean on your own understanding.\u201D", verseUrl: "https://www.biblegateway.com/passage/?search=Proverbs+3%3A5&version=ESV", previewSrc: "/audio/previews/06-proverbs-3-vs-5.mp3" },
    { title: "2 Corinthians 5 vs 21", verse: "\u201CFor our sake he made him to be sin who knew no sin, so that in him we might become the righteousness of God.\u201D", verseUrl: "https://www.biblegateway.com/passage/?search=2+Corinthians+5%3A21&version=ESV", previewSrc: "/audio/previews/07-2-corinthians-5-vs-21.mp3" },
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
