import { ImageResponse } from "next/og";
import { BRAND, BrandMark } from "./brand-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iPhone ("Add to Home Screen"). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: BRAND.ground }}>
        <BrandMark size={132} />
      </div>
    ),
    size,
  );
}
