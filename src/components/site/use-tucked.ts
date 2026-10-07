"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Phones and tablets: the floating social icons and the play button sit
// over the page. They belong to the home page's opening screen (built
// around them); anywhere else, or once the visitor scrolls down, they tuck
// away so they never cover text, buttons or form fields (the footer has the
// same links).
export function useTucked(): boolean {
  const pathname = usePathname();
  const [tucked, setTucked] = useState(false);
  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 1023px)");
    const update = () => setTucked(narrow.matches && (pathname !== "/" || window.scrollY > window.innerHeight * 0.45));
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);
  return tucked;
}
