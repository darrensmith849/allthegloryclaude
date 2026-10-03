"use client";

import { Reader } from "@/components/study/reader";

// The owner's preview of the shared study - exactly what readers get from
// /api/study/read, plus the days and notes kept back (marked 🔒).
export default function ReaderPreviewPage() {
  return (
    <Reader
      basePath="/dashboard/notes/read"
      preview
      back={{ href: (d) => (d ? `/dashboard/notes?day=${d}` : "/dashboard/notes"), label: "← Back to Study Notes" }}
    />
  );
}
