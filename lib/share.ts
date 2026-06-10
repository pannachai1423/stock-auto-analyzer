"use client";

/**
 * Shares an image via the Web Share API (Instagram, LINE, TikTok, etc.
 * on mobile). Returns false when sharing isn't available so callers can
 * fall back to a download.
 */
export async function shareImage(
  dataUrl: string,
  filename: string,
  title: string
): Promise<boolean> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], filename, { type: blob.type });
    const nav = navigator as Navigator & {
      canShare?: (data: ShareData) => boolean;
      share?: (data: ShareData) => Promise<void>;
    };
    if (nav.canShare?.({ files: [file] }) && nav.share) {
      await nav.share({ files: [file], title });
      return true;
    }
  } catch (err) {
    // user cancelled the share sheet — treat as handled
    if ((err as DOMException)?.name === "AbortError") return true;
  }
  return false;
}
