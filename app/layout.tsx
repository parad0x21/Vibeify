import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { EnsureUser } from "@/components/ensure-user";
import "./globals.css";

// Inter is the fallback for Satoshi/Clash Display (loaded via Fontshare below).
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vibeify",
  description: "The planning workspace for vibe coders and app builders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&f[]=clash-display@400,500,600,700&display=swap"
        />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>
          <EnsureUser />
          {children}
        </Providers>
      </body>
    </html>
  );
}
