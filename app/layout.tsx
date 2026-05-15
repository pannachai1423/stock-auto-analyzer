import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stock Auto Analyzer",
  description: "Yahoo Finance powered stock dashboard with trend, options, and support/resistance analysis."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>
        <AppNav />
        {children}
      </body>
    </html>
  );
}
