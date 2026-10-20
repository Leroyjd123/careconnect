import { ImageResponse } from "next/og";
import { APP_NAME, TAGLINE } from "@/lib/constants";
import { BRAND, BrandMark } from "./brand-mark";

export const alt = `${APP_NAME}: ${TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Link preview when the site is shared (WhatsApp, email, Slack). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: `radial-gradient(circle at 15% 10%, #cfe3d6, ${BRAND.ground} 60%)`,
        }}
      >
        <BrandMark size={170} />
        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, color: BRAND.forest, letterSpacing: -2 }}>{APP_NAME}</div>
        <div style={{ display: "flex", fontSize: 36, color: BRAND.ink2 }}>{TAGLINE}</div>
      </div>
    ),
    size,
  );
}
