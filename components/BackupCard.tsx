"use client";

import { useRef } from "react";
import { mochiToast } from "./MochiToaster";
import { useLang } from "@/lib/i18n";
import { exportData, importData } from "@/lib/storage";

/** Save all memories to a file and restore them on any device. */
export default function BackupCard({ onImported }: { onImported?: () => void }) {
  const { t } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);

  const save = () => {
    const bundle = exportData();
    const blob = new Blob([JSON.stringify(bundle)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dear-memory-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
    mochiToast(t.backup.exportedTitle, t.backup.exportedBody, "💾");
  };

  const restore = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const { memories } = importData(data);
      mochiToast(t.backup.importedTitle, t.backup.importedBody(memories), "💌");
      onImported?.();
    } catch {
      mochiToast(t.backup.importErrorTitle, t.backup.importErrorBody, "🥺");
    }
  };

  return (
    <section className="mt-12">
      <div className="plush-card flex flex-col items-center gap-3 p-6 text-center">
        <span className="text-3xl">💾</span>
        <h2 className="font-display text-xl">{t.backup.title}</h2>
        <p className="max-w-md text-sm text-cocoaSoft">{t.backup.blurb}</p>
        <div className="mt-1 flex flex-wrap justify-center gap-3">
          <button onClick={save} className="btn-candy !px-6 !py-2.5 !text-sm">
            {t.backup.export}
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-cloud !px-6 !py-2.5 !text-sm">
            {t.backup.import}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              restore(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </section>
  );
}
