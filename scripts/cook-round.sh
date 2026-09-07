#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
kitchen_root="${BAG_KITCHEN_ROOT:-/Users/vine/code/experiments/bust-a-grape-kitchen}"
gemini_tree="$kitchen_root/gemini"
opus_tree="$kitchen_root/claude"
agy_bin="${AGY_BIN:-/Users/vine/.local/bin/agy}"
runs_dir="$project_root/collab/runs"
round_id="${1:-$(date +%Y%m%d-%H%M%S)}"
deploy="${BAG_DEPLOY_AFTER_COOK:-0}"
directive_rel="collab/directives/${round_id}.md"
gate_rel="collab/gates/${round_id}.md"

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
  if [ -f "$tree/package.json" ]; then
    (cd "$tree" && npm test --if-present)
  fi
}

require_change() {
  local tree="$1"
  local label="$2"
  if [ -z "$(git -C "$tree" status --porcelain)" ]; then
    fail "$label completed without changing its artifact."
  fi
}

require_playable_change() {
  local tree="$1"
  local changed
  changed="$(git -C "$tree" status --porcelain | sed -E 's/^...//' | grep -Ev '^(collab/|FORKS/)' || true)"
  if [ -z "$changed" ]; then
    fail 'Gemini changed only collaboration notes; a production turn must change the playable build or its production system.'
  fi
}

commit_and_merge() {
  local tree="$1"
  local branch="$2"
  local message="$3"
  git -C "$tree" add -A
  git -C "$tree" commit -m "$message"
  git -C "$project_root" merge --no-ff "$branch" -m "Merge $message"
}

run_agy() {
  local tree="$1"
  local model="$2"
  local log="$3"
  local prompt="$4"
  (
    cd "$tree"
    "$agy_bin" \
      --new-project \
      --model "$model" \
      --mode accept-edits \
      --sandbox \
      --dangerously-skip-permissions \
      --print-timeout 30m0s \
      --output-format json \
      --print="$prompt"
  ) | tee "$log"
}

[ -x "$agy_bin" ] || fail "Antigravity CLI is missing: $agy_bin"
[ -d "$gemini_tree" ] || fail 'Gemini worktree is missing. Run scripts/setup-kitchen.sh.'
[ -d "$opus_tree" ] || fail 'Opus worktree is missing. Run scripts/setup-kitchen.sh.'

models="$($agy_bin models 2>/dev/null || true)"
printf '%s\n' "$models" | grep -q '^claude-opus-4-6-thinking[[:space:]]' || fail 'Claude Opus 4.6 is not available in Antigravity.'
printf '%s\n' "$models" | grep -q '^gemini-3.1-pro-high[[:space:]]' || fail 'Gemini 3.1 Pro High is not available in Antigravity.'

require_clean "$project_root" 'Integration'
require_clean "$gemini_tree" 'Gemini'
require_clean "$opus_tree" 'Opus'

printf '=== ROUND %s / OPUS DIRECTS ===\n' "$round_id"
git -C "$opus_tree" merge --ff-only main

IFS= read -r -d '' opus_director_prompt <<EOF || true
You are the Claude Opus creative-director/architecture lane for BUST A GRAPE, round $round_id. Follow CLAUDE.md, collab/MANDATE.md, collab/PROTOCOL.md, collab/STATE.md, and the partner handoffs. The user has made dimensional play a hard requirement: the destination cannot remain a flat 2D Canvas game. Spend this scarce Opus pass only on the decisive call.

Inspect just enough of the current runnable prototype and relevant source to choose the smallest vertical slice that can prove a genuinely dimensional, phone-capable, hard-to-put-down BUST A GRAPE. Then create $directive_rel. It must contain: PLAYER PROMISE, THE ONE BUILD, WHY IT WINS, DIMENSIONAL MECHANIC (not decorative parallax), LOOP/RETENTION MOVE, TECHNICAL SEAM, PHONE BUDGET, ACCEPTANCE CHECKS, NON-GOALS, and GEMINI'S FIRST ACTION. Be opinionated and compact. Prefer an executable wedge over an engine rewrite manifesto. Update collab/handoffs/claude.md with no more than 12 actionable lines. Do not implement bulk code, create a backlog, deploy, publish, or touch Git.
EOF

run_agy "$opus_tree" claude-opus-4-6-thinking \
  "$runs_dir/${round_id}-opus-director.json" "$opus_director_prompt"

require_change "$opus_tree" 'Opus director'
[ -s "$opus_tree/$directive_rel" ] || fail "Opus did not create $directive_rel"
commit_and_merge "$opus_tree" cook/claude "Opus directive $round_id"

printf '\n=== ROUND %s / GEMINI PRODUCES ===\n' "$round_id"
git -C "$gemini_tree" merge --ff-only main

