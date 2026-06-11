"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import MochiDino from "@/components/MochiDino";
import { sfx } from "@/lib/sounds";
import type { MochiPose } from "@/lib/mochi";

const EMOJI_POOL = [
  "🍓", "🌸", "🦕", "🍡", "💖", "⭐", "🌈", "🍑",
  "🐰", "☁️", "🧁", "🎀", "🍒", "🌙", "🍬", "🫧"
];

const DIFFICULTIES = [
  { id: "cozy", label: "Cozy", emoji: "🍼", pairs: 6, cols: "grid-cols-4" },
  { id: "sweet", label: "Sweet", emoji: "🍭", pairs: 8, cols: "grid-cols-4" },
  { id: "sparkly", label: "Sparkly", emoji: "✨", pairs: 10, cols: "grid-cols-4 sm:grid-cols-5" }
] as const;

type DifficultyId = (typeof DIFFICULTIES)[number]["id"];

const PLAYER_FLAVORS = [
  { emoji: "🍓", name: "Berry", active: "bg-blossom-200/90 text-[#a45a7c]", ring: "ring-blossom-300" },
  { emoji: "🍵", name: "Matcha", active: "bg-mint-200/90 text-mint-600", ring: "ring-mint-300" },
  { emoji: "🫐", name: "Taro", active: "bg-lav-200/90 text-[#7c64b8]", ring: "ring-lav-300" },
  { emoji: "🌊", name: "Soda", active: "bg-skyy-200/90 text-[#4a7fa8]", ring: "ring-skyy-300" }
];

const MATCH_CHEERS = [
  "Yay!! A perfect pair! 🎉",
  "You found it! ✨",
  "Two peas in a pod! 💕",
  "Hehe, that one sparkles! ⭐",
  "Match made in mochi heaven! 🍡"
];

const MISS_LINES = [
  "Ooh, so close! 🤏",
  "Hmm... where did it go?",
  "Almost! I believe in you! 💪",
  "Hehe, sneaky cards!"
];

const BEST_KEY = "dear-memory.match-best.";

interface CardData {
  key: number;
  emoji: string;
}

type Phase = "setup" | "playing" | "done";

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(pairs: number): CardData[] {
  const picks = shuffle(EMOJI_POOL).slice(0, pairs);
  return shuffle([...picks, ...picks]).map((emoji, key) => ({ key, emoji }));
}

const pick = (lines: readonly string[]) => lines[Math.floor(Math.random() * lines.length)];

