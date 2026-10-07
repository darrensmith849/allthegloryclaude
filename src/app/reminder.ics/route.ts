/**
 * A daily reading reminder for the phone's own calendar - for when website
 * notifications won't switch on (iPhones can be fussy). Opens "Add to
 * Calendar" with a repeating daily event at the chosen time, with an alert
 * and a link back to the journal. Nothing personal in it.
 *
 *   GET /reminder.ics?hour=7&for=dashboard|study
 */
export const dynamic = "force-dynamic";

const pad = (n: number) => String(n).padStart(2, "0");

export function GET(req: Request) {
  const url = new URL(req.url);
  const hour = Math.min(23, Math.max(0, Number.parseInt(url.searchParams.get("hour") ?? "7", 10) || 0));
  const owner = url.searchParams.get("for") === "dashboard";
  const link = `https://alltheglory.co.za${owner ? "/dashboard/notes" : "/study/journal"}`;
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  // Starts tomorrow, at the hour on the phone's own clock (a "floating" time).
  const start = new Date(now.getTime() + 86_400_000);
  const day = `${start.getUTCFullYear()}${pad(start.getUTCMonth() + 1)}${pad(start.getUTCDate())}`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//All The Glory//The Study//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:atg-daily-reading-${owner ? "dashboard" : "study"}@alltheglory.co.za`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${day}T${pad(hour)}0000`,
    "DURATION:PT15M",
    "RRULE:FREQ=DAILY",
    "SUMMARY:Time for today's reading",
    `DESCRIPTION:Open your journal - read\\, and write what God shows you. ${link}`,
    `URL:${link}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:PT0M",
    "DESCRIPTION:Time for today's reading",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": 'inline; filename="daily-reading.ics"',
      "cache-control": "no-store",
    },
  });
}
