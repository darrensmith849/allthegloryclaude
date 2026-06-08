import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.alltheglory.co.za";
  // Only real, useful destination pages.
  const routes = [
    "/",
    "/about",
    "/album/from-darkness-to-light",
    "/videos",
    "/commissions",
    "/testimony",
    "/contact",
  ];

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
