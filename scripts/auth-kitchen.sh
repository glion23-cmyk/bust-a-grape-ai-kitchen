#!/usr/bin/env bash
set -euo pipefail

printf '\nThe kitchen uses the existing signed-in Antigravity model supply.\n'
printf 'Checking Opus and Gemini availability; no separate login should be needed.\n\n'
"$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/kitchen-doctor.sh"
