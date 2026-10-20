import type { MetadataRoute } from "next";
import { APP_NAME, TAGLINE } from "@/lib/constants";

/** Lets patients add CareConnect to their home screen like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: TAGLINE,
    start_url: "/",
    display: "standalone",
    background_color: "#edf4ef",
    theme_color: "#1f6b57",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
