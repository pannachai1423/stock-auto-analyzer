import type { Metadata } from "next";
import ScrapbookView from "@/components/ScrapbookView";

export const metadata: Metadata = {
  title: "Scrapbook · Dear Memory 📖"
};

export default function ScrapbookPage() {
  return <ScrapbookView />;
}
