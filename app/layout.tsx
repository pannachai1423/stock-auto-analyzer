import type { Metadata, Viewport } from "next";
import { Baloo_2, Quicksand, Mali, Noto_Sans_Thai_Looped } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingBackground from "@/components/FloatingBackground";
import MochiToaster from "@/components/MochiToaster";
import { LangProvider } from "@/lib/i18n";

const display = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display"
});

const body = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body"
});

const displayThai = Mali({
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-thai"
});

const bodyThai = Noto_Sans_Thai_Looped({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body-thai"
});

export const metadata: Metadata = {
  title: "Dear Memory — Some moments only happen once 💖",
  description:
    "A magical online world where people save the moments they never want to lose. Korean-style photobooth, dreamy filters, scrapbooks, and time capsules — with Mochi Dino by your side.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png"
  },
  openGraph: {
    title: "Dear Memory 💖",
    description: "Some moments only happen once. Let's keep this one forever.",
    images: ["/icons/icon-512.png"]
  }
};

export const viewport: Viewport = {
  themeColor: "#fff8f0"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="th"
      className={`${display.variable} ${body.variable} ${displayThai.variable} ${bodyThai.variable}`}
    >
      <body>
        <LangProvider>
          <FloatingBackground />
          <Navbar />
          <main className="relative z-10 mx-auto w-[min(1080px,94vw)] pt-8">{children}</main>
          <Footer />
          <MochiToaster />
        </LangProvider>
      </body>
    </html>
  );
}
