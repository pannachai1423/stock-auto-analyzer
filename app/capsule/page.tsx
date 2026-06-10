import type { Metadata } from "next";
import CapsuleView from "@/components/CapsuleView";

export const metadata: Metadata = {
  title: "Time Capsule · Dear Memory ⏳"
};

export default function CapsulePage() {
  return <CapsuleView />;
}
