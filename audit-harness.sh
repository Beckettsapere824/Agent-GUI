#!/usr/bin/env bash
# audit-harness.sh — Structural audit for Agent-GUI portable harness
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

echo "== Agent-GUI harness audit =="
echo "Repo: $(pwd)"
echo

echo "Core files"
for f in AGENT.md MEMORY.md feature_list.json progress.md init.sh; do
  if [[ -f "$f" ]]; then check "$f present" "pass"; else check "$f present" "fail"; fi
done

for f in session-handoff.md runs.md README.md .grok/README.md docs/HARNESS_LESSONS.md docs/HARNESS_PUSH_GATE.md docs/EXIT_CRITERIA.md tools/assert_no_stub.sh; do
  if [[ -f "$f" ]]; then check "$f present (recommended)" "pass"; else check "$f present (recommended)" "fail"; fi
done

echo
echo "Permissions"
if [[ -x init.sh ]]; then check "init.sh is executable" "pass"; else check "init.sh is executable" "fail"; fi
if [[ -f tools/assert_no_stub.sh ]]; then
  if [[ -x tools/assert_no_stub.sh ]]; then check "tools/assert_no_stub.sh is executable" "pass"; else check "tools/assert_no_stub.sh is executable" "fail"; fi
fi

echo
echo "feature_list.json"
if command -v python3 >/dev/null 2>&1; then
  if python3 -c "
import json, sys
data = json.load(open('feature_list.json'))
assert isinstance(data, dict) and isinstance(data.get('features'), list)
for i, f in enumerate(data['features']):
    for key in ('id', 'title', 'status', 'definition_of_done'):
        assert key in f, f'missing {key} at {i}'
" 2>/dev/null; then
    check "valid JSON + required fields" "pass"
  else
    check "valid JSON + required fields" "fail"
  fi
else
  if [[ -s feature_list.json ]]; then check "feature_list.json non-empty" "pass"; else check "feature_list.json non-empty" "fail"; fi
fi

echo
echo "progress.md"
if [[ -f progress.md ]] && grep -qiE 'next exact|\*\*Next exact\*\*|Next step' progress.md; then
  check "progress.md mentions Next exact / next step" "pass"
else
  check "progress.md mentions Next exact / next step" "fail"
fi

echo
echo "session-handoff.md"
if [[ -f session-handoff.md ]] && grep -qiE 'Timing|Resume checklist|Known failure' session-handoff.md; then
  check "session-handoff has Timing / Resume / failure modes" "pass"
else
  check "session-handoff has Timing / Resume / failure modes" "fail"
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
