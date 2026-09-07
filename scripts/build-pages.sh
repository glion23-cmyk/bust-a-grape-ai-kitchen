#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
output_dir="$project_root/dist"
staging_dir="$(mktemp -d /tmp/bust-a-grape-pages.XXXXXX)"
trap 'rm -rf "$staging_dir"' EXIT

mkdir -p "$staging_dir/content" "$staging_dir/art/gui" "$staging_dir/art/sprites"

cp \
  "$project_root/index.html" \
  "$project_root/style.css" \
  "$project_root/game.js" \
  "$project_root/manifest.webmanifest" \
  "$project_root/sw.js" \
  "$staging_dir/"

cp "$project_root/content/lots.json" "$project_root/content/lines.json" "$staging_dir/content/"
cp \
  "$project_root/art/gui/app-icon.svg" \
  "$project_root/art/gui/apple-touch-icon.png" \
  "$project_root/art/gui/lockup.png" \
  "$staging_dir/art/gui/"
cp \
  "$project_root/art/sprites/kansas-dusk.jpg" \
  "$project_root/art/sprites/sidewinder.png" \
  "$project_root/art/sprites/bootlegger.png" \
  "$project_root/art/sprites/pip-merlot.png" \
  "$staging_dir/art/sprites/"
cp "$project_root/hosting/_headers" "$project_root/hosting/robots.txt" "$staging_dir/"

mkdir -p "$output_dir"
rsync -a --delete "$staging_dir/" "$output_dir/"

printf 'Built Cloudflare Pages bundle: %s\n' "$output_dir"
find "$output_dir" -type f -print | sort
