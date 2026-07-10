import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MArk AI Skills Platform — 170+ Production-Ready AI Skills",
  description: "Browse, discover, and deploy production-ready AI skills for business, engineering, marketing, and more. Powered by MArk AI.",
  keywords: ["AI skills", "MArk AI", "Claude skills", "AI agents", "automation", "business AI"],
  authors: [{ name: "MArk AI" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "MArk AI Skills Platform",
    description: "170+ Production-Ready AI Skills for Business, Engineering, Marketing & More",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
