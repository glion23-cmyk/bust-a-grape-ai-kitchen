#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
kitchen_root="${BAG_KITCHEN_ROOT:-/Users/vine/code/experiments/bust-a-grape-kitchen}"
gemini_tree="$kitchen_root/gemini"
claude_tree="$kitchen_root/claude"
runs_dir="$project_root/collab/runs"
round_id="${1:-$(date +%Y%m%d-%H%M%S)}"
claude_max_turns="${CLAUDE_MAX_TURNS:-8}"
deploy="${BAG_DEPLOY_AFTER_COOK:-0}"

mkdir -p "$runs_dir"

fail() {
  printf 'COOK STOPPED: %s\n' "$1" >&2
  exit 1
}

require_clean() {
  local tree="$1"
  local label="$2"
  if [ -n "$(git -C "$tree" status --porcelain)" ]; then
    fail "$label tree is not clean: $tree"
  fi
}

validate_tree() {
  local tree="$1"
  node --check "$tree/game.js"
  node --check "$tree/sw.js"
  python3 -m json.tool "$tree/manifest.webmanifest" >/dev/null
  python3 -m json.tool "$tree/content/lots.json" >/dev/null
  python3 -m json.tool "$tree/content/lines.json" >/dev/null
}

command -v gemini >/dev/null 2>&1 || fail 'Gemini CLI is missing.'
command -v claude >/dev/null 2>&1 || fail 'Claude Code is missing.'
[ -d "$gemini_tree" ] || fail 'Gemini worktree is missing. Run scripts/setup-kitchen.sh.'
[ -d "$claude_tree" ] || fail 'Claude worktree is missing. Run scripts/setup-kitchen.sh.'
claude auth status 2>/dev/null | grep -q '"loggedIn": true' || fail 'Claude is not authenticated. Run `claude auth login`.'

require_clean "$project_root" 'Integration'
require_clean "$gemini_tree" 'Gemini'
require_clean "$claude_tree" 'Claude'

printf '=== ROUND %s / GEMINI OPENS ===\n' "$round_id"
git -C "$gemini_tree" merge --ff-only main

gemini_prompt="$(cat <<EOF
You are the Gemini half of the BUST A GRAPE kitchen, cook round $round_id. Follow GEMINI.md and the collaboration files exactly. Read Claude's latest handoff and the current playable source. Then choose the highest-leverage coherent improvement across the whole game, implement it in this worktree, run proportionate checks, and replace collab/handoffs/gemini.md with a concise honest handoff for Claude. Do not merely plan. Do not deploy, publish, manipulate branches, or work outside this repository. The mandate is simple: make the game fucking badass together.
EOF
)"

(
  cd "$gemini_tree"
  GEMINI_CLI_TRUST_WORKSPACE=true gemini \
    --skip-trust \
    --sandbox \
    --approval-mode yolo \
    --output-format json \
    --prompt "$gemini_prompt"
) | tee "$runs_dir/${round_id}-gemini.json"

validate_tree "$gemini_tree"
if [ -n "$(git -C "$gemini_tree" status --porcelain)" ]; then
  git -C "$gemini_tree" add -A
  git -C "$gemini_tree" commit -m "Gemini cook round $round_id"
else
  fail 'Gemini completed without changing the build or its handoff.'
fi
git -C "$project_root" merge --no-ff cook/gemini -m "Merge Gemini cook round $round_id"

printf '\n=== ROUND %s / CLAUDE ANSWERS (max %s turns) ===\n' "$round_id" "$claude_max_turns"
git -C "$claude_tree" merge --ff-only main

claude_prompt="$(cat <<EOF
You are the Claude half of the BUST A GRAPE kitchen, cook round $round_id. Follow CLAUDE.md and the collaboration files exactly. Gemini's just-merged implementation and handoff are already in this tree. Critique through code: make the strongest focused implementation response you can, test it, and replace collab/handoffs/claude.md with a concise honest handoff for Gemini. Do not restate the repository, write a giant roadmap, deploy, publish, manipulate branches, or work outside this repository. The mandate is simple: make the game fucking badass together.
EOF
)"

(
  cd "$claude_tree"
  claude -p \
    --model sonnet \
    --effort high \
    --max-turns "$claude_max_turns" \
    --autocompact 100k \
    --no-session-persistence \
    --permission-mode acceptEdits \
    --allowedTools 'Read,Glob,Grep,Edit,Write,Bash' \
    --output-format json \
    "$claude_prompt"
) | tee "$runs_dir/${round_id}-claude.json"

validate_tree "$claude_tree"
if [ -n "$(git -C "$claude_tree" status --porcelain)" ]; then
  git -C "$claude_tree" add -A
  git -C "$claude_tree" commit -m "Claude cook round $round_id"
else
  fail 'Claude completed without changing the build or its handoff.'
fi
git -C "$project_root" merge --no-ff cook/claude -m "Merge Claude cook round $round_id"

validate_tree "$project_root"
"$project_root/scripts/build-pages.sh" >/dev/null

if [ "$deploy" = '1' ]; then
  /opt/homebrew/bin/wrangler pages deploy "$project_root/dist" --project-name bust-a-grape --branch main
else
  printf '\nIntegrated build is local. Set BAG_DEPLOY_AFTER_COOK=1 to publish a validated round.\n'
fi

printf 'COOK ROUND %s COMPLETE\n' "$round_id"
