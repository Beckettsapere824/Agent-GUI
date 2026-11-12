#!/usr/bin/env bash
# init.sh — Startup health check + verification entrypoint (Agent-GUI)
# Portable harness pattern from agent-harness; project checks customized here.
set -euo pipefail

echo "== Agent-GUI harness init =="

# --- Presence checks (harness hygiene) ---
required_files=(
  "AGENT.md"
  "MEMORY.md"
  "feature_list.json"
  "progress.md"
)

missing=0
for f in "${required_files[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "MISSING: $f"
    missing=1
  else
    echo "OK: $f"
  fi
done

if [[ $missing -ne 0 ]]; then
  echo "init failed: required harness files missing"
  exit 1
fi

if command -v python3 >/dev/null 2>&1; then
  python3 -c "import json; json.load(open('feature_list.json'))" \
    && echo "OK: feature_list.json is valid JSON" \
    || { echo "FAIL: feature_list.json is not valid JSON"; exit 1; }
fi

# --- Project-specific verification ---
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
else
  echo "WARN: package.json missing; skipped package build"
fi

echo "== init complete =="
