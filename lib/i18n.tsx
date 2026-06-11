"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * Lightweight TH/EN i18n. The English object is the source of truth for
 * the shape; Thai must provide every key. Components read strings via
 * useLang().t — never hardcoded.
 */

const en = {
  dateLocale: "en-US",
  nav: {
    home: "Home",
    photobooth: "Photobooth",
    scrapbook: "Scrapbook",
    timeline: "Timeline",
    capsule: "Time Capsule",
    premium: "Premium"
  },
  mochi: {
    greeting: "Hi friend! 💖",
    welcomeBack: "Welcome back! I missed you! 💖",
    beforePhoto: "Let's make something beautiful today.",
    countdown: "3...2...1... Smileeee! 📸",
    afterPhoto: "These memories are so precious! ✨",
    loading: "Packing your memories... 💌",
    emptyState: "Let's create your first memory.",
    decorating: "Sprinkle a little magic on it! 🎀",
    timelineEnd: "Look how far we've come! 🥹",
    capsulePrompt: "What would you tell future you? 💭",
    capsuleWaiting: "Shhh... it's not time yet! 🤫",
    capsuleOpen: "A letter from the past, just for you! 💌"
  },
  hero: {
    chip: "🦕 Mochi Dino is waiting for you",
    title1: "Some moments ",
    titleHi: "only happen once.",
    subtitle: "Let's keep this one forever.",
    ctaSave: "📸 Save A Memory",
    ctaExplore: "💖 Explore Memories"
  },
  home: {
    categoriesTitle: "What kind of moment is it?",
    categoriesSub: "Every memory has its own little home in your scrapbook.",
    featuresTitle1: "A whole world of ",
    featuresTitleHi: "memory magic",
    features: [
      {
        emoji: "📸",
        title: "Korean Photobooth",
        body: "Countdown, auto-capture, dreamy filters, and 4 or 6 photo strips — just like your favorite booth in Seoul.",
        cta: "Take photos"
      },
      {
        emoji: "🎀",
        title: "Decorate Everything",
        body: "Hearts, bows, flowers, sparkles, and real Mochi Dino stickers. Drag, drop, sprinkle magic.",
        cta: "Start decorating"
      },
      {
        emoji: "📖",
        title: "Scrapbook Mode",
        body: "Every memory lands in a treasured diary. Write little notes so future you remembers everything.",
        cta: "Open scrapbook"
      },
      {
        emoji: "🌸",
        title: "Memory Timeline",
        body: "Watch your story bloom month by month — a soft, nostalgic walk through everything you saved.",
        cta: "See timeline"
      },
      {
        emoji: "⏳",
        title: "Time Capsule",
        body: "Seal a letter for 6 months, 1 year, or 5 years. When it opens, past-you says hello.",
        cta: "Seal a capsule"
      },
      {
        emoji: "👑",
        title: "Premium Magic",
        body: "AI frames, AI stickers, exclusive themes, and rare Mochi costumes for super-memory-keepers.",
        cta: "See premium"
      }
    ],
    meetTitle1: "Meet ",
    meetTitle2: " — your memory buddy 🦕",
    meetBody:
      "Gentle, cheerful, slightly clumsy, and completely in love with photos. Mochi welcomes you, counts you down, cheers for you, and keeps every memory safe in his little heart backpack.",
    expressions: { happy: "Happy", excited: "Excited", waving: "Waving", curious: "Curious" },
    teaserSewing: "🧵 Mochi is sewing this…",
    teaserSoon: "✨ Coming soon",
    teaser1Title: "Long Distance Mode",
    teaser1Body:
      "Take photos together from different cities, in the same booth, at the same moment. Distance is no match for best friends.",
    teaser2Title: "AI Sticker & Frame Studio",
    teaser2Body:
      "Turn selfies into kawaii stickers and chibi characters, and dream up frames for birthdays, graduations, and girls' trips."
  },
  categories: {
    love: { label: "With Someone I Love", blurb: "Every heartbeat, kept safe forever." },
    "best-friends": { label: "Best Friend Memories", blurb: "The laughs nobody else would get." },
    birthday: { label: "Birthday Memories", blurb: "Candles, wishes, and cake-smudged smiles." },
    graduation: { label: "Graduation Memories", blurb: "The day everything you worked for bloomed." },
    family: { label: "Family Memories", blurb: "Home is a feeling, not a place." },
    travel: { label: "Travel Memories", blurb: "Little adventures, big feelings." },
    everyday: { label: "Everyday Moments", blurb: "Ordinary days are secretly the best ones." },
    "before-everything-changes": {
      label: "Before Everything Changes",
      blurb: "Hold this moment a little tighter."
    }
  },
  filters: {
    none: "Natural",
    "korean-beauty": "Korean Beauty",
    "soft-skin": "Soft Skin",
    "peach-cream": "Peach Cream",
    "milk-tea": "Milk Tea",
    "dreamy-glow": "Dreamy Glow",
    "fairy-glow": "Fairy Glow",
    "kawaii-pink": "Kawaii Pink",
    "cool-girl": "Cool Girl",
    "y2k-flash": "Y2K Flash",
    "vintage-film": "Vintage Film",
    "mono-film": "Mono Film",
    "anime-style": "Anime Style"
  },
  frames: {
    cream: "Cream",
    pink: "Baby Pink",
    mint: "Mint",
    lavender: "Lavender",
    sky: "Sky",
    night: "Starry Night"
  },
  achievements: {
    "first-memory": { label: "First Memory", description: "Saved your very first memory" },
    "five-memories": { label: "Memory Keeper", description: "Saved 5 precious memories" },
    "ten-memories": { label: "Memory Garden", description: "Saved 10 precious memories" },
    "first-capsule": { label: "Time Traveler", description: "Sealed your first time capsule" },
    "capsule-opened": { label: "Letter From The Past", description: "Opened a time capsule" },
    decorator: { label: "Little Decorator", description: "Added 5+ stickers to one strip" },
    "all-filters": { label: "Filter Fairy", description: "Tried every dreamy filter" }
  },
  booth: {
    title1: "The ",
    titleHi: "Photobooth",
    step1: "1 · How many photos?",
    strip4: "🎞️ 4-photo strip",
    strip6: "✨ 6-photo strip",
    step2: "2 · What kind of moment?",
    open: "Open the booth 💖",
    pickFilter: "Pick a dreamy filter, then press the pink button!",
    beautyTitle: "✨ Beauty skin",
    beautyOff: "Off",
    beautySoft: "Soft",
    beautyMax: "Extra glow",
    beautyHint: "Smooths skin only — eyes, lips & hair stay sharp. You'll see it in the captured photos!",
    retakeOne: "One more try — you got this! 🌟",
    demoTitle: "Demo mode — pretend you look adorable (you do)",
    cameraError:
      "Mochi couldn't find your camera 🥺 You can allow camera access and retry, or play in demo mode!",
    retryCamera: "🔁 Retry camera",
    demoMode: "🪄 Demo mode",
    muteTip: "Mute sounds",
    unmuteTip: "Unmute cute sounds",
    flip: "🔄 Flip camera",
    fromGallery: "🖼️ From gallery",
    start: "📸 Start",
    shooting: "Smileeee! 📸",
    shootAgain: "📸 Shoot again",
    decorate: "Decorate → 🎀",
    tapRetakeTip: "Tap to retake this one",
    waiting: "Waiting…",
    tapRetake: "Tap any photo to retake it ✨",
    photoAlt: "Photo",
    nameTitle: "Give it a name 💌",
    namePh: "our little adventure…",
    frameTitle: "Frame color 🖼️",
    stickersTitle: "Stickers 🎀",
    selected: "Selected:",
    stickerHint: "Tap a sticker to add it, then drag it anywhere on your strip ✨",
    back: "← Back",
    keep: "Keep it forever 💖",
    doneSaved: "Tucked into your scrapbook! 💌",
    doneReady: "Your strip is ready! 💌",
    stripAlt: "Your finished photo strip",
    download: "⬇️ Download",
    gif: "🎬 Memory movie (GIF)",
    gifBusy: "🎬 Filming…",
    share: "📤 Share",
    openScrapbook: "📖 Open scrapbook",
    newMemory: "✨ New memory",
    defaultTitle: "A precious moment",
    gifReadyTitle: "Your memory movie is ready!",
    gifReadyBody: "A little GIF to share everywhere ✨",
    gifFailTitle: "Oh no, the GIF got shy…",
    gifFailBody: "Please try again!",
    shareFailTitle: "Sharing isn't supported here",
    shareFailBody: "So Mochi downloaded it for you instead!",
    storageFullTitle: "Scrapbook is full!",
    storageFullBody:
      "The strip is ready to download, but Mochi couldn't store it. Try deleting old memories."
  },
  scrapbook: {
    title1: "Your ",
    titleHi: "Scrapbook",
    sub: "A treasured diary of every moment you decided to keep.",
    all: "🌈 All",
    prizes: "Mochi's little prizes 🏆",
    stillWaiting: "Still waiting… ✨",
    noteLabel: "A note for future you 💌",
    notePh: "What made this moment special?",
    saveNote: "💌 Save note",
    noteSavedTitle: "Note saved!",
    noteSavedBody: "Future you will love reading this.",
    download: "⬇️ Download",
    share: "📤 Share",
    letGo: "🥀 Let go",
    confirmDelete: "Let this memory go? Mochi will miss it… 🥺"
  },
  timeline: {
    title1: "Memory ",
    titleHi: "Timeline",
    sub: "Your story, blooming month by month."
  },
  capsule: {
    title1: "Time ",
    titleHi: "Capsule",
    sub: "Write a letter to future you. Seal it. Forget it. Then one day… a hello from the past.",
    letterLabel: "Your letter 💌",
    letterPh: "Dear future me… right now, life feels like…",
    fromLabel: "From",
    fromPh: "your name (or a secret nickname)",
    fromDefault: "past you",
    openIn: "Open it in…",
    durations: ["1 minute (just to try ✨)", "6 months", "1 year", "5 years"],
    seal: "⏳ Seal it with love",
    sealedToastTitle: "Sealed with love!",
    sealedToastBody: "Future you will smile! ⏳",
    emptyTitle: "Write a little something first!",
    emptyBody: "Even one sentence is a treasure.",
    yourLetters: "Your sealed letters",
    none: "No capsules yet — your first letter to the future is waiting to be written.",
    fromWord: "From",
    openedHint: "Opened — read it again anytime",
    read: "Read",
    openNow: "Open!",
    sealedBtn: "Sealed",
    deleteTip: "Delete capsule",
    deleteConfirm: "Throw this capsule away forever? 🥺",
    sealedOn: "Sealed on",
    ready: "Ready to open!",
    minutesToGo: (n: number) => `${n} minute${n === 1 ? "" : "s"} to go`,
    hoursToGo: (n: number) => `${n} hours to go`,
    daysToGo: (n: number) => `${n} days to go`,
    monthsToGo: (n: number) => `${n} months to go`,
    yearsToGo: (n: string) => `${n} years to go`
  },
  premium: {
    title1: "Dear Memory ",
    titleHi: "Premium",
    sub: "For super-memory-keepers who want a little extra magic.",
    freeName: "Little Sprout 🌱",
    freePrice: "Free",
    freePeriod: "forever",
    freeItems: [
      "📸 Full Korean photobooth (4 & 6 strips)",
      "🌷 All 7 dreamy filters",
      "🎀 Hearts, stars, bows & Mochi stickers",
      "📖 Scrapbook & memory timeline",
      "⏳ Time capsules",
      "🎬 GIF memory movies",
      "📤 Instant sharing",
      "⬇️ Unlimited downloads"
    ],
    freeCta: "Start saving memories",
    fav: "✨ Mochi's favorite",
    proName: "Memory Fairy 🧚",
    proPeriod: "/ month",
    proItems: [
      "🪄 AI Sticker Generator — selfies → kawaii stickers & chibis",
      "🖼️ AI Frame Generator — birthdays, graduations, girls' trips",
      "🌌 AI Backgrounds — cherry blossom parks, cozy cafés, starry skies",
      "💞 Long Distance Mode — shared booths across cities",
      "🎬 Cinematic memory movies — Reels & TikTok exports",
      "👗 Rare Mochi Dino costumes & seasonal themes"
    ],
    proCta: "🧵 Mochi is sewing this — coming soon",
    proCtaTip: "Premium launches soon",
    proNote:
      "Premium (with Stripe checkout) launches with the AI studio. No payments are collected yet."
  },
  footer: {
    tagline: "Mochi Dino is always here for you! 💚",
    blurb:
      "Dear Memory — a magical little world where the moments you never want to lose become treasures.",
    save: "📸 Save A Memory",
    scrapbook: "📖 Scrapbook",
    capsule: "⏳ Time Capsule",
    madeWith: "Made with 💖, sparkles, and one very gentle dinosaur."
  }
};

