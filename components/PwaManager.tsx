"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Registers the service worker (offline support) and surfaces a cute
 * "install app" button when the browser offers it.
 */
export default function PwaManager() {
  const { t } = useLang();
  const [installEvt, setInstallEvt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as InstallPromptEvent);
    };
    const onInstalled = () => setInstallEvt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!installEvt) return null;

  return (
    <button
      onClick={async () => {
        await installEvt.prompt();
        await installEvt.userChoice;
        setInstallEvt(null);
      }}
      className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full glass-strong px-4 py-2.5 font-display text-sm text-cocoa shadow-plushLg transition-transform hover:scale-105 active:scale-95"
    >
      📲 {t.pwa.install}
    </button>
  );
}
