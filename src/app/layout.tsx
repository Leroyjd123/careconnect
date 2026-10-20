import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter"; // self-hosted: no build-time network call
import { BackgroundScene } from "@/components/ui/BackgroundScene";
import { APP_NAME, TAGLINE } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: TAGLINE,
  robots: { index: false, follow: false }, // private medical app
};

export const viewport: Viewport = {
  themeColor: "#1f6b57",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <BackgroundScene />
        {children}
      </body>
    </html>
  );
}
