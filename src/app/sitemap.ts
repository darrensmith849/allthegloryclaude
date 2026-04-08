import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.alltheglory.co.za";
  // Only real, useful destination pages. /events is intentionally omitted
  // until it has real content; /music was a stale reference.
  const routes = [
    "/",
    "/about",
    "/album/from-darkness-to-light",
    "/videos",
    "/give",
    "/contact",
  ];

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
