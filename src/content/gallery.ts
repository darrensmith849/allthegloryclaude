export type GalleryItem = {
  src: string;
  alt: string;
  caption?: string;
};

export const homeGallery: GalleryItem[] = [
  {
    src: "/media/cover.jpg",
    alt: "Light breaking into darkness — From Darkness To Light",
    caption: "From Darkness To Light",
  },
  {
    src: "/media/dad.jpg",
    alt: "Father and son — the story behind the music",
    caption: "Where it all began",
  },
];
