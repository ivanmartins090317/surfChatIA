import { Space_Grotesk, Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { Metadata, Viewport } from "next";
import { CookieConsentBanner } from "@/components/legal/cookie-consent-banner";
import { AppToaster } from "@/components/layout/app-toaster";
import { BRAND_NAME } from "@/lib/brand";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_NAME = BRAND_NAME;
const SITE_DESCRIPTION =
  "Análise de performance e especificação de pranchas com IA para surfistas.";
const SHARE_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: SITE_NAME,
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Surf Performance & Board AI",
    template: `%s | ${BRAND_NAME}`,
  },
  description: SITE_DESCRIPTION,
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    locale: "pt_BR",
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [SHARE_IMAGE],
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0F14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className={`${display.variable} ${sans.variable} min-h-dvh`}
        suppressHydrationWarning
      >
        <NuqsAdapter>{children}</NuqsAdapter>
        <CookieConsentBanner />
        <AppToaster />
      </body>
    </html>
  );
}