IFS= read -r -d '' gemini_prompt <<EOF || true
You are the Gemini Pro production/physics lane for BUST A GRAPE, round $round_id. Follow GEMINI.md, collab/MANDATE.md, collab/PROTOCOL.md, collab/STATE.md, and $directive_rel. Opus has already made the expensive product call. Turn it into the strongest coherent playable implementation you can in this worktree.

Own the grunt work: rendering architecture, deterministic physics, collision/terrain, touch controls, opponent behavior, event feedback, instrumentation, degradation, tests, and repeated tuning. The build must remain runnable throughout. Implement real dimensional gameplay or the directive's staged proof of it; fake sprite parallax alone is a failure. Protect landscape phone readability and performance. Run proportionate automated checks and any local browser probes available. Replace collab/handoffs/gemini.md with a concise record of what changed, measurements/evidence, compromises, remaining risk, and exactly what Opus should inspect. Update collab/STATE.md if the integrated truth changed. Do not deploy, publish, alter Git, or merely return a plan.
EOF

run_agy "$gemini_tree" gemini-3.1-pro-high \
  "$runs_dir/${round_id}-gemini-build.json" "$gemini_prompt"

require_change "$gemini_tree" 'Gemini production'
require_playable_change "$gemini_tree"
validate_tree "$gemini_tree"
commit_and_merge "$gemini_tree" cook/gemini "Gemini production $round_id"

printf '\n=== ROUND %s / OPUS GATES ===\n' "$round_id"
git -C "$opus_tree" merge --ff-only main

IFS= read -r -d '' opus_gate_prompt <<EOF || true
You are the Claude Opus quality gate for BUST A GRAPE, round $round_id. This is a narrow second look, not another design session. Read $directive_rel, collab/handoffs/gemini.md, the files Gemini actually changed in the latest merged production commit, and the runnable result/evidence. Judge whether the build delivers the directive, meaningful dimensional play, compelling shot feel/loop value, and a credible phone path.

Create $gate_rel. Its first non-heading line must be exactly VERDICT: PASS or VERDICT: REPAIR. Then give: WHAT LANDED, EVIDENCE CHECKED, and at most THREE BLOCKERS. A blocker must be concrete enough for Gemini to implement and verify. Update collab/handoffs/claude.md with only the verdict and next production seam. Do not generate a roadmap, reread the board archive, deploy, publish, alter Git, or perform bulk implementation. Make a surgical code correction only if it is cheaper than explaining it.
EOF

run_agy "$opus_tree" claude-opus-4-6-thinking \
  "$runs_dir/${round_id}-opus-gate.json" "$opus_gate_prompt"

require_change "$opus_tree" 'Opus gate'
[ -s "$opus_tree/$gate_rel" ] || fail "Opus did not create $gate_rel"
commit_and_merge "$opus_tree" cook/claude "Opus gate $round_id"

verdict="$(grep -m1 -E '^VERDICT: (PASS|REPAIR)$' "$project_root/$gate_rel" | cut -d' ' -f2 || true)"
[ -n "$verdict" ] || fail 'Opus gate did not contain a parseable verdict.'

if [ "$verdict" = 'REPAIR' ]; then
  printf '\n=== ROUND %s / GEMINI CLOSES GATE ===\n' "$round_id"
  git -C "$gemini_tree" merge --ff-only main

  IFS= read -r -d '' gemini_repair_prompt <<EOF || true
You are the Gemini Pro production/physics lane closing the Opus gate for BUST A GRAPE, round $round_id. Read $directive_rel, $gate_rel, and both handoffs. Implement and verify every listed blocker without expanding scope. Preserve the strongest existing work, keep the game runnable, and favor measured physics/performance fixes over prose. Replace collab/handoffs/gemini.md with blocker-by-blocker evidence and update collab/STATE.md if needed. Do not deploy, publish, alter Git, or stop at a plan.
EOF

  run_agy "$gemini_tree" gemini-3.1-pro-high \
    "$runs_dir/${round_id}-gemini-repair.json" "$gemini_repair_prompt"

  require_change "$gemini_tree" 'Gemini repair'
  require_playable_change "$gemini_tree"
  validate_tree "$gemini_tree"
  commit_and_merge "$gemini_tree" cook/gemini "Gemini gate repair $round_id"
fi

validate_tree "$project_root"
"$project_root/scripts/build-pages.sh" >/dev/null

if [ "$deploy" = '1' ]; then
  /opt/homebrew/bin/wrangler pages deploy "$project_root/dist" --project-name bust-a-grape --branch main
else
  printf '\nIntegrated build is local. Set BAG_DEPLOY_AFTER_COOK=1 to publish a validated round.\n'
fi

printf 'COOK ROUND %s COMPLETE — OPUS VERDICT: %s\n' "$round_id" "$verdict"
