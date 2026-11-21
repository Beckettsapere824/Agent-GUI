#!/usr/bin/env bash
# init.sh — Startup health check + verification (Agent-GUI)
set -euo pipefail

echo "== Agent-GUI harness init =="

required_files=("AGENT.md" "MEMORY.md" "feature_list.json" "progress.md")
missing=0
for f in "${required_files[@]}"; do
  if [[ ! -f "$f" ]]; then echo "MISSING: $f"; missing=1; else echo "OK: $f"; fi
done
if [[ $missing -ne 0 ]]; then echo "init failed: required harness files missing"; exit 1; fi

for f in docs/HARNESS_LESSONS.md docs/EXIT_CRITERIA.md tools/assert_no_stub.sh; do
  if [[ -f "$f" ]]; then echo "OK: $f"; else echo "NOTE: $f not present (recommended)"; fi
done

if command -v python3 >/dev/null 2>&1; then
  python3 -c "import json; json.load(open('feature_list.json'))" \
    && echo "OK: feature_list.json is valid JSON" \
    || { echo "FAIL: feature_list.json is not valid JSON"; exit 1; }
fi

if [[ -f package.json ]]; then
  if command -v npm >/dev/null 2>&1; then
    if [[ ! -d node_modules ]]; then
      echo "== npm install =="
      npm install --no-audit --no-fund
    fi
    echo "== npm run build =="
    npm run build
    echo "OK: npm run build"
  else
    echo "WARN: npm not found; skipped package build"
  fi
fi

echo "Hint: ./audit-harness.sh && ./tools/assert_no_stub.sh"
echo "== init complete =="
