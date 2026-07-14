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
  title: "MARQ AI Agent TRIBE — Your AI Workforce, Deployed and Ready",
  description: "MARQ AI Agent TRIBE: Role-based AI workforce platform with 8 specialized agents for Development, Testing, Business Analysis, Sales, Implementation, Data Analysis, System Admin, and Support.",
  keywords: ["MARQ AI", "Agent TRIBE", "AI workforce", "role-based access", "automation", "AI agents", "development agents"],
  authors: [{ name: "MARQ AI" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "MARQ AI Agent TRIBE — Your AI Workforce",
    description: "8 Specialized AI Agents with Role-Based Access Control",
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
