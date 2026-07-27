import type { Metadata } from "next";
import "./globals.css";
import { PinterestScript } from "./pinterest-script";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: "Campaign Gazetteer",
  openGraph: {
    title: "Campaign Gazetteer",
    images: [{ url: "/og-spartan.png", width: 1200, height: 800 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Campaign Gazetteer",
    images: ["/og-spartan.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <PinterestScript />
      </body>
    </html>
  );
}
