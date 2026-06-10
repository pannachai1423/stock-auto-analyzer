"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import MochiDino from "./MochiDino";
import { useLang } from "@/lib/i18n";
import { isReturningVisitor } from "@/lib/storage";

export default function HomeHero() {
  const { t } = useLang();
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    if (isReturningVisitor()) setReturning(true);
  }, []);

  const greeting = returning ? t.mochi.welcomeBack : t.mochi.greeting;

  return (
    <section className="relative flex flex-col-reverse items-center gap-10 py-10 md:flex-row md:justify-between md:py-16">
      <div className="max-w-xl text-center md:text-left">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="chip mb-5"
        >
          {t.hero.chip}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display text-4xl leading-tight sm:text-5xl md:text-6xl"
        >
          {t.hero.title1}
          <span className="title-gradient">{t.hero.titleHi}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="mt-5 text-lg text-cocoaSoft"
        >
          {t.hero.subtitle}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-8 flex flex-wrap justify-center gap-4 md:justify-start"
        >
          <Link href="/photobooth" className="btn-candy">
            {t.hero.ctaSave}
          </Link>
          <Link href="/scrapbook" className="btn-cloud">
            {t.hero.ctaExplore}
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 16, delay: 0.15 }}
        className="relative"
      >
        {/* glow behind Mochi */}
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-mint-200/70 via-blossom-100/70 to-lav-200/70 blur-2xl"
        />
        <MochiDino pose="hero" size={320} message={greeting} priority />
      </motion.div>
    </section>
  );
}
