#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
output_dir="$project_root/dist"
staging_dir="$(mktemp -d /tmp/bust-a-grape-pages.XXXXXX)"
trap 'rm -rf "$staging_dir"' EXIT

mkdir -p "$staging_dir/content" "$staging_dir/art/gui" "$staging_dir/assets/fonts" "$staging_dir/audio/sfx"

cp \
  "$project_root/index.html" \
  "$project_root/style.css" \
  "$project_root/game.js" \
  "$project_root/renderer3d.js" \
  "$project_root/manifest.webmanifest" \
  "$project_root/sw.js" \
  "$staging_dir/"

mkdir -p "$staging_dir/vendor"
cp -R "$project_root/vendor/three" "$staging_dir/vendor/"

cp "$project_root/content/lots.json" "$project_root/content/lines.json" "$staging_dir/content/"
cp \
  "$project_root/art/gui/app-icon.svg" \
  "$project_root/art/gui/apple-touch-icon.png" \
  "$project_root/art/gui/lockup.webp" \
  "$staging_dir/art/gui/"
cp \
  "$project_root/assets/fonts/OFL-Barlow.txt" \
  "$project_root/assets/fonts/barlow-condensed-latin-700-normal.woff2" \
  "$project_root/assets/fonts/barlow-condensed-latin-900-normal.woff2" \
  "$project_root/assets/fonts/barlow-latin-400-normal.woff2" \
  "$project_root/assets/fonts/barlow-latin-600-normal.woff2" \
  "$staging_dir/assets/fonts/"
cp \
  "$project_root/audio/sfx/LICENSE-Kenney-CC0.txt" \
  "$project_root/audio/sfx/ui-press.mp3" \
  "$project_root/audio/sfx/ui-select.mp3" \
  "$project_root/audio/sfx/launcher-clank.mp3" \
  "$project_root/audio/sfx/grape-impact.mp3" \
  "$project_root/audio/sfx/bottle-break.mp3" \
  "$staging_dir/audio/sfx/"
cp "$project_root/hosting/_headers" "$project_root/hosting/robots.txt" "$staging_dir/"

mkdir -p "$output_dir"
rsync -a --delete "$staging_dir/" "$output_dir/"

printf 'Built Cloudflare Pages bundle: %s\n' "$output_dir"
find "$output_dir" -type f -print | sort
