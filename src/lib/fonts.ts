// Gelasio: a Georgia-style serif (same shapes and spacing as Georgia), the
// typeface of the album flyer. Used for headings and long reading text on
// the dashboard and The Study - see "Typography" in dashboard.css.
import { Gelasio } from "next/font/google";

export const readFont = Gelasio({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-read",
});
