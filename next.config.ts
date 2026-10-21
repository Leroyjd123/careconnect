import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uploads go straight from the browser to Supabase Storage, so server actions
  // only carry small JSON payloads.
  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
  },
  // The push service worker must never be cached, or devices keep an old version.
  async headers() {
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] }];
  },
};

export default nextConfig;
