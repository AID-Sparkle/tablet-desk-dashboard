import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Desk Dashboard - スマートデスクコンソール",
  description: "Xiaomi Pad 5常設用スマートダッシュボード (時計・天気・Spotify・最新ニュース)",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Desk Dashboard",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#06080e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full bg-[#06080e] overflow-hidden select-none">
      <body className="h-full w-full bg-[#06080e] text-slate-100 overflow-hidden">
        {children}
      </body>
    </html>
  );
}
