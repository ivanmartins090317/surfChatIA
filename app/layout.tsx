import { Space_Grotesk, Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: {
    default: "Surf Performance & Board AI",
    template: "%s | Surf AI Coach",
  },
  description:
    "Análise de performance e especificação de pranchas com IA para surfistas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${display.variable} ${sans.variable} min-h-dvh`}>
        <NuqsAdapter>{children}</NuqsAdapter>
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "glass border-border text-foreground",
            },
          }}
        />
      </body>
    </html>
  );
}
