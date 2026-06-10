import Image from "next/image";
import Link from "next/link";

export default function Footer() {
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
        <p className="font-display text-xl text-cocoa">
          Mochi Dino is always here for you! 💚
        </p>
        <p className="max-w-md text-sm text-cocoaSoft">
          Dear Memory — a magical little world where the moments you never want
          to lose become treasures.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-sm font-semibold">
          <Link href="/photobooth" className="chip hover:scale-105 transition-transform">📸 Save A Memory</Link>
          <Link href="/scrapbook" className="chip hover:scale-105 transition-transform">📖 Scrapbook</Link>
          <Link href="/capsule" className="chip hover:scale-105 transition-transform">⏳ Time Capsule</Link>
        </div>
        <p className="text-xs text-cocoaSoft/70">
          Made with 💖, sparkles, and one very gentle dinosaur.
        </p>
      </div>
    </footer>
  );
}
