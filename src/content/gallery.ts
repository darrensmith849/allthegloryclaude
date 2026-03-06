export type GalleryItem = {
  src: string;
  alt: string;
  caption?: string;
};

export const homeGallery: GalleryItem[] = [
  { src: "/media/album.jpg", alt: "Album artwork — From Darkness To Light", caption: "From Darkness To Light" },
  { src: "/media/ocean.jpg", alt: "Ocean — All The Glory", caption: "All The Glory" },
  { src: "/media/artist.jpg", alt: "Artist portrait — All The Glory", caption: "The Artist" },
  { src: "/media/album.jpg", alt: "Album artwork detail", caption: "Truth that sets us free" },
  { src: "/media/ocean.jpg", alt: "Ocean detail", caption: "Hope in Jesus" },
];
