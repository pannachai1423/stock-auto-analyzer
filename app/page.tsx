import Image from "next/image";
import Link from "next/link";
import HomeHero from "@/components/HomeHero";
import { CATEGORIES } from "@/lib/categories";

const FEATURES = [
  {
    emoji: "📸",
    title: "Korean Photobooth",
    body: "Countdown, auto-capture, dreamy filters, and 4 or 6 photo strips — just like your favorite booth in Seoul.",
    href: "/photobooth",
    cta: "Take photos"
  },
  {
    emoji: "🎀",
    title: "Decorate Everything",
    body: "Hearts, bows, flowers, sparkles, and real Mochi Dino stickers. Drag, drop, sprinkle magic.",
    href: "/photobooth",
    cta: "Start decorating"
  },
  {
    emoji: "📖",
    title: "Scrapbook Mode",
    body: "Every memory lands in a treasured diary. Write little notes so future you remembers everything.",
    href: "/scrapbook",
    cta: "Open scrapbook"
  },
  {
    emoji: "🌸",
    title: "Memory Timeline",
    body: "Watch your story bloom month by month — a soft, nostalgic walk through everything you saved.",
    href: "/timeline",
    cta: "See timeline"
  },
  {
    emoji: "⏳",
    title: "Time Capsule",
    body: "Seal a letter for 6 months, 1 year, or 5 years. When it opens, past-you says hello.",
    href: "/capsule",
    cta: "Seal a capsule"
  },
  {
    emoji: "👑",
    title: "Premium Magic",
    body: "AI frames, AI stickers, exclusive themes, and rare Mochi costumes for super-memory-keepers.",
    href: "/premium",
    cta: "See premium"
  }
];

const EXPRESSIONS = [
  { src: "/mochi/mochi-happy.png", label: "Happy" },
  { src: "/mochi/mochi-excited.png", label: "Excited" },
  { src: "/mochi/mochi-waving.png", label: "Waving" },
  { src: "/mochi/mochi-curious.png", label: "Curious" }
];

export default function HomePage() {
  return (
    <>
      <HomeHero />

      {/* memory categories */}
      <section className="py-12">
        <h2 className="text-center font-display text-3xl sm:text-4xl">
          What kind of moment is it? <span aria-hidden>💭</span>
        </h2>
        <p className="mx-auto mt-2 max-w-md text-center text-cocoaSoft">
          Every memory has its own little home in your scrapbook.
        </p>
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
                {c.label}
              </span>
              <span className="mt-1 block text-xs text-cocoa/60">{c.blurb}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* features */}
      <section className="py-12">
        <h2 className="text-center font-display text-3xl sm:text-4xl">
          A whole world of <span className="title-gradient">memory magic</span> ✨
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="plush-card flex flex-col p-6 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-plushLg">
              <span className="text-3xl">{f.emoji}</span>
              <h3 className="mt-3 font-display text-xl text-cocoa">{f.title}</h3>
              <p className="mt-2 flex-1 text-sm text-cocoaSoft">{f.body}</p>
              <Link href={f.href} className="mt-4 font-display text-sm text-blossom-500 hover:underline">
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
            Meet <span className="title-gradient">Mochi Dino</span> — your memory buddy 🦕
          </h2>
          <p className="max-w-lg text-center text-sm text-cocoaSoft">
            Gentle, cheerful, slightly clumsy, and completely in love with photos.
            Mochi welcomes you, counts you down, cheers for you, and keeps every
            memory safe in his little heart backpack.
          </p>
          <div className="flex flex-wrap items-end justify-center gap-6">
            {EXPRESSIONS.map((e, i) => (
              <figure key={e.label} className="flex flex-col items-center gap-2">
                <Image
                  src={e.src}
                  alt={`Mochi Dino feeling ${e.label.toLowerCase()}`}
                  width={120}
                  height={140}
                  className="animate-floaty drop-shadow-[0_12px_18px_rgba(132,189,120,0.3)]"
                  style={{ animationDelay: `${i * 0.6}s` }}
                />
                <figcaption className="chip text-xs">{e.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* coming soon teasers */}
      <section className="py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="plush-card relative overflow-hidden p-7">
            <span className="absolute right-4 top-4 chip text-xs">🧵 Mochi is sewing this…</span>
            <span className="text-3xl">💞</span>
            <h3 className="mt-3 font-display text-xl">Long Distance Mode</h3>
            <p className="mt-2 text-sm text-cocoaSoft">
              Take photos together from different cities, in the same booth, at the
              same moment. Distance is no match for best friends.
            </p>
          </div>
          <div className="plush-card relative overflow-hidden p-7">
            <span className="absolute right-4 top-4 chip text-xs">✨ Coming soon</span>
            <span className="text-3xl">🪄</span>
            <h3 className="mt-3 font-display text-xl">AI Sticker &amp; Frame Studio</h3>
            <p className="mt-2 text-sm text-cocoaSoft">
              Turn selfies into kawaii stickers and chibi characters, and dream up
              frames for birthdays, graduations, and girls&apos; trips.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
