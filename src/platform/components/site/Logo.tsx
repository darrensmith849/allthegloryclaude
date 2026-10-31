import Link from "@/platform/components/ui/Link";
import { brand } from "@/platform/config/brand";

// Wordmark from brand config, set like the All the Glory /websites mark:
// wide-tracked capitals beside a small line-art figure — two overlapping
// circles (talent meeting work) with a gold point where they meet.
export function Logo({ showStatus = true }: { showStatus?: boolean }) {
  return (
    <Link href="/" className="logo">
      <svg className="logo__mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <circle cx="12" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="20" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="16" cy="16" r="2.2" fill="#d8b25a" />
      </svg>
      <span className="logo__word">{brand.name}</span>
      {showStatus && brand.nameStatus === "working-name" ? <span className="logo__status">Working name</span> : null}
      <span className="visually-hidden">, home</span>
    </Link>
  );
}
