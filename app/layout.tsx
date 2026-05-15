import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { TasasProvider } from "@/context/TasasContext";
import AppShell from "@/components/AppShell";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "couple-brain",
  description: "Tu cerebro compartido",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "couple-brain",
  },
};

export const viewport: Viewport = {
  themeColor: "#7C3AED",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className={`${geistSans.variable} font-[family-name:var(--font-geist-sans)] antialiased`}>
        <UserProvider>
          <TasasProvider>
            <AppShell>{children}</AppShell>
          </TasasProvider>
        </UserProvider>
      </body>
    </html>
  );
}
