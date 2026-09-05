import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import AppShell from "@/components/layout/AppShell";
import "./globals.css";
import "@/styles/leaflet-dark.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AAROHAN | Email Threat Forensics",
  description: "Unified AI-Powered Email Threat Forensics & Investigation Platform",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-300">
        <AppShell>
          {children}
        </AppShell>
        <Toaster theme="dark" position="top-right" richColors />
      </body>
    </html>
  );
}
