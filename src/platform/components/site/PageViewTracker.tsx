"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { platformPath } from "@/platform/config/client-env";
import { track } from "@/platform/lib/analytics";

export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    track(platformPath(pathname).startsWith("/roster/") ? "profile_view" : "page_view");
  }, [pathname]);
  return null;
}
