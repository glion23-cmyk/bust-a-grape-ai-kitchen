#!/usr/bin/env bash
set -euo pipefail

printf '\nCLAUDE SIGN-IN\n'
printf 'Sign in with the Claude subscription you want the kitchen to conserve.\n\n'
claude auth login --claudeai

printf '\nGEMINI SIGN-IN\n'
printf 'Choose Sign in with Google. After Gemini reaches its prompt, type /quit.\n\n'
GEMINI_CLI_TRUST_WORKSPACE=true gemini --skip-trust

printf '\nAUTH CHECK\n'
"$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/kitchen-doctor.sh"
