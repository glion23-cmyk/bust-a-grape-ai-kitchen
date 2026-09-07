#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
output_dir="$project_root/dist"
staging_dir="$(mktemp -d /tmp/bust-a-grape-pages.XXXXXX)"
trap 'rm -rf "$staging_dir"' EXIT

mkdir -p "$staging_dir/content" "$staging_dir/art/gui"

cp \
  "$project_root/index.html" \
  "$project_root/style.css" \
  "$project_root/game.js" \
  "$project_root/renderer3d.js" \
  "$project_root/manifest.webmanifest" \
  "$project_root/sw.js" \
  "$staging_dir/"

mkdir -p "$staging_dir/vendor"
cp "$project_root/vendor/three.min.js" "$project_root/vendor/LICENSE.three.txt" "$staging_dir/vendor/"

cp "$project_root/content/lots.json" "$project_root/content/lines.json" "$staging_dir/content/"
cp \
  "$project_root/art/gui/app-icon.svg" \
  "$project_root/art/gui/apple-touch-icon.png" \
  "$project_root/art/gui/lockup.png" \
  "$staging_dir/art/gui/"
cp "$project_root/hosting/_headers" "$project_root/hosting/robots.txt" "$staging_dir/"

mkdir -p "$output_dir"
rsync -a --delete "$staging_dir/" "$output_dir/"

printf 'Built Cloudflare Pages bundle: %s\n' "$output_dir"
find "$output_dir" -type f -print | sort
