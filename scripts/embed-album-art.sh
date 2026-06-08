#!/usr/bin/env bash
# Embed /media/ocean.jpg as the front-cover artwork into every MP3 the
# site ships:
#   - The 7 full tracks inside public/downloads/from-darkness-to-light.zip
#   - The 7 30-second previews in public/audio/previews/
#
# Also writes (or rewrites) the canonical ID3v2.3 tags — title, artist,
# album, track number, year — so the listener sees a proper card in any
# player (Apple Music, VLC, QuickTime Player, Android, etc.) instead of
# a blank music-note placeholder.
#
# Requirements: ffmpeg (already installed via Homebrew on this machine).
# Idempotent: safe to re-run any time the artwork or tracklist changes.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COVER="$ROOT/public/media/ocean.jpg"
ZIP="$ROOT/public/downloads/from-darkness-to-light.zip"
ALBUM="From Darkness To Light"
ARTIST="All The Glory"
YEAR="2026"
TOTAL=7

if [ ! -f "$COVER" ]; then
  echo "ERROR: cover image not found at $COVER" >&2
  exit 1
fi
if [ ! -f "$ZIP" ]; then
  echo "ERROR: album zip not found at $ZIP" >&2
  exit 1
fi

# Track display titles, in album order. Mirrors src/content/album.ts so
# the embedded tag matches the on-site copy.
TITLES=(
  "John 19 vs 30"
  "Matthew 14 vs 31"
  "John 11 vs 35"
  "Luke 15 vs 20"
  "Proverbs 3 vs 5"
  "John 3 vs 16"
  "2 Corinthians 5 vs 21"
)

# Stem fragments used to match the seven preview MP3s. Index aligns with TITLES.
PREVIEW_STEMS=(
  "01-john-19-vs-30"
  "02-matthew-14-vs-31"
  "03-john-11-vs-35"
  "04-luke-15-vs-20"
  "05-proverbs-3-vs-5"
  "06-john-3-vs-16"
  "07-2-corinthians-5-vs-21"
)

embed() {
  # embed <input.mp3> <output.mp3> <track-no> <title>
  local in="$1" out="$2" trackno="$3" title="$4"
  ffmpeg -hide_banner -loglevel error -y \
    -i "$in" \
    -i "$COVER" \
    -map 0:a -map 1:v \
    -c:a copy -c:v mjpeg \
    -id3v2_version 3 -write_id3v1 1 \
    -metadata title="$title" \
    -metadata artist="$ARTIST" \
    -metadata album_artist="$ARTIST" \
    -metadata album="$ALBUM" \
    -metadata track="$trackno/$TOTAL" \
    -metadata date="$YEAR" \
    -metadata:s:v title="Album cover" \
    -metadata:s:v comment="Cover (front)" \
    -disposition:v:0 attached_pic \
    "$out"
}

# ─── 1. Album zip ─────────────────────────────────────────────────────────
# Unzip → re-tag every MP3 → re-zip in place. Preserves PDFs and folder
# structure by zipping the whole working directory back up.
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "→ Unpacking album zip…"
unzip -q "$ZIP" -d "$WORK"

cd "$WORK"
echo "→ Embedding cover into album MP3s…"
i=0
for stem in "${PREVIEW_STEMS[@]}"; do
  trackno=$((i + 1))
  title="${TITLES[$i]}"
  padded=$(printf "%02d" "$trackno")
  mp3="$WORK/${padded} - ${ARTIST} - ${title}.mp3"
  if [ ! -f "$mp3" ]; then
    echo "WARN: missing $mp3 in zip" >&2
    i=$((i + 1))
    continue
  fi
  tmp="${mp3%.mp3}.tagged.mp3"
  embed "$mp3" "$tmp" "$trackno" "$title"
  mv "$tmp" "$mp3"
  echo "   ✓ track $padded — $title"
  i=$((i + 1))
done

echo "→ Re-zipping album…"
NEW_ZIP="$WORK/from-darkness-to-light.zip"
# zip flags: -r recurse, -X strip extra file attrs for smaller archive
(cd "$WORK" && zip -rqX "$NEW_ZIP" Lyrics *.mp3)
mv "$NEW_ZIP" "$ZIP"
echo "   ✓ wrote $ZIP"

# ─── 2. Preview MP3s ──────────────────────────────────────────────────────
# These power the in-browser preview player. The site's UI uses a custom
# painted cover so the embedded artwork isn't user-visible there, but any
# user that opens the URL directly (or saves the file) still gets the cover.
PREVIEW_DIR="$ROOT/public/audio/previews"
if [ -d "$PREVIEW_DIR" ]; then
  echo "→ Embedding cover into preview MP3s…"
  i=0
  for stem in "${PREVIEW_STEMS[@]}"; do
    trackno=$((i + 1))
    title="${TITLES[$i]}"
    src="$PREVIEW_DIR/${stem}.mp3"
    if [ ! -f "$src" ]; then
      echo "WARN: missing preview $src" >&2
      i=$((i + 1))
      continue
    fi
    tmp="${src%.mp3}.tagged.mp3"
    embed "$src" "$tmp" "$trackno" "$title (preview)"
    mv "$tmp" "$src"
    echo "   ✓ preview $stem"
    i=$((i + 1))
  done
fi

echo
echo "Done. Every MP3 the site ships now carries the From Darkness To Light cover."
