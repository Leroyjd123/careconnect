import { headers } from "next/headers";
import { env } from "@/lib/env";

/**
 * The address people should open: the host the current request came in on (so a doctor on the live
 * site always gets live links), then NEXT_PUBLIC_SITE_URL, then Vercel's production URL.
 * A configured localhost value is never used for a request that came from somewhere else.
 */
export async function requestSiteUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https");
      return `${proto.split(",")[0].trim()}://${host.split(",")[0].trim()}`;
    }
  } catch {
    // Outside a request (build, cron): fall through.
  }
  return env.siteUrl().replace(/\/$/, "");
}
