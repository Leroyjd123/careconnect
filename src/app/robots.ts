import type { MetadataRoute } from "next";

/** Private medical app: nothing should be indexed by search engines. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
