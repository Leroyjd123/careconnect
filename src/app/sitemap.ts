import type { MetadataRoute } from "next";

/**
 * Only the three public pages: the landing page, the privacy notice and the terms.
 * Everything else in the app needs a signed-in account, so it is never listed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();
  return ["", "/privacy", "/terms"].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? ("weekly" as const) : ("yearly" as const),
    priority: path === "" ? 1 : 0.3,
  }));
}
