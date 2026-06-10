import type { Metadata } from "next";
import PremiumView from "@/components/PremiumView";

export const metadata: Metadata = {
  title: "Premium · Dear Memory 👑"
};

export default function PremiumPage() {
  return <PremiumView />;
}
