import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://example.com";
  const routes = [
    "/",
    "/about",
    "/album/from-darkness-to-light",
    "/music",
    "/videos",
    "/events",
    "/contact",
  ];

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
