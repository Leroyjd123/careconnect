import type { MetadataRoute } from "next";

/**
 * The public pages: the landing page and the two legal pages. Everything else is a
 * private medical app, so it stays out of search engines.
 *
 * The allow rules are anchored with "$", so they match those three pages exactly and
 * not anything below them.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/$", "/privacy$", "/terms$"], disallow: "/" }],
    sitemap: "/sitemap.xml",
  };
}

