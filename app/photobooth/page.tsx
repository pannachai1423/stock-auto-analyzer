import { Suspense } from "react";
import type { Metadata } from "next";
import PhotoboothFlow from "@/components/PhotoboothFlow";

export const metadata: Metadata = {
  title: "Photobooth · Dear Memory 📸"
};

export default function PhotoboothPage() {
  return (
    <Suspense
      fallback={
        <p className="py-20 text-center font-display text-xl text-cocoaSoft">
          Packing your memories... 💌
        </p>
      }
    >
      <PhotoboothFlow />
    </Suspense>
  );
}
