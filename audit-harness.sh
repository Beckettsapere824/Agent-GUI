#!/usr/bin/env bash
# audit-harness.sh — Minimal zero-dependency audit for the portable harness
# Usage: ./audit-harness.sh [path/to/repo]
# Exit 0 if all required checks pass; exit 1 otherwise.
set -euo pipefail

REPO="${1:-.}"
cd "$REPO"

pass=0
fail=0

check() {
  local name="$1"
  local ok="$2"
  if [[ "$ok" == "pass" ]]; then
    echo "  PASS  $name"
    pass=$((pass + 1))
  else
    echo "  FAIL  $name"
    fail=$((fail + 1))
  fi
}

echo "== agent-harness audit (Agent-GUI) =="
echo "Repo: $(pwd)"
echo

echo "Core files"
for f in AGENT.md MEMORY.md feature_list.json progress.md init.sh; do
  if [[ -f "$f" ]]; then
    check "$f present" "pass"
  else
    check "$f present" "fail"
  fi
done

for f in session-handoff.md runs.md README.md .grok/README.md; do
  if [[ -f "$f" ]]; then
    check "$f present (recommended)" "pass"
  else
    check "$f present (recommended)" "fail"
  fi
done

echo
echo "Permissions"
if [[ -x init.sh ]]; then
  check "init.sh is executable" "pass"
else
  check "init.sh is executable" "fail"
fi

echo
echo "feature_list.json"
if command -v python3 >/dev/null 2>&1; then
  if python3 -c "
import json, sys
try:
    data = json.load(open('feature_list.json'))
except Exception as e:
    print(e)
    sys.exit(1)
if not isinstance(data, dict):
    print('root is not an object')
    sys.exit(1)
if 'features' not in data or not isinstance(data['features'], list):
    print('missing features array')
    sys.exit(1)
for i, f in enumerate(data['features']):
    for key in ('id', 'title', 'status', 'definition_of_done'):
        if key not in f:
            print(f'feature[{i}] missing {key}')
            sys.exit(1)
" 2>/dev/null; then
    check "valid JSON + required fields (id/title/status/definition_of_done)" "pass"
  else
    check "valid JSON + required fields (id/title/status/definition_of_done)" "fail"
  fi
else
  if [[ -s feature_list.json ]]; then
    check "feature_list.json non-empty (python3 not available for deeper check)" "pass"
  else
    check "feature_list.json non-empty" "fail"
  fi
fi

echo
echo "------------------------------"
echo "Result: $pass passed, $fail failed"
if [[ $fail -eq 0 ]]; then
  echo "OK: harness audit passed"
  exit 0
else
  echo "FAIL: harness audit found issues"
  exit 1
fi
