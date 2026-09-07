#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
kitchen_root="${BAG_KITCHEN_ROOT:-/Users/vine/code/experiments/bust-a-grape-kitchen}"

printf 'Integrated main\n'
git -C "$project_root" --no-pager log --oneline --decorate -8

for agent in gemini claude; do
  printf '\n%s fork\n' "$agent"
  git -C "$kitchen_root/$agent" status --short --branch
  git -C "$kitchen_root/$agent" --no-pager log --oneline -3
done

printf '\nLatest handoffs\n'
sed -n '1,180p' "$project_root/collab/handoffs/gemini.md"
printf '\n'
sed -n '1,180p' "$project_root/collab/handoffs/claude.md"
