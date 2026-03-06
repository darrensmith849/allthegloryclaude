export type GalleryItem = {
  src: string;
  alt: string;
  caption?: string;
};

export const homeGallery: GalleryItem[] = [
  {
    src: "/media/cover.jpg",
    alt: "Album cover art — From Darkness To Light",
    caption: "From Darkness To Light",
  },
  {
    src: "/media/artist.jpg",
    alt: "Artist portrait — All The Glory",
    caption: "All The Glory",
  },
  {
    src: "/media/cover.jpg",
    alt: "Album artwork detail",
    caption: "Truth that sets us free",
  },
  {
    src: "/media/artist.jpg",
    alt: "Artist portrait detail",
    caption: "Hope in Jesus",
  },
  {
    src: "/media/cover.jpg",
    alt: "From Darkness To Light",
    caption: "From darkness to light",
  },
];
