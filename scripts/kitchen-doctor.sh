#!/usr/bin/env bash
set -euo pipefail

failed=0

printf 'Claude Code: '
if command -v claude >/dev/null 2>&1; then
  claude --version
  if claude auth status 2>/dev/null | grep -q '"loggedIn": true'; then
    printf 'Claude authentication: ready\n'
  else
    printf 'Claude authentication: REQUIRED (`claude auth login`)\n'
    failed=1
  fi
else
  printf 'missing\n'
  failed=1
fi

printf '\nGemini CLI: '
if command -v gemini >/dev/null 2>&1; then
  gemini --version
  if [ -n "${GEMINI_API_KEY:-}" ] || [ -n "${GOOGLE_GENAI_USE_VERTEXAI:-}" ] || [ -n "${GOOGLE_GENAI_USE_GCA:-}" ] || { [ -f /Users/vine/.gemini/settings.json ] && jq -e '.security.auth.selectedType' /Users/vine/.gemini/settings.json >/dev/null 2>&1; }; then
    printf 'Gemini authentication: configured; live access is verified by the first cook call.\n'
  else
    printf 'Gemini authentication: REQUIRED (`gemini`, then choose Sign in with Google)\n'
    failed=1
  fi
else
  printf 'missing\n'
  failed=1
fi

printf '\nGit worktrees:\n'
git worktree list 2>/dev/null || true

if [ "$failed" -ne 0 ]; then
  exit 1
fi
