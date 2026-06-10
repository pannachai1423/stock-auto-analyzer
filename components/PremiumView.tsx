"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/lib/i18n";

export default function PremiumView() {
  const { t } = useLang();

  return (
    <div className="pb-8">
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <Image
          src="/mochi/mochi-excited.png"
          alt="Mochi Dino excited about premium"
          width={150}
          height={170}
          className="animate-floaty"
        />
        <h1 className="font-display text-4xl">
          {t.premium.title1}
          <span className="title-gradient">{t.premium.titleHi}</span> 👑
        </h1>
        <p className="max-w-md text-sm text-cocoaSoft">{t.premium.sub}</p>
      </div>

      <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
        <div className="plush-card flex flex-col p-7">
          <h2 className="font-display text-2xl">{t.premium.freeName}</h2>
          <p className="mt-1 font-display text-3xl">
            {t.premium.freePrice}{" "}
            <span className="text-sm font-body text-cocoaSoft">{t.premium.freePeriod}</span>
          </p>
          <ul className="mt-5 flex-1 space-y-2.5 text-sm text-cocoa">
            {t.premium.freeItems.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <Link href="/photobooth" className="btn-cloud mt-6 w-full">
            {t.premium.freeCta}
          </Link>
        </div>

        <div className="relative flex flex-col rounded-squish border-2 border-blossom-300 bg-gradient-to-b from-white/80 to-blossom-50/80 p-7 shadow-plushLg backdrop-blur-xl">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-blossom-400 to-lav-400 px-4 py-1 text-xs font-bold text-white shadow-bubble">
            {t.premium.fav}
          </span>
          <h2 className="font-display text-2xl">{t.premium.proName}</h2>
          <p className="mt-1 font-display text-3xl">
            $4.99 <span className="text-sm font-body text-cocoaSoft">{t.premium.proPeriod}</span>
          </p>
          <ul className="mt-5 flex-1 space-y-2.5 text-sm text-cocoa">
            {t.premium.proItems.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <button
            disabled
            className="btn-candy mt-6 w-full cursor-not-allowed opacity-80"
            title={t.premium.proCtaTip}
          >
            {t.premium.proCta}
          </button>
          <p className="mt-2 text-center text-[11px] text-cocoaSoft">{t.premium.proNote}</p>
        </div>
      </div>
    </div>
  );
}
