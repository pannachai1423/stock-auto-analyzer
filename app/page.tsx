"use client";

import Image from "next/image";
import Link from "next/link";
import HomeHero from "@/components/HomeHero";
import { CATEGORIES } from "@/lib/categories";
import { useLang } from "@/lib/i18n";

const FEATURE_LINKS = ["/photobooth", "/photobooth", "/scrapbook", "/timeline", "/capsule", "/premium"];

const EXPRESSIONS = [
  { src: "/mochi/mochi-happy.png", key: "happy" as const },
  { src: "/mochi/mochi-excited.png", key: "excited" as const },
  { src: "/mochi/mochi-waving.png", key: "waving" as const },
  { src: "/mochi/mochi-curious.png", key: "curious" as const }
];

export default function HomePage() {
  const { t } = useLang();

  return (
    <>
      <HomeHero />

      {/* memory categories */}
      <section className="py-12">
        <h2 className="text-center font-display text-3xl sm:text-4xl">
          {t.home.categoriesTitle} <span aria-hidden>💭</span>
        </h2>
        <p className="mx-auto mt-2 max-w-md text-center text-cocoaSoft">{t.home.categoriesSub}</p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={`/photobooth?category=${c.id}`}
              className={`group rounded-squish border border-white/70 bg-gradient-to-br ${c.pastel} p-5 shadow-plush transition-all duration-200 hover:-translate-y-1.5 hover:shadow-plushLg`}
            >
              <span className="block text-3xl transition-transform duration-200 group-hover:scale-125">
                {c.emoji}
              </span>
              <span className="mt-3 block font-display text-lg leading-snug text-cocoa">
                {t.categories[c.id].label}
              </span>
              <span className="mt-1 block text-xs text-cocoa/60">{t.categories[c.id].blurb}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* features */}
      <section className="py-12">
        <h2 className="text-center font-display text-3xl sm:text-4xl">
          {t.home.featuresTitle1}
          <span className="title-gradient">{t.home.featuresTitleHi}</span> ✨
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.home.features.map((f, i) => (
            <div
              key={f.title}
              className="plush-card flex flex-col p-6 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-plushLg"
            >
              <span className="text-3xl">{f.emoji}</span>
              <h3 className="mt-3 font-display text-xl text-cocoa">{f.title}</h3>
              <p className="mt-2 flex-1 text-sm text-cocoaSoft">{f.body}</p>
              <Link
                href={FEATURE_LINKS[i]}
                className="mt-4 font-display text-sm text-blossom-500 hover:underline"
              >
                {f.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* mochi expressions strip */}
      <section className="py-12">
        <div className="plush-card flex flex-col items-center gap-6 p-8 sm:p-10">
          <h2 className="text-center font-display text-2xl sm:text-3xl">
            {t.home.meetTitle1}
            <span className="title-gradient">Mochi Dino</span>
            {t.home.meetTitle2}
          </h2>
          <p className="max-w-lg text-center text-sm text-cocoaSoft">{t.home.meetBody}</p>
          <div className="flex flex-wrap items-end justify-center gap-6">
            {EXPRESSIONS.map((e, i) => (
              <figure key={e.key} className="flex flex-col items-center gap-2">
                <Image
                  src={e.src}
                  alt={`Mochi Dino — ${t.home.expressions[e.key]}`}
                  width={120}
                  height={140}
                  className="animate-floaty drop-shadow-[0_12px_18px_rgba(132,189,120,0.3)]"
                  style={{ animationDelay: `${i * 0.6}s` }}
                />
                <figcaption className="chip text-xs">{t.home.expressions[e.key]}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* coming soon teasers */}
      <section className="py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="plush-card relative overflow-hidden p-7">
            <span className="absolute right-4 top-4 chip text-xs">{t.home.teaserSewing}</span>
            <span className="text-3xl">💞</span>
            <h3 className="mt-3 font-display text-xl">{t.home.teaser1Title}</h3>
            <p className="mt-2 text-sm text-cocoaSoft">{t.home.teaser1Body}</p>
          </div>
          <div className="plush-card relative overflow-hidden p-7">
            <span className="absolute right-4 top-4 chip text-xs">{t.home.teaserSoon}</span>
            <span className="text-3xl">🪄</span>
            <h3 className="mt-3 font-display text-xl">{t.home.teaser2Title}</h3>
            <p className="mt-2 text-sm text-cocoaSoft">{t.home.teaser2Body}</p>
          </div>
        </div>
      </section>
    </>
  );
}
