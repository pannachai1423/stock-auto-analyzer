"use client";

import type { Memory, TimeCapsule, AchievementState } from "./types";

const MEMORIES_KEY = "dear-memory.memories";
const CAPSULES_KEY = "dear-memory.capsules";
const ACHIEVEMENTS_KEY = "dear-memory.achievements";
const VISITED_KEY = "dear-memory.visited";

const isBrowser = () => typeof window !== "undefined";

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // storage full — caller may retire old entries and retry
    return false;
  }
}

/* ---------------- memories ---------------- */

export function loadMemories(): Memory[] {
  return readJson<Memory[]>(MEMORIES_KEY, []).sort((a, b) => b.createdAt - a.createdAt);
}

export function saveMemory(memory: Memory): boolean {
  const all = loadMemories();
  return writeJson(MEMORIES_KEY, [memory, ...all.filter((m) => m.id !== memory.id)]);
}

export function updateMemory(id: string, patch: Partial<Memory>): void {
  const all = loadMemories().map((m) => (m.id === id ? { ...m, ...patch } : m));
  writeJson(MEMORIES_KEY, all);
}

export function deleteMemory(id: string): void {
  writeJson(
    MEMORIES_KEY,
    loadMemories().filter((m) => m.id !== id)
  );
}

/* ---------------- time capsules ---------------- */

export function loadCapsules(): TimeCapsule[] {
  return readJson<TimeCapsule[]>(CAPSULES_KEY, []).sort((a, b) => a.opensAt - b.opensAt);
}

export function saveCapsule(capsule: TimeCapsule): void {
  const all = loadCapsules();
  writeJson(CAPSULES_KEY, [...all.filter((c) => c.id !== capsule.id), capsule]);
}

export function deleteCapsule(id: string): void {
  writeJson(
    CAPSULES_KEY,
    loadCapsules().filter((c) => c.id !== id)
  );
}

/* ---------------- achievements ---------------- */

export interface AchievementDef {
  id: string;
  emoji: string;
  label: string;
  description: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-memory", emoji: "🌱", label: "First Memory", description: "Saved your very first memory" },
  { id: "five-memories", emoji: "🌷", label: "Memory Keeper", description: "Saved 5 precious memories" },
  { id: "ten-memories", emoji: "🌸", label: "Memory Garden", description: "Saved 10 precious memories" },
  { id: "first-capsule", emoji: "⏳", label: "Time Traveler", description: "Sealed your first time capsule" },
  { id: "capsule-opened", emoji: "💌", label: "Letter From The Past", description: "Opened a time capsule" },
  { id: "decorator", emoji: "🎀", label: "Little Decorator", description: "Added 5+ stickers to one strip" },
  { id: "all-filters", emoji: "🧚", label: "Filter Fairy", description: "Tried every dreamy filter" }
];

export function loadAchievements(): AchievementState[] {
  return readJson<AchievementState[]>(ACHIEVEMENTS_KEY, []);
}

/** Returns the definition if this unlock is new, otherwise null. */
export function unlockAchievement(id: string): AchievementDef | null {
  const all = loadAchievements();
  if (all.some((a) => a.id === id)) return null;
  const def = ACHIEVEMENTS.find((a) => a.id === id);
  if (!def) return null;
  writeJson(ACHIEVEMENTS_KEY, [...all, { id, unlockedAt: Date.now() }]);
  return def;
}

/* ---------------- visits ---------------- */

/** true if the visitor has been here before (used for Mochi's welcome-back line) */
export function isReturningVisitor(): boolean {
  if (!isBrowser()) return false;
  const seen = window.localStorage.getItem(VISITED_KEY);
  window.localStorage.setItem(VISITED_KEY, String(Date.now()));
  return Boolean(seen);
}

export const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
