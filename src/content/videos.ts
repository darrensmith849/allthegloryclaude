/**
 * Curated video data for the /videos page.
 *
 * The page is built around a single `featured` film (the cinematic hero)
 * and an editorial `collection` rendered as panel-scrim rows beneath it
 * — mirroring the track list on the Music page.
 *
 * Adding a new video later is a one-place edit: append an entry to
 * `collection` and (optionally) bump the featured fields up top.
 */

export type VideoKind =
  | "Worship Film"
  | "Live Worship"
  | "Acoustic Session"
  | "Lyric Video"
  | "Behind The Song"
  | "Music Video";

export type VideoCollectionItem = {
  /** Stable React key. Use a slug. */
  id: string;
  /** YouTube video ID — the 11-char string from the YouTube URL.
   *  Entries with an empty id are skipped at render time, so it's safe
   *  to leave placeholder TODOs in the array. */
  youtubeId: string;
  /** Canonical watch URL. */
  watchUrl: string;
  /** Display title for the row. */
  title: string;
  /** Category eyebrow above the title. */
  kind: VideoKind;
  /** One-line editorial description shown on row hover. */
  description: string;
  /** Optional duration label like "4:21" — shown in the metadata strip. */
  duration?: string;
};

export const videos = {
  /** Featured video — drives the hero film section. */
  featuredId: "sxcoxQZ8kRM",
  featuredWatchUrl: "https://www.youtube.com/watch?v=sxcoxQZ8kRM",
  featuredKind: "Music Video" as VideoKind,
  featuredTitle: "From Darkness To Light",
  featuredDescription:
    "Live worship, performances, and music videos — shared as they release on the channel.",
  /** Optional duration label. Leave empty to hide. */
  featuredDuration: "",

  /**
   * The curated collection rendered as editorial rows beneath the hero.
   * Append new films / sessions / videos here as they release.
   *
   * Tips:
   *  - Reuse the featured film as the first entry so people can click
   *    into it from the collection too.
   *  - Empty `youtubeId` rows are skipped — safe to leave TODOs.
   */
  collection: [
    {
      id: "from-darkness-to-light",
      youtubeId: "sxcoxQZ8kRM",
      watchUrl: "https://www.youtube.com/watch?v=sxcoxQZ8kRM",
      title: "From Darkness To Light",
      kind: "Music Video",
      description:
        "The official video for the album\u2019s closing thread — visuals woven through the heart of the project.",
      duration: "",
    },
    // TODO: add more videos as they release. Pattern:
    // {
    //   id: "unique-slug",
    //   youtubeId: "ELEVEN_CHAR_ID",
    //   watchUrl: "https://www.youtube.com/watch?v=ELEVEN_CHAR_ID",
    //   title: "Title shown on the row",
    //   kind: "Acoustic Session", // or any VideoKind value above
    //   description: "Short editorial line shown on hover.",
    //   duration: "4:21", // optional
    // },
  ] as VideoCollectionItem[],
};
