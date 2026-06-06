/** Album data - single source of truth for the album page, the
 *  homepage hero, and the JSON-LD structured data in the layout. */

/** Worship artist name - used in the download zip filename so the
 *  listener sees "All The Glory - From Darkness To Light.zip" in
 *  their downloads folder. */
export const ARTIST_NAME = "All The Glory";

export const album = {
  /** Readable name (used by SEO / structured data). */
  name: "From Darkness To Light",
  /** Stylized display title used in the visual hero. */
  title: "Ⅎɹoɯ ᗡɐɹʞuǝss †o 𝕃Ɨ𝕘𝓱𝐓",
  subtitle: "All The Glory",
  coverImage: "/media/ocean.jpg",
  releaseYear: 2026,
  path: "/album/from-darkness-to-light",

  /** Pre-built zip with all 7 full songs already named
   *  "NN - All The Glory - <track>.mp3" inside it, so they extract
   *  in album order in any music app or file browser. */
  downloadZipSrc: "/downloads/from-darkness-to-light.zip",
  /** Filename the browser shows when the user downloads the zip. */
  downloadZipFilename: "All The Glory - From Darkness To Light.zip",

  /**
   * Tracks. Each track carries:
   *  - title         - display title (the verse reference)
   *  - verse         - the headline / hover quote (short, iconic)
   *  - ref           - citation shown in the verse modal eyebrow
   *  - fullVerse     - the full ESV passage shown in the modal
   *  - reflection    - short editorial commentary on the verse, shown
   *                    in the modal under the scripture. Written as
   *                    scriptural reflection, not personal voice - feel
   *                    free to edit each one to add your own context
   *                    or rewrite in first person when you're ready.
   *  - previewSrc    - preview audio file path
   */
  tracks: [
    {
      title: "John 19 vs 30",
      verse: "\u201CIt is finished.\u201D",
      ref: "John 19:30",
      fullVerse: "When Jesus had received the sour wine, he said, \u201CIt is finished,\u201D and he bowed his head and gave up his spirit.",
      reflection: "The cry that ends the long ache. Three words that close the gap, settle the debt, and finish the work no one else could carry.",
      previewSrc: "/audio/previews/01-john-19-vs-30.mp3",
      lyricCards: [
        "/lyrics/john-19-vs-30/01.jpg",
        "/lyrics/john-19-vs-30/02.jpg",
        "/lyrics/john-19-vs-30/03.jpg",
        "/lyrics/john-19-vs-30/04.jpg",
      ],
      lyricCardsPdf: "/lyrics/john-19-vs-30/lyric-cards.pdf",
    },
    {
      title: "Matthew 14 vs 31",
      verse: "\u201CO you of little faith, why did you doubt?\u201D",
      ref: "Matthew 14:31",
      fullVerse: "Jesus immediately reached out his hand and took hold of him, saying to him, \u201CO you of little faith, why did you doubt?\u201D",
      reflection: "Not a rebuke first - a hand reaching out first. The doubt is named, but only after the rescue.",
      previewSrc: "/audio/previews/02-matthew-14-vs-31.mp3",
      lyricCards: [
        "/lyrics/matthew-14-vs-31/01.jpg",
        "/lyrics/matthew-14-vs-31/02.jpg",
        "/lyrics/matthew-14-vs-31/03.jpg",
      ],
      lyricCardsPdf: "/lyrics/matthew-14-vs-31/lyric-cards.pdf",
    },
    {
      title: "John 11 vs 35",
      verse: "\u201CJesus wept.\u201D",
      ref: "John 11:35",
      fullVerse: "Jesus wept.",
      reflection: "Two words. The shortest verse in scripture, and the proof that grief is not weakness - even God enters our weeping before he answers it.",
      previewSrc: "/audio/previews/03-john-11-vs-35.mp3",
      lyricCards: [
        "/lyrics/john-11-vs-35/01.jpg",
        "/lyrics/john-11-vs-35/02.jpg",
        "/lyrics/john-11-vs-35/03.jpg",
        "/lyrics/john-11-vs-35/04.jpg",
        "/lyrics/john-11-vs-35/05.jpg",
      ],
      lyricCardsPdf: "/lyrics/john-11-vs-35/lyric-cards.pdf",
    },
    {
      title: "Luke 15 vs 20",
      verse: "\u201CHis father saw him and felt compassion, and ran and embraced him and kissed him.\u201D",
      ref: "Luke 15:20",
      fullVerse: "And he arose and came to his father. But while he was still a long way off, his father saw him and felt compassion, and ran and embraced him and kissed him.",
      reflection: "While he was still a long way off. The Father runs first. Grace doesn\u2019t wait for our explanation.",
      previewSrc: "/audio/previews/04-luke-15-vs-20.mp3",
      lyricCards: [
        "/lyrics/luke-15-vs-20/01.jpg",
        "/lyrics/luke-15-vs-20/02.jpg",
        "/lyrics/luke-15-vs-20/03.jpg",
      ],
      lyricCardsPdf: "/lyrics/luke-15-vs-20/lyric-cards.pdf",
    },
    {
      title: "Proverbs 3 vs 5",
      verse: "\u201CTrust in the Lord with all your heart, and do not lean on your own understanding.\u201D",
      ref: "Proverbs 3:5",
      fullVerse: "Trust in the Lord with all your heart, and do not lean on your own understanding.",
      reflection: "The hardest verse to live. Not lean on your own understanding - even when your understanding feels like all you have.",
      previewSrc: "/audio/previews/05-proverbs-3-vs-5.mp3",
      lyricCards: [
        "/lyrics/proverbs-3-vs-5/01.jpg",
        "/lyrics/proverbs-3-vs-5/02.jpg",
        "/lyrics/proverbs-3-vs-5/03.jpg",
        "/lyrics/proverbs-3-vs-5/04.jpg",
      ],
      lyricCardsPdf: "/lyrics/proverbs-3-vs-5/lyric-cards.pdf",
    },
    {
      title: "John 3 vs 16",
      verse: "\u201CFor God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.\u201D",
      ref: "John 3:16",
      fullVerse: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
      reflection: "The verse you\u2019ve heard a thousand times. Read it again, slowly, like the first time.",
      previewSrc: "/audio/previews/06-john-3-vs-16.mp3",
      lyricCards: [
        "/lyrics/john-3-vs-16/01.jpg",
        "/lyrics/john-3-vs-16/02.jpg",
        "/lyrics/john-3-vs-16/03.jpg",
      ],
      lyricCardsPdf: "/lyrics/john-3-vs-16/lyric-cards.pdf",
    },
    {
      title: "2 Corinthians 5 vs 21",
      verse: "\u201CFor our sake he made him to be sin who knew no sin, so that in him we might become the righteousness of God.\u201D",
      ref: "2 Corinthians 5:21",
      fullVerse: "For our sake he made him to be sin who knew no sin, so that in him we might become the righteousness of God.",
      reflection: "The trade no one else could make. His righteousness for our shame - freely given, never earned.",
      previewSrc: "/audio/previews/07-2-corinthians-5-vs-21.mp3",
      lyricCards: [
        "/lyrics/2-corinthians-5-vs-21/01.jpg",
        "/lyrics/2-corinthians-5-vs-21/02.jpg",
        "/lyrics/2-corinthians-5-vs-21/03.jpg",
        "/lyrics/2-corinthians-5-vs-21/04.jpg",
      ],
      lyricCardsPdf: "/lyrics/2-corinthians-5-vs-21/lyric-cards.pdf",
    },
  ],
};