const th: Dict = {
  dateLocale: "th-TH",
  nav: {
    home: "หน้าแรก",
    photobooth: "โฟโต้บูธ",
    scrapbook: "สมุดความทรงจำ",
    timeline: "ไทม์ไลน์",
    capsule: "แคปซูลเวลา",
    premium: "พรีเมียม"
  },
  mochi: {
    greeting: "หวัดดีเพื่อนรัก! 💖",
    welcomeBack: "กลับมาแล้ว! โมจิคิดถึงจังเลย! 💖",
    beforePhoto: "วันนี้มาสร้างอะไรน่ารักๆ กันเถอะ",
    countdown: "3...2...1... ยิ้มมม! 📸",
    afterPhoto: "ความทรงจำนี้ล้ำค่าที่สุดเลย! ✨",
    loading: "กำลังห่อความทรงจำของคุณ... 💌",
    emptyState: "มาสร้างความทรงจำแรกกันเถอะ",
    decorating: "โรยเวทมนตร์ลงไปหน่อยนะ! 🎀",
    timelineEnd: "ดูสิ เรามาไกลกันขนาดนี้แล้ว! 🥹",
    capsulePrompt: "อยากบอกอะไรกับตัวเองในอนาคต? 💭",
    capsuleWaiting: "จุ๊ๆ... ยังไม่ถึงเวลานะ! 🤫",
    capsuleOpen: "จดหมายจากอดีต ส่งถึงคุณโดยเฉพาะ! 💌"
  },
  hero: {
    chip: "🦕 โมจิไดโนกำลังรอคุณอยู่",
    title1: "บางช่วงเวลา ",
    titleHi: "เกิดขึ้นแค่ครั้งเดียว",
    subtitle: "มาเก็บช่วงเวลานี้ไว้ตลอดไปกันเถอะ",
    ctaSave: "📸 เก็บความทรงจำ",
    ctaExplore: "💖 ดูความทรงจำ"
  },
  home: {
    categoriesTitle: "วันนี้เป็นช่วงเวลาแบบไหนนะ?",
    categoriesSub: "ทุกความทรงจำมีบ้านหลังเล็กๆ ของตัวเองในสมุดของคุณ",
    featuresTitle1: "โลกทั้งใบของ",
    featuresTitleHi: "เวทมนตร์ความทรงจำ",
    features: [
      {
        emoji: "📸",
        title: "โฟโต้บูธสไตล์เกาหลี",
        body: "นับถอยหลัง ถ่ายอัตโนมัติ ฟิลเตอร์ฝันๆ และสตริป 4 หรือ 6 รูป — เหมือนตู้โปรดของคุณที่โซลเลย",
        cta: "ไปถ่ายรูปกัน"
      },
      {
        emoji: "🎀",
        title: "ตกแต่งได้ทุกอย่าง",
        body: "หัวใจ โบว์ ดอกไม้ ประกายวิบวับ และสติกเกอร์โมจิไดโนตัวจริง ลาก วาง โรยเวทมนตร์",
        cta: "เริ่มตกแต่ง"
      },
      {
        emoji: "📖",
        title: "สมุดความทรงจำ",
        body: "ทุกความทรงจำถูกเก็บลงไดอารี่สุดหวง เขียนโน้ตเล็กๆ ไว้ให้ตัวเองในอนาคตได้อ่าน",
        cta: "เปิดสมุด"
      },
      {
        emoji: "🌸",
        title: "ไทม์ไลน์ความทรงจำ",
        body: "ดูเรื่องราวของคุณค่อยๆ ผลิบานทีละเดือน — เดินย้อนความหลังแบบนุ่มๆ ฟุ้งๆ",
        cta: "ดูไทม์ไลน์"
      },
      {
        emoji: "⏳",
        title: "แคปซูลเวลา",
        body: "ผนึกจดหมายไว้ 6 เดือน 1 ปี หรือ 5 ปี พอเปิดออก ตัวคุณในอดีตจะมาทักทาย",
        cta: "ผนึกแคปซูล"
      },
      {
        emoji: "👑",
        title: "เวทมนตร์พรีเมียม",
        body: "เฟรม AI สติกเกอร์ AI ธีมพิเศษ และชุดแต่งตัวโมจิหายาก สำหรับนักเก็บความทรงจำตัวยง",
        cta: "ดูพรีเมียม"
      }
    ],
    meetTitle1: "มารู้จัก ",
    meetTitle2: " — เพื่อนรักนักเก็บความทรงจำ 🦕",
    meetBody:
      "อ่อนโยน ร่าเริง ซุ่มซ่ามนิดๆ และหลงรักการถ่ายรูปสุดหัวใจ โมจิคอยต้อนรับคุณ นับถอยหลังให้ เชียร์คุณ และเก็บทุกความทรงจำไว้ในเป้หัวใจใบเล็กของเขา",
    expressions: { happy: "มีความสุข", excited: "ตื่นเต้น", waving: "ทักทาย", curious: "สงสัยจัง" },
    teaserSewing: "🧵 โมจิกำลังเย็บอยู่…",
    teaserSoon: "✨ เร็วๆ นี้",
    teaser1Title: "โหมดรักทางไกล",
    teaser1Body:
      "ถ่ายรูปด้วยกันจากคนละเมือง ในตู้เดียวกัน ในจังหวะเดียวกัน ระยะทางทำอะไรเพื่อนซี้ไม่ได้หรอก",
    teaser2Title: "สตูดิโอ AI สติกเกอร์ & เฟรม",
    teaser2Body:
      "เปลี่ยนเซลฟี่เป็นสติกเกอร์คาวาอี้และตัวการ์ตูนจิบิ พร้อมเฟรมในฝันสำหรับวันเกิด รับปริญญา และทริปสาวๆ"
  },
  categories: {
    love: { label: "กับคนที่รัก", blurb: "ทุกจังหวะหัวใจ เก็บไว้ตลอดกาล" },
    "best-friends": { label: "กับเพื่อนซี้", blurb: "มุกที่ขำกันแค่พวกเรา" },
    birthday: { label: "วันเกิด", blurb: "เทียน คำอธิษฐาน และรอยยิ้มเปื้อนเค้ก" },
    graduation: { label: "วันรับปริญญา", blurb: "วันที่ความพยายามทั้งหมดผลิบาน" },
    family: { label: "ครอบครัว", blurb: "บ้านคือความรู้สึก ไม่ใช่สถานที่" },
    travel: { label: "ทริปเที่ยว", blurb: "การผจญภัยเล็กๆ ความรู้สึกใหญ่ๆ" },
    everyday: { label: "วันธรรมดาๆ", blurb: "วันธรรมดาแอบเป็นวันที่ดีที่สุดเสมอ" },
    "before-everything-changes": {
      label: "ก่อนทุกอย่างจะเปลี่ยนไป",
      blurb: "กอดช่วงเวลานี้ไว้แน่นๆ อีกนิดนะ"
    }
  },
  filters: {
    none: "ธรรมชาติ",
    "korean-beauty": "บิวตี้เกาหลี",
    "soft-skin": "ผิวเนียนนุ่ม",
    "peach-cream": "พีชครีม",
    "milk-tea": "ชานม",
    "dreamy-glow": "ดรีมมี่โกลว์",
    "fairy-glow": "แฟรี่โกลว์",
    "kawaii-pink": "ชมพูคาวาอี้",
    "cool-girl": "คูลเกิร์ล",
    "y2k-flash": "แฟลช Y2K",
    "vintage-film": "ฟิล์มวินเทจ",
    "mono-film": "ฟิล์มขาวดำ",
    "anime-style": "สไตล์อนิเมะ"
  },
  frames: {
    cream: "ครีม",
    pink: "ชมพูเบบี้",
    mint: "มินต์",
    lavender: "ลาเวนเดอร์",
    sky: "ฟ้าใส",
    night: "คืนดาวพราว"
  },
  achievements: {
    "first-memory": { label: "ความทรงจำแรก", description: "เก็บความทรงจำแรกของคุณสำเร็จ" },
    "five-memories": { label: "นักเก็บความทรงจำ", description: "เก็บครบ 5 ความทรงจำแล้ว" },
    "ten-memories": { label: "สวนความทรงจำ", description: "เก็บครบ 10 ความทรงจำแล้ว" },
    "first-capsule": { label: "นักเดินทางข้ามเวลา", description: "ผนึกแคปซูลเวลาใบแรกแล้ว" },
    "capsule-opened": { label: "จดหมายจากอดีต", description: "เปิดแคปซูลเวลาแล้ว" },
    decorator: { label: "นักตกแต่งตัวน้อย", description: "แปะสติกเกอร์ 5 ชิ้นขึ้นไปในแผ่นเดียว" },
    "all-filters": { label: "นางฟ้าฟิลเตอร์", description: "ลองครบทุกฟิลเตอร์แล้ว" }
  },
  booth: {
    title1: "",
    titleHi: "โฟโต้บูธ",
    step1: "1 · ถ่ายกี่รูปดี?",
    strip4: "🎞️ สตริป 4 รูป",
    strip6: "✨ สตริป 6 รูป",
    step2: "2 · เป็นช่วงเวลาแบบไหน?",
    open: "เปิดตู้ถ่ายรูป 💖",
    pickFilter: "เลือกฟิลเตอร์ฝันๆ แล้วกดปุ่มสีชมพูเลย!",
    beautyTitle: "✨ ผิวสวย",
    beautyOff: "ปิด",
    beautySoft: "เนียน",
    beautyMax: "เนียนใสสุดๆ",
    beautyHint: "เกลี่ยเฉพาะผิว — ตา ปาก ผมยังคมชัด เห็นผลในรูปที่ถ่ายเลย!",
    retakeOne: "อีกครั้งเดียว — สู้ๆ นะ! 🌟",
    demoTitle: "โหมดทดลอง — ทำเป็นว่าคุณน่ารักมาก (ซึ่งจริง)",
    cameraError:
      "โมจิหากล้องของคุณไม่เจอ 🥺 ลองอนุญาตให้ใช้กล้องแล้วกดลองใหม่ หรือเล่นโหมดทดลองก็ได้นะ!",
    retryCamera: "🔁 ลองกล้องอีกครั้ง",
    demoMode: "🪄 โหมดทดลอง",
    muteTip: "ปิดเสียง",
    unmuteTip: "เปิดเสียงน่ารักๆ",
    flip: "🔄 สลับกล้อง",
    fromGallery: "🖼️ เลือกจากแกลเลอรี",
    start: "📸 เริ่มถ่าย",
    shooting: "ยิ้มมม! 📸",
    shootAgain: "📸 ถ่ายใหม่ทั้งชุด",
    decorate: "ไปตกแต่ง → 🎀",
    tapRetakeTip: "แตะเพื่อถ่ายรูปนี้ใหม่",
    waiting: "รอแป๊บนะ…",
    tapRetake: "แตะรูปไหนก็ได้เพื่อถ่ายใหม่ ✨",
    photoAlt: "รูปที่",
    nameTitle: "ตั้งชื่อให้หน่อย 💌",
    namePh: "การผจญภัยเล็กๆ ของเรา…",
    frameTitle: "สีกรอบ 🖼️",
    stickersTitle: "สติกเกอร์ 🎀",
    selected: "ที่เลือก:",
    stickerHint: "แตะสติกเกอร์เพื่อเพิ่ม แล้วลากไปวางตรงไหนก็ได้บนสตริป ✨",
    back: "← ย้อนกลับ",
    keep: "เก็บไว้ตลอดไป 💖",
    doneSaved: "เก็บลงสมุดความทรงจำแล้ว! 💌",
    doneReady: "สตริปของคุณเสร็จแล้ว! 💌",
    stripAlt: "สตริปรูปถ่ายของคุณ",
    download: "⬇️ ดาวน์โหลด",
    gif: "🎬 หนังความทรงจำ (GIF)",
    gifBusy: "🎬 กำลังถ่ายทำ…",
    share: "📤 แชร์",
    openScrapbook: "📖 เปิดสมุดความทรงจำ",
    newMemory: "✨ ความทรงจำใหม่",
    defaultTitle: "ช่วงเวลาล้ำค่า",
    gifReadyTitle: "หนังความทรงจำของคุณเสร็จแล้ว!",
    gifReadyBody: "GIF น้อยๆ พร้อมแชร์ทุกที่ ✨",
    gifFailTitle: "แย่แล้ว GIF เขินอาย…",
    gifFailBody: "ลองอีกครั้งนะ!",
    shareFailTitle: "อุปกรณ์นี้แชร์ตรงๆ ไม่ได้",
    shareFailBody: "โมจิเลยดาวน์โหลดให้แทนแล้วนะ!",
    storageFullTitle: "สมุดความทรงจำเต็มแล้ว!",
    storageFullBody: "สตริปพร้อมดาวน์โหลด แต่โมจิเก็บลงสมุดไม่ไหว ลองลบความทรงจำเก่าๆ ดูนะ"
  },
  scrapbook: {
    title1: "",
    titleHi: "สมุดความทรงจำ",
    sub: "ไดอารี่สุดหวงของทุกช่วงเวลาที่คุณตัดสินใจเก็บไว้",
    all: "🌈 ทั้งหมด",
    prizes: "รางวัลเล็กๆ จากโมจิ 🏆",
    stillWaiting: "ยังรออยู่นะ… ✨",
    noteLabel: "โน้ตถึงตัวคุณในอนาคต 💌",
    notePh: "อะไรทำให้ช่วงเวลานี้พิเศษ?",
    saveNote: "💌 บันทึกโน้ต",
    noteSavedTitle: "บันทึกโน้ตแล้ว!",
    noteSavedBody: "ตัวคุณในอนาคตจะต้องชอบมากแน่ๆ",
    download: "⬇️ ดาวน์โหลด",
    share: "📤 แชร์",
    letGo: "🥀 ปล่อยไป",
    confirmDelete: "จะปล่อยความทรงจำนี้ไปจริงๆ หรอ? โมจิจะคิดถึงนะ… 🥺"
  },
  timeline: {
    title1: "ไทม์ไลน์",
    titleHi: "ความทรงจำ",
    sub: "เรื่องราวของคุณ ผลิบานทีละเดือน"
  },
  capsule: {
    title1: "แคปซูล",
    titleHi: "เวลา",
    sub: "เขียนจดหมายถึงตัวเองในอนาคต ผนึกไว้ ลืมมันไป แล้ววันหนึ่ง… อดีตจะมาทักทาย",
    letterLabel: "จดหมายของคุณ 💌",
    letterPh: "ถึงฉันในอนาคต… ตอนนี้ชีวิตรู้สึกเหมือน…",
    fromLabel: "จาก",
    fromPh: "ชื่อของคุณ (หรือชื่อลับๆ ก็ได้)",
    fromDefault: "ตัวคุณในอดีต",
    openIn: "เปิดได้ในอีก…",
    durations: ["1 นาที (ลองเล่นดู ✨)", "6 เดือน", "1 ปี", "5 ปี"],
    seal: "⏳ ผนึกด้วยรัก",
    sealedToastTitle: "ผนึกด้วยรักเรียบร้อย!",
    sealedToastBody: "ตัวคุณในอนาคตจะต้องยิ้มแน่ๆ! ⏳",
    emptyTitle: "เขียนอะไรสักนิดก่อนนะ!",
    emptyBody: "แค่ประโยคเดียวก็เป็นสมบัติล้ำค่าแล้ว",
    yourLetters: "จดหมายที่ผนึกไว้",
    none: "ยังไม่มีแคปซูลเลย — จดหมายฉบับแรกถึงอนาคตกำลังรอให้คุณเขียนอยู่นะ",
    fromWord: "จาก",
    openedHint: "เปิดแล้ว — กลับมาอ่านอีกได้เสมอ",
    read: "อ่าน",
    openNow: "เปิดเลย!",
    sealedBtn: "ผนึกอยู่",
    deleteTip: "ลบแคปซูล",
    deleteConfirm: "จะทิ้งแคปซูลนี้ไปตลอดกาลจริงๆ หรอ? 🥺",
    sealedOn: "ผนึกเมื่อ",
    ready: "เปิดได้แล้ว!",
    minutesToGo: (n: number) => `อีก ${n} นาที`,
    hoursToGo: (n: number) => `อีก ${n} ชั่วโมง`,
    daysToGo: (n: number) => `อีก ${n} วัน`,
    monthsToGo: (n: number) => `อีก ${n} เดือน`,
    yearsToGo: (n: string) => `อีก ${n} ปี`
  },
  premium: {
    title1: "Dear Memory ",
    titleHi: "พรีเมียม",
    sub: "สำหรับนักเก็บความทรงจำตัวยงที่อยากได้เวทมนตร์เพิ่มอีกนิด",
    freeName: "ต้นกล้าน้อย 🌱",
    freePrice: "ฟรี",
    freePeriod: "ตลอดไป",
    freeItems: [
      "📸 โฟโต้บูธเกาหลีเต็มรูปแบบ (สตริป 4 และ 6 รูป)",
      "🌷 ฟิลเตอร์ฝันๆ ครบทั้ง 7 แบบ",
      "🎀 หัวใจ ดาว โบว์ และสติกเกอร์โมจิ",
      "📖 สมุดความทรงจำ & ไทม์ไลน์",
      "⏳ แคปซูลเวลา",
      "🎬 หนังความทรงจำ GIF",
      "📤 แชร์ได้ทันที",
      "⬇️ ดาวน์โหลดไม่จำกัด"
    ],
    freeCta: "เริ่มเก็บความทรงจำ",
    fav: "✨ โมจิชอบอันนี้ที่สุด",
    proName: "นางฟ้าความทรงจำ 🧚",
    proPeriod: "/ เดือน",
    proItems: [
      "🪄 AI สร้างสติกเกอร์ — เซลฟี่ → สติกเกอร์คาวาอี้ & จิบิ",
      "🖼️ AI สร้างเฟรม — วันเกิด รับปริญญา ทริปสาวๆ",
      "🌌 AI สร้างฉากหลัง — สวนซากุระ คาเฟ่อบอุ่น ท้องฟ้าดาวพราว",
      "💞 โหมดรักทางไกล — ตู้ถ่ายรูปร่วมกันข้ามเมือง",
      "🎬 หนังความทรงจำระดับซีเนม่า — ส่งออก Reels & TikTok",
      "👗 ชุดแต่งตัวโมจิหายาก & ธีมตามฤดูกาล"
    ],
    proCta: "🧵 โมจิกำลังเย็บอยู่ — เร็วๆ นี้",
    proCtaTip: "พรีเมียมเปิดตัวเร็วๆ นี้",
    proNote: "พรีเมียม (พร้อมชำระเงินผ่าน Stripe) จะเปิดตัวพร้อมสตูดิโอ AI ตอนนี้ยังไม่มีการเก็บเงินใดๆ"
  },
  footer: {
    tagline: "โมจิไดโนอยู่ตรงนี้เสมอนะ! 💚",
    blurb: "Dear Memory — โลกเวทมนตร์ใบเล็กๆ ที่ช่วงเวลาที่คุณไม่อยากสูญเสีย กลายเป็นสมบัติล้ำค่า",
    save: "📸 เก็บความทรงจำ",
    scrapbook: "📖 สมุดความทรงจำ",
    capsule: "⏳ แคปซูลเวลา",
    madeWith: "สร้างด้วย 💖 ประกายวิบวับ และไดโนเสาร์ใจดีหนึ่งตัว"
  }
};

export type Dict = typeof en;
export type Lang = "en" | "th";

const DICTS: Record<Lang, Dict> = { en, th };
const LANG_KEY = "dear-memory.lang";

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Dict;
}

const LangContext = createContext<LangContextValue>({
  lang: "en",
  setLang: () => {},
  t: en
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(LANG_KEY) as Lang | null;
    if (saved === "en" || saved === "th") {
      setLangState(saved);
    } else if (navigator.language?.toLowerCase().startsWith("th")) {
      setLangState("th");
    }
  }, []);

  const setLang = (next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(LANG_KEY, next);
    document.documentElement.lang = next;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t: DICTS[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
