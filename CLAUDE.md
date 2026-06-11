# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Despite the repository name (`stock-auto-analyzer`), this is **Dear Memory** — a kawaii memory-keeping web app (Korean-style photobooth, filters, scrapbook, timeline, time capsules) starring the **Mochi Dino** mascot. Next.js 15 (App Router) · TypeScript · Tailwind CSS · Framer Motion.

## Commands

```bash
npm install
npm run dev        # dev server at http://localhost:3000
npm run build      # production build
npm run lint       # next lint (ESLint)
npm run typecheck  # tsc --noEmit
```

There is no test suite. Use `npm run typecheck` and `npm run build` to verify changes.

## Architecture

**Everything runs in the browser.** There is no backend, no API routes, no database, and no accounts. All persistence is `localStorage` (keys namespaced `dear-memory.*`), accessed exclusively through `lib/storage.ts` — never touch `localStorage` directly elsewhere. `writeJson` returns `false` when storage is full so callers can react.

**Pages are thin server shells; components do the work.** Each route in `app/` is a small server component that renders a `"use client"` component from `components/`. All of `components/` and most of `lib/` is client-side (`"use client"`). The path alias `@/*` maps to the repo root.

**Data model** lives in `lib/types.ts`: `Memory` (a saved photo strip, stored as a composited JPEG data URL), `TimeCapsule`, `AchievementState`. Sticker positions (`PlacedSticker`) are stored as *fractions* (0..1) of strip width/height, not pixels.

**Canvas compositing pipeline** (the core of the photobooth):
- `lib/strip.ts` — captures video frames (`captureFrame`) and composites the final keepsake strip (`composeStrip`): photos + frame color + caption + stickers → JPEG data URL. Strip geometry constants are in the exported `STRIP` object.
- `lib/gif.ts` — same photos → looping GIF via `gifenc` (types in `types/gifenc.d.ts`).
- `lib/filters.ts` — single source of truth for filters and frame colors. Each filter is a CSS `filter` string used **both** for the live `<video>` preview and for canvas compositing (`ctx.filter`), so preview and output always match. Adding a filter means: add the `FilterId` union member in `types.ts`, add the entry in `FILTERS`, and add the matching `.filter-*` class in `app/globals.css`.

**`components/PhotoboothFlow.tsx` (~900 lines) is the main feature** — a stage machine (`setup → capture → decorate → done`) handling camera access, countdown auto-capture, retakes, gallery upload, decoration, save/share/GIF export. It has a demo mode that generates pastel placeholder frames when no camera is available; keep that path working.

**Catalogs over hardcoding:** stickers (`lib/stickers.ts`), categories (`lib/categories.ts`), achievements (`ACHIEVEMENTS` in `lib/storage.ts`), and Mochi's dialogue (`MOCHI_LINES` in `lib/mochi.ts`) are all data-driven lists. Extend the catalog rather than special-casing.

**Toasts** are fired from anywhere via `mochiToast(title, body?, emoji?)` from `components/MochiToaster.tsx`, which dispatches a `mochi-toast` CustomEvent on `window`; the toaster in `app/layout.tsx` listens and renders.

**Sounds** (`lib/sounds.ts`) are synthesized with the Web Audio API — no audio files. Only trigger them from user gestures, and respect the mute flag (`isMuted`/`setMuted`).

## Brand rules (important)

- **Mochi Dino artwork is never redrawn, regenerated, or restyled.** Always render the official PNGs from `public/mochi/` (the brand sheets live in `docs/brand/`). Poses are mapped in `MOCHI_ART` in `lib/mochi.ts`; in-strip Mochi stickers use `kind: "mochi"` entries in `lib/stickers.ts`.
- Mochi's voice is gentle, cheerful, a little clumsy, always supportive. New dialogue belongs in `MOCHI_LINES`, matching the existing tone (emoji included).
- The visual language is pastel/kawaii: custom Tailwind palette (`mint`, `blossom`, `cream`, `lav`, `skyy`, `cocoa`), `shadow-plush`/`shadow-bubble`, `rounded-squish`, and ambient animations (`floaty`, `breathe`, `twinkle`, `wiggle`, `pop`) defined in `tailwind.config.ts`. Fonts are Baloo 2 (display) and Quicksand (body), loaded via `next/font` CSS variables in `app/layout.tsx`.
