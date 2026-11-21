#!/usr/bin/env bash
# assert_no_stub.sh — Reject placeholder / near-empty content on critical paths
# Usage: ./tools/assert_no_stub.sh [path ...]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FORBIDDEN_PATTERNS=(
  "PLACEHOLDER"
  "PLACEHOLDER_WILL_FAIL"
  "SEE_LOCAL_FILE"
  "TODO_STUB"
)

CRITICAL_GLOBS=(
  "AGENT.md"
  "feature_list.json"
  "src"
  "docs"
  "tools"
)

fail=0

check_file() {
  local f="$1"
  if [[ ! -f "$f" ]]; then
    return 0
  fi
  local size
  size=$(wc -c < "$f" | tr -d ' ')
  local content
  content=$(head -c 2000 "$f" 2>/dev/null || true)

  for pat in "${FORBIDDEN_PATTERNS[@]}"; do
    if echo "$content" | grep -q "$pat"; then
      if [[ "$f" == *"assert_no_stub.sh"* ]] || [[ "$f" == *"HARNESS_PUSH_GATE.md"* ]]; then
        continue
      fi
      echo "FAIL: $f contains forbidden pattern: $pat"
      fail=1
    fi
  done

  local is_critical=0
  for g in "${CRITICAL_GLOBS[@]}"; do
    if [[ "$f" == "$g"* ]] || [[ "$f" == */"$g"* ]]; then
      is_critical=1
      break
    fi
  done
  if [[ $is_critical -eq 1 ]] && [[ "$size" -lt 80 ]]; then
    if [[ "$f" == *".gitkeep"* ]]; then
      return 0
    fi
    echo "FAIL: $f is critically small (${size} bytes)"
    fail=1
  fi
}

if [[ $# -gt 0 ]]; then
  for p in "$@"; do
    check_file "$p"
  done
else
  while IFS= read -r -d '' f; do
    check_file "$f"
  done < <(find AGENT.md MEMORY.md feature_list.json progress.md session-handoff.md runs.md init.sh audit-harness.sh docs tools src -type f 2>/dev/null -print0 || true)
fi

if [[ $fail -ne 0 ]]; then
  echo "assert_no_stub: FAILED"
  exit 1
fi
echo "assert_no_stub: OK"
exit 0
