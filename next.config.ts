import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uploads go straight from the browser to Supabase Storage, so server actions
  // only carry small JSON payloads.
  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
  },
};

export default nextConfig;
