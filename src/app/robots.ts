import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // /agency is an unlisted preview of a separate business: it is not linked
    // from the site, every page is noindex, and crawlers are kept out here too.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/agency"] }],
    sitemap: "https://alltheglory.co.za/sitemap.xml",
  };
}
