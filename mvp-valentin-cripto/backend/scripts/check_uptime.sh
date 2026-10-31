#!/usr/bin/env bash
set -eu

HEALTH_URL="${1:-http://127.0.0.1:8004/health}"
if ! curl --fail --silent --show-error --max-time 10 "$HEALTH_URL"; then
  printf '\nHealth check failed: %s\n' "$HEALTH_URL" >&2
  exit 1
fi
printf '\n'
