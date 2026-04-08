import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.alltheglory.co.za";
  // Only real, useful destination pages.
  // /events now serves as the Bookings & Enquiries page.
  const routes = [
    "/",
    "/about",
    "/album/from-darkness-to-light",
    "/videos",
    "/events",
    "/give",
    "/contact",
  ];

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
