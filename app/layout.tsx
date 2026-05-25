import type { Metadata } from "next";
import { Space_Grotesk, Work_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { EnsureUser } from "@/components/ensure-user";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-work-sans",
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
    <html lang="en" className={`${spaceGrotesk.variable} ${workSans.variable}`}>
      <body className="min-h-screen antialiased">
        <Providers>
          <EnsureUser />
          {children}
        </Providers>
      </body>
    </html>
  );
}
