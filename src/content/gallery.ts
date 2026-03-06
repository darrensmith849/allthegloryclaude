export type GalleryItem = {
  src: string;
  alt: string;
  caption?: string;
};

export const homeGallery: GalleryItem[] = [
  {
    src: "/media/ocean.jpg",
    alt: "Ocean artwork — From Darkness To Light",
    caption: "From Darkness To Light",
  },
  {
    src: "/media/artist.jpg",
    alt: "Artist portrait — All The Glory",
    caption: "All The Glory",
  },
  {
    src: "/media/cover.jpg",
    alt: "Album cover art — From Darkness To Light",
    caption: "Album cover art",
  },

  /* Extras for flow (duplicates until more images exist) */
  {
    src: "/media/ocean.jpg",
    alt: "Ocean artwork detail",
    caption: "Truth that sets us free",
  },
  {
    src: "/media/artist.jpg",
    alt: "Artist portrait detail",
    caption: "Hope in Jesus",
  },
];
