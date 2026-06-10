"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/i18n";

export default function Navbar() {
  const pathname = usePathname();
  const { lang, setLang, t } = useLang();

  const links = [
    { href: "/", label: t.nav.home, emoji: "🏡" },
    { href: "/photobooth", label: t.nav.photobooth, emoji: "📸" },
    { href: "/scrapbook", label: t.nav.scrapbook, emoji: "📖" },
    { href: "/timeline", label: t.nav.timeline, emoji: "🌸" },
    { href: "/capsule", label: t.nav.capsule, emoji: "⏳" },
    { href: "/premium", label: t.nav.premium, emoji: "👑" }
  ];

  return (
    <header className="sticky top-3 z-40 mx-auto w-[min(1080px,94vw)]">
      <nav className="glass-strong flex flex-wrap items-center justify-between gap-2 rounded-full px-4 py-2 shadow-plush sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-105">
          <span className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-cream-100 shadow-plush">
            <Image src="/mochi/mochi-face.png" alt="Mochi Dino" fill sizes="40px" className="object-cover" />
          </span>
          <span className="font-display text-xl leading-none">
            <span className="title-gradient">Dear Memory</span>
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all hover:scale-105 ${
                  active
                    ? "bg-blossom-200/90 text-[#a45a7c] shadow-bubble"
                    : "text-cocoa hover:bg-white/70"
                }`}
              >
                <span className="mr-1" aria-hidden>
                  {l.emoji}
                </span>
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setLang(lang === "en" ? "th" : "en")}
            title={lang === "en" ? "เปลี่ยนเป็นภาษาไทย" : "Switch to English"}
            className="ml-1 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-sm font-bold text-cocoa shadow-plush transition-all hover:scale-105 hover:bg-white"
          >
            {lang === "en" ? "🇹🇭 ไทย" : "🌏 EN"}
          </button>
        </div>
      </nav>
    </header>
  );
}
