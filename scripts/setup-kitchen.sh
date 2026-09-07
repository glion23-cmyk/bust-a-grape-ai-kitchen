#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
kitchen_root="${BAG_KITCHEN_ROOT:-/Users/vine/code/experiments/bust-a-grape-kitchen}"

if ! git -C "$project_root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  printf 'Initialize and commit the project repository before setting up the kitchen.\n' >&2
  exit 1
fi

mkdir -p "$kitchen_root"

ensure_worktree() {
  local branch="$1"
  local path="$2"

  if [ -e "$path/.git" ]; then
    printf 'Ready: %s → %s\n' "$branch" "$path"
    return
  fi

  if ! git -C "$project_root" show-ref --verify --quiet "refs/heads/$branch"; then
    git -C "$project_root" branch "$branch" main
  fi
  git -C "$project_root" worktree add "$path" "$branch"
}

ensure_worktree "cook/gemini" "$kitchen_root/gemini"
ensure_worktree "cook/claude" "$kitchen_root/claude"

printf '\nKitchen ready.\nGemini: %s\nClaude: %s\n' "$kitchen_root/gemini" "$kitchen_root/claude"
