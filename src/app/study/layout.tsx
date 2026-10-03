import type { Metadata } from "next";
import { StudyShell } from "@/components/study/shell";
import "../dashboard/dashboard.css";

// The Study: members' own Bible study journals and (when the owner opens it)
// the owner's chronological study. Kept out of search engines for now.
export const metadata: Metadata = {
  title: "The Study",
  description: "Read through the Bible in the order it happened, one day at a time, and keep your own notes.",
  robots: { index: false, follow: false },
};

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  return <StudyShell>{children}</StudyShell>;
}
