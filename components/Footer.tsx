"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/lib/i18n";

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="relative z-10 mx-auto mt-20 w-[min(1080px,94vw)] pb-10">
      <div className="plush-card flex flex-col items-center gap-4 px-8 py-10 text-center">
        <Image
          src="/mochi/mochi-waving.png"
          alt="Mochi Dino waving goodbye"
          width={90}
          height={108}
          className="animate-floaty"
        />
        <p className="font-display text-xl text-cocoa">{t.footer.tagline}</p>
        <p className="max-w-md text-sm text-cocoaSoft">{t.footer.blurb}</p>
        <div className="flex flex-wrap justify-center gap-3 text-sm font-semibold">
          <Link href="/photobooth" className="chip hover:scale-105 transition-transform">
            {t.footer.save}
          </Link>
          <Link href="/scrapbook" className="chip hover:scale-105 transition-transform">
            {t.footer.scrapbook}
          </Link>
          <Link href="/capsule" className="chip hover:scale-105 transition-transform">
            {t.footer.capsule}
          </Link>
        </div>
        <p className="text-xs text-cocoaSoft/70">{t.footer.madeWith}</p>
      </div>
    </footer>
  );
}
