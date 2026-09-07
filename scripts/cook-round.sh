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
evidence_rel="collab/evidence/${round_id}-build-dossier.md"

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
  if [ -f "$tree/renderer3d.js" ]; then
    node --check "$tree/renderer3d.js"
  fi
  node --check "$tree/sw.js"
  python3 -m json.tool "$tree/manifest.webmanifest" >/dev/null
  python3 -m json.tool "$tree/content/lots.json" >/dev/null
  python3 -m json.tool "$tree/content/lines.json" >/dev/null
  if [ -f "$tree/scripts/test-fixture.js" ]; then
    node "$tree/scripts/test-fixture.js"
  fi
  if [ -f "$tree/package.json" ]; then
    (cd "$tree" && npm test --if-present)
  fi
  if [ -x "$tree/scripts/build-pages.sh" ]; then
    "$tree/scripts/build-pages.sh" >/dev/null
    for required_asset in \
      index.html style.css game.js sw.js manifest.webmanifest \
      renderer3d.js vendor/three.min.js vendor/LICENSE.three.txt; do
      [ -f "$tree/dist/$required_asset" ] || fail "Production bundle is missing $required_asset in $tree/dist."
    done
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
You are the Claude Opus creative-director/architecture lane for BUST A GRAPE, round $round_id. The user has made dimensional play a hard requirement: the destination cannot remain a flat 2D Canvas game. Spend this scarce Opus pass only on the decisive call.

Your entire input packet is limited to CLAUDE.md, collab/MANDATE.md, collab/STATE.md, collab/DECISIONS.md, collab/handoffs/gemini.md, and collab/handoffs/claude.md. Read those exact files only. Do not traverse the repository, inspect source, read old run logs, or reopen the board archive. If the packet leaves a technical fact uncertain, turn that uncertainty into an acceptance check for Gemini instead of researching it yourself.

Choose the smallest vertical slice that can make the current dimensional, phone-capable game meaningfully harder to put down. Then create $directive_rel. It must contain: PLAYER PROMISE, THE ONE BUILD, WHY IT WINS, DIMENSIONAL MECHANIC, LOOP/RETENTION MOVE, TECHNICAL SEAM, PHONE BUDGET, ACCEPTANCE CHECKS, NON-GOALS, and GEMINI'S FIRST ACTION. Be opinionated and compact. Prefer an executable wedge over an engine rewrite manifesto. Update collab/handoffs/claude.md with no more than 12 actionable lines. Do not implement code, create a backlog, deploy, publish, or touch Git.
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

Own the grunt work: source inspection, rendering architecture, deterministic physics, collision/terrain, touch controls, opponent behavior, event feedback, instrumentation, degradation, tests, and repeated tuning. The build must remain runnable throughout. Implement real dimensional gameplay or the directive's staged proof of it; fake sprite parallax alone is a failure. Protect landscape phone readability and performance. Run proportionate automated checks and local browser probes at 844x390 and 740x360 when available.

Create $evidence_rel as Opus's compact evidence packet. It must state the acceptance check result, exact automated commands/results, browser dimensions and input path exercised, performance sample with caveats, changed-system summary, known defects, and paths to at most two fresh screenshots. Keep it under 900 words and do not paste source. Replace collab/handoffs/gemini.md with no more than 16 lines: what changed, compromises, remaining risk, and exactly what Opus should judge. Update collab/STATE.md if the integrated truth changed. Do not deploy, publish, alter Git, or merely return a plan.
EOF

run_agy "$gemini_tree" gemini-3.1-pro-high \
  "$runs_dir/${round_id}-gemini-build.json" "$gemini_prompt"

require_change "$gemini_tree" 'Gemini production'
require_playable_change "$gemini_tree"
[ -s "$gemini_tree/$evidence_rel" ] || fail "Gemini did not create $evidence_rel"
validate_tree "$gemini_tree"
commit_and_merge "$gemini_tree" cook/gemini "Gemini production $round_id"

printf '\n=== ROUND %s / OPUS GATES ===\n' "$round_id"
git -C "$opus_tree" merge --ff-only main

IFS= read -r -d '' opus_gate_prompt <<EOF || true
You are the Claude Opus quality gate for BUST A GRAPE, round $round_id. This is a narrow second look, not another design session. Your entire input packet is $directive_rel, $evidence_rel, collab/handoffs/gemini.md, collab/handoffs/claude.md, and the one or two screenshot paths named by the dossier. Read only those artifacts. Do not inspect source, traverse the repository, read run logs, or reopen the board archive. Gemini owns code verification; you own product judgment.

Judge whether the build delivers the directive, meaningful dimensional play, compelling shot feel/loop value, preserved Kansas cyberpunk gangster identity, and a credible phone path. Create $gate_rel. Its first non-heading line must be exactly VERDICT: PASS or VERDICT: REPAIR. Then give: WHAT LANDED, EVIDENCE CHECKED, and at most THREE BLOCKERS. A blocker must be concrete enough for Gemini to implement and verify. Update collab/handoffs/claude.md with only the verdict and next production seam. Do not generate a roadmap, deploy, publish, alter Git, or implement code.
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
You are the Gemini Pro production/physics lane closing the Opus gate for BUST A GRAPE, round $round_id. Read $directive_rel, $gate_rel, $evidence_rel, and both handoffs. Implement and verify every listed blocker without expanding scope. Preserve the strongest existing work, keep the game runnable, and favor measured physics/performance fixes over prose. Replace $evidence_rel with the final blocker-by-blocker proof and fresh test results, keep collab/handoffs/gemini.md under 16 lines, and update collab/STATE.md if needed. Do not deploy, publish, alter Git, or stop at a plan.
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
