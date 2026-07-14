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
  title: "Agent Army — Your AI Workforce, Deployed and Ready",
  description: "Deploy and manage specialized AI agents for Development, Testing, Business Analysis, Sales, Implementation, Data Analysis, System Admin, and Support.",
  keywords: ["AI agents", "Agent Army", "AI workforce", "automation", "development agents", "testing agents"],
  authors: [{ name: "Agent Army" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Agent Army — Your AI Workforce",
    description: "8 Specialized AI Agents Ready to Work for You",
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
