import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Premium · Dear Memory 👑"
};

const FREE = [
  "📸 Full Korean photobooth (4 & 6 strips)",
  "🌷 All 7 dreamy filters",
  "🎀 Hearts, stars, bows & Mochi stickers",
  "📖 Scrapbook & memory timeline",
  "⏳ Time capsules",
  "⬇️ Unlimited downloads"
];

const PREMIUM = [
  "🪄 AI Sticker Generator — selfies → kawaii stickers & chibis",
  "🖼️ AI Frame Generator — birthdays, graduations, girls' trips",
  "🌌 AI Backgrounds — cherry blossom parks, cozy cafés, starry skies",
  "💞 Long Distance Mode — shared booths across cities",
  "🎬 Animated memory movies — GIFs, Reels & TikToks",
  "👗 Rare Mochi Dino costumes & seasonal themes"
];

export default function PremiumPage() {
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
          Dear Memory <span className="title-gradient">Premium</span> 👑
        </h1>
        <p className="max-w-md text-sm text-cocoaSoft">
          For super-memory-keepers who want a little extra magic.
        </p>
      </div>

      <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
        <div className="plush-card flex flex-col p-7">
          <h2 className="font-display text-2xl">Little Sprout 🌱</h2>
          <p className="mt-1 font-display text-3xl">
            Free <span className="text-sm font-body text-cocoaSoft">forever</span>
          </p>
          <ul className="mt-5 flex-1 space-y-2.5 text-sm text-cocoa">
            {FREE.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <Link href="/photobooth" className="btn-cloud mt-6 w-full">
            Start saving memories
          </Link>
        </div>

        <div className="relative flex flex-col rounded-squish border-2 border-blossom-300 bg-gradient-to-b from-white/80 to-blossom-50/80 p-7 shadow-plushLg backdrop-blur-xl">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blossom-400 to-lav-400 px-4 py-1 text-xs font-bold text-white shadow-bubble">
            ✨ Mochi&apos;s favorite
          </span>
          <h2 className="font-display text-2xl">Memory Fairy 🧚</h2>
          <p className="mt-1 font-display text-3xl">
            $4.99 <span className="text-sm font-body text-cocoaSoft">/ month</span>
          </p>
          <ul className="mt-5 flex-1 space-y-2.5 text-sm text-cocoa">
            {PREMIUM.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <button
            disabled
            className="btn-candy mt-6 w-full cursor-not-allowed opacity-80"
            title="Premium launches soon"
          >
            🧵 Mochi is sewing this — coming soon
          </button>
          <p className="mt-2 text-center text-[11px] text-cocoaSoft">
            Premium (with Stripe checkout) launches with the AI studio. No
            payments are collected yet.
          </p>
        </div>
      </div>
    </div>
  );
}
