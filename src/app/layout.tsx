import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter"; // self-hosted: no build-time network call
import { BackgroundScene } from "@/components/ui/BackgroundScene";
import { APP_NAME, TAGLINE } from "@/lib/constants";
import "./globals.css";

const DESCRIPTION = "Message your doctor, share reports and see your prescriptions in one private place.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: `${APP_NAME} · ${TAGLINE}`, template: `%s · ${APP_NAME}` },
  description: DESCRIPTION,
  applicationName: APP_NAME,
  // Private medical app: good link previews when shared, but kept out of search results.
  robots: { index: false, follow: false },
  openGraph: { type: "website", siteName: APP_NAME, title: APP_NAME, description: DESCRIPTION, locale: "en_IN" },
  twitter: { card: "summary_large_image", title: APP_NAME, description: DESCRIPTION },
  appleWebApp: { title: APP_NAME, statusBarStyle: "default" },
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