export default function MemoryGameView() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [playerCount, setPlayerCount] = useState(2);
  const [difficulty, setDifficulty] = useState<DifficultyId>("sweet");

  const [deck, setDeck] = useState<CardData[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<boolean[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const [mochiMsg, setMochiMsg] = useState("Let's play! Pick your team! 💖");
  const [mochiPose, setMochiPose] = useState<MochiPose>("waving");
  const lockRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const diff = DIFFICULTIES.find((d) => d.id === difficulty)!;
  const solo = playerCount === 1;

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };

  const startGame = () => {
    sfx.go();
    setDeck(buildDeck(diff.pairs));
    setMatched(Array(diff.pairs * 2).fill(false));
    setScores(Array(playerCount).fill(0));
    setFlipped([]);
    setCurrent(0);
    setMoves(0);
    lockRef.current = false;
    setPhase("playing");
    setMochiPose("hero");
    setMochiMsg(
      playerCount === 1 ? "Find all the pairs! You got this! ✨" : `${PLAYER_FLAVORS[0].name} goes first! 🍓`
    );
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(BEST_KEY + difficulty);
      setBest(stored ? Number(stored) : null);
    }
  };

  const finishGame = (finalScores: number[], finalMoves: number) => {
    setPhase("done");
    setMochiPose("excited");
    sfx.chime();
    if (solo) {
      const prev = best;
      if (prev === null || finalMoves < prev) {
        window.localStorage.setItem(BEST_KEY + difficulty, String(finalMoves));
        setBest(finalMoves);
        setMochiMsg("A new best score!! You're amazing! 🏆");
      } else {
        setMochiMsg("All pairs found! That was so fun! 🎉");
      }
    } else {
      const top = Math.max(...finalScores);
      const winners = finalScores
        .map((s, i) => (s === top ? PLAYER_FLAVORS[i].name : null))
        .filter(Boolean) as string[];
      setMochiMsg(
        winners.length > 1
          ? `It's a tie between ${winners.join(" & ")}! 💞`
          : `Team ${winners[0]} wins!! Yay!! 🎉`
      );
    }
  };

  const flipCard = (i: number) => {
    if (phase !== "playing" || lockRef.current) return;
    if (flipped.includes(i) || matched[i]) return;
    sfx.pop();
    const next = [...flipped, i];
    setFlipped(next);
    if (next.length < 2) return;

    lockRef.current = true;
    const [a, b] = next;
    const nextMoves = moves + 1;
    setMoves(nextMoves);

    if (deck[a].emoji === deck[b].emoji) {
      later(() => {
        const nextMatched = [...matched];
        nextMatched[a] = true;
        nextMatched[b] = true;
        setMatched(nextMatched);
        const nextScores = scores.map((s, i2) => (i2 === current ? s + 1 : s));
        setScores(nextScores);
        setFlipped([]);
        lockRef.current = false;
        if (nextMatched.every(Boolean)) {
          finishGame(nextScores, nextMoves);
        } else {
          sfx.chime();
          setMochiPose("happy");
          setMochiMsg(pick(MATCH_CHEERS));
        }
      }, 450);
    } else {
      later(() => {
        const nextPlayer = (current + 1) % playerCount;
        setFlipped([]);
        setCurrent(nextPlayer);
        lockRef.current = false;
        sfx.tick();
        setMochiPose("curious");
        setMochiMsg(
          solo ? pick(MISS_LINES) : `${pick(MISS_LINES)} ${PLAYER_FLAVORS[nextPlayer].name}'s turn!`
        );
      }, 900);
    }
  };

  const confetti = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        emoji: ["💖", "🌸", "⭐", "🍡", "✨", "💕"][i % 6]
      })),
    []
  );

  return (
    <div className="rise-in pb-16">
      <div className="text-center">
        <span className="chip mb-3">🎮 Mini Game</span>
        <h1 className="font-display text-4xl sm:text-5xl">
          <span className="title-gradient">Mochi Memory Match</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-cocoaSoft">
          Flip the cards, find the pairs, and giggle with your friends. Mochi Dino is cheering for everyone!
        </p>
      </div>

      <div className="mt-8 flex flex-col items-start gap-8 lg:flex-row">
        {/* Mochi cheers from the sidelines */}
        <div className="order-2 mx-auto shrink-0 lg:order-1 lg:sticky lg:top-28">
          <MochiDino pose={mochiPose} size={210} message={mochiMsg} />
        </div>

        <div className="order-1 w-full flex-1 lg:order-2">
          {phase === "setup" && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="plush-card mx-auto max-w-xl p-7 sm:p-9"
            >
              <h2 className="font-display text-2xl">Who's playing? 💞</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PLAYER_FLAVORS.map((f, i) => {
                  const joined = i < playerCount;
                  return (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => {
                        sfx.pop();
                        setPlayerCount(i + 1);
                      }}
                      className={`flex flex-col items-center gap-1 rounded-3xl px-3 py-4 font-semibold shadow-plush transition-all hover:scale-105 active:scale-95 ${
                        joined ? f.active : "glass text-cocoaSoft opacity-70"
                      }`}
                    >
                      <span className="text-3xl">{f.emoji}</span>
                      <span className="text-sm">{f.name}</span>
                      <span className="text-xs">{joined ? "joined!" : "tap to join"}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-center text-xs text-cocoaSoft">
                Tap a team to set how many friends are playing — solo is cozy too!
              </p>

              <h2 className="mt-7 font-display text-2xl">How sweet should it be? 🍬</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      sfx.pop();
                      setDifficulty(d.id);
                    }}
                    className={`chip transition-all hover:scale-105 active:scale-95 ${
                      difficulty === d.id ? "bg-blossom-200/90 text-[#a45a7c] shadow-bubble" : ""
                    }`}
                  >
                    {d.emoji} {d.label} · {d.pairs} pairs
                  </button>
                ))}
              </div>

              <div className="mt-8 text-center">
                <button type="button" onClick={startGame} className="btn-candy">
                  Let's play! 🎀
                </button>
              </div>
            </motion.section>
          )}

          {phase !== "setup" && (
            <>
              {/* scoreboard */}
              <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
                {solo ? (
                  <>
                    <span className="chip">🎯 Moves: {moves}</span>
                    {best !== null && <span className="chip">🏆 Best: {best}</span>}
                  </>
                ) : (
                  scores.map((s, i) => {
                    const f = PLAYER_FLAVORS[i];
                    const active = phase === "playing" && i === current;
                    return (
                      <span
                        key={f.name}
                        className={`chip transition-all ${
                          active ? `${f.active} shadow-bubble ring-2 ${f.ring} animate-breathe` : "opacity-75"
                        }`}
                      >
                        {f.emoji} {f.name}: {s}
                        {active && " 👈"}
                      </span>
                    );
                  })
                )}
              </div>

              {/* card grid */}
              <div className={`mx-auto grid w-fit gap-2.5 sm:gap-3 ${diff.cols}`}>
                {deck.map((card, i) => {
                  const isUp = flipped.includes(i) || matched[i];
                  return (
                    <button
                      key={card.key}
                      type="button"
                      aria-label={isUp ? `Card showing ${card.emoji}` : "Hidden card"}
                      onClick={() => flipCard(i)}
                      className="h-[72px] w-[72px] select-none sm:h-20 sm:w-20"
                      style={{ perspective: 600 }}
                    >
                      <motion.span
                        className="relative block h-full w-full"
                        style={{ transformStyle: "preserve-3d" }}
                        animate={{ rotateY: isUp ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      >
                        {/* back (face-down) */}
                        <span
                          className="absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-white bg-gradient-to-br from-blossom-100 via-cream-100 to-lav-100 shadow-plush transition-transform hover:scale-105"
                          style={{ backfaceVisibility: "hidden" }}
                        >
                          <span className="relative h-9 w-9 overflow-hidden rounded-full border border-white/80 opacity-90">
                            <Image src="/mochi/mochi-face.png" alt="" fill sizes="36px" className="object-cover" />
                          </span>
                        </span>
                        {/* front (face-up) */}
                        <span
                          className={`absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-white text-3xl shadow-plush sm:text-4xl ${
                            matched[i] ? "bg-mint-100" : "bg-white/90"
                          }`}
                          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                        >
                          {matched[i] ? (
                            <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="animate-wiggle">
                              {card.emoji}
                            </motion.span>
                          ) : (
                            card.emoji
                          )}
                        </span>
                      </motion.span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    sfx.pop();
                    setPhase("setup");
                    setMochiPose("waving");
                    setMochiMsg("Let's play! Pick your team! 💖");
                  }}
                  className="text-sm font-semibold text-cocoaSoft underline-offset-4 transition-colors hover:text-cocoa hover:underline"
                >
                  ↩ back to setup
                </button>
              </div>
            </>
          )}

          {/* winner celebration */}
          <AnimatePresence>
            {phase === "done" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/20 p-4 backdrop-blur-sm"
              >
                {confetti.map((c) => (
                  <motion.span
                    key={c.id}
                    initial={{ y: "-10vh", opacity: 0 }}
                    animate={{ y: "110vh", opacity: [0, 1, 1, 0.6], rotate: 360 }}
                    transition={{ duration: 3.4, delay: c.delay, ease: "linear", repeat: Infinity }}
                    className="pointer-events-none fixed top-0 text-2xl"
                    style={{ left: `${c.left}%` }}
                    aria-hidden
                  >
                    {c.emoji}
                  </motion.span>
                ))}

                <motion.div
                  initial={{ scale: 0.7, y: 24 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18 }}
                  className="glass-strong relative w-full max-w-md rounded-squish p-8 text-center shadow-plushLg"
                >
                  <div className="text-5xl">🏆</div>
                  <h2 className="mt-2 font-display text-3xl">
                    <span className="title-gradient">{solo ? "All pairs found!" : "We have a winner!"}</span>
                  </h2>

                  <div className="mt-5 space-y-2">
                    {solo ? (
                      <>
                        <p className="font-semibold">
                          🎯 Finished in {moves} moves
                          {best !== null && moves <= best && " — new best! ✨"}
                        </p>
                        {best !== null && <p className="text-sm text-cocoaSoft">🏅 Best on {diff.label}: {best} moves</p>}
                      </>
                    ) : (
                      [...scores.keys()]
                        .sort((x, y) => scores[y] - scores[x])
                        .map((i, rank) => {
                          const f = PLAYER_FLAVORS[i];
                          return (
                            <p key={f.name} className={`font-semibold ${rank === 0 ? "text-lg" : "text-sm text-cocoaSoft"}`}>
                              {rank === 0 ? "👑" : "💗"} {f.emoji} {f.name} — {scores[i]} pairs
                            </p>
                          );
                        })
                    )}
                  </div>

                  <div className="mt-7 flex flex-wrap justify-center gap-3">
                    <button type="button" onClick={startGame} className="btn-candy">
                      Play again! 🔁
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sfx.pop();
                        setPhase("setup");
                        setMochiPose("waving");
                        setMochiMsg("That was fun! One more round? 💕");
                      }}
                      className="btn-cloud"
                    >
                      Change setup
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
