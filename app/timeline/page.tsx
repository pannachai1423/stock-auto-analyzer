import type { Metadata } from "next";
import TimelineView from "@/components/TimelineView";

export const metadata: Metadata = {
  title: "Timeline · Dear Memory 🌸"
};

export default function TimelinePage() {
  return <TimelineView />;
}
