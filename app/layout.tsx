import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { EnsureUser } from "@/components/ensure-user";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

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
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <body className="min-h-screen antialiased">
        <Providers>
          <EnsureUser />
          {children}
        </Providers>
      </body>
    </html>
  );
}
