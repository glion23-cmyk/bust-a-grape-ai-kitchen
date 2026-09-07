#!/usr/bin/env bash
set -euo pipefail

failed=0
agy_bin="${AGY_BIN:-/Users/vine/.local/bin/agy}"

printf 'Antigravity CLI: '
if [ -x "$agy_bin" ]; then
  "$agy_bin" --version
else
  printf 'missing: %s\n' "$agy_bin"
  failed=1
fi

printf '\nKitchen models:\n'
models="$($agy_bin models 2>/dev/null || true)"
for required_model in claude-opus-4-6-thinking gemini-3.1-pro-high; do
  if printf '%s\n' "$models" | grep -q "^${required_model}[[:space:]]"; then
    printf 'ready: %s\n' "$required_model"
  else
    printf 'missing: %s\n' "$required_model"
    failed=1
  fi
done

printf '\nGit worktrees:\n'
git worktree list 2>/dev/null || true

if [ "$failed" -ne 0 ]; then
  exit 1
fi
