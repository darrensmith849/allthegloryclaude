// A day's session video: a YouTube link (watch, youtu.be, live, shorts or
// embed, with an optional start time like ?t=1h2m30s) -> what the player needs.

export interface YouTubeVideo {
  id: string;
  start: number; // seconds
}

function seconds(t: string | null): number {
  if (!t) return 0;
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
}

export function parseYouTube(raw: string | null | undefined): YouTubeVideo | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const m = url.pathname.match(/^\/(?:live|shorts|embed|v)\/([^/?#]+)/);
      id = m?.[1] ?? null;
    }
  }
  if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null;
  return { id, start: seconds(url.searchParams.get("t") ?? url.searchParams.get("start")) };
}

export const embedUrl = (v: YouTubeVideo) =>
  `https://www.youtube-nocookie.com/embed/${v.id}?rel=0&modestbranding=1${v.start ? `&start=${v.start}` : ""}`;
export const watchUrl = (v: YouTubeVideo) => `https://www.youtube.com/watch?v=${v.id}${v.start ? `&t=${v.start}s` : ""}`;
