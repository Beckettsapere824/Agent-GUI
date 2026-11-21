# HARNESS_LESSONS.md — Binding Failure Ledger

Newest classes at the **top**. **This file is binding for agents.**

Portable lessons adapted from [agent-harness](https://github.com/Beckettsapere824/agent-harness) (read-only upstream). Product-specific notes live under Agent-GUI.

---

## Hard rules (extract)

### Continuity

- Chat is ephemeral. Only repo state counts across dialogs.
- `progress.md` must contain an **exact** next step. "Continue" alone is insufficient.
- `session-handoff.md` must include Timing, Resume checklist, and Known failure modes when work is incomplete.

### Verification & evidence

- Never mark a feature `done` without runnable verification evidence in `feature_list.json` or `progress.md`.
- Prefer mechanical checks (`./init.sh`, `npm run build`, `./tools/assert_no_stub.sh`) over self-assessment.
- Duration must be logged in `runs.md` before ending a dialog.

### File push / content integrity

- See `docs/HARNESS_PUSH_GATE.md`. No PLACEHOLDER / stub content for critical paths.
- After any non-trivial push, verify file size + required markers when tools allow.

### Scope

- Exactly one active feature (`in_progress`) at a time.
- **Do not modify** upstream `Beckettsapere824/agent-harness` unless the human explicitly asks.

### Product dual-surface

- Root operating harness (AGENT.md …) and visual harness (`src/harness`) coexist. Do not delete one when evolving the other.

---

## Lessons captured

### 2026-11-21 — Agent-GUI product

1. **Link table not in snapshot** — Graph↔harness binds were runtime-only and vanished on reload. Mitigation: CP22 `ProjectSnapshot.links` + profile pair export.
2. **workspaceStore name collision** — Files panel expected FS API; profile/layout store overwrote it. Mitigation: single store with both FS + chrome fields.

### From agent-harness upstream (2026-11-17)

3. **Missing mechanical push gate** — Mitigation: `docs/HARNESS_PUSH_GATE.md` + `tools/assert_no_stub.sh`.
4. **Shallow handoff** — Mitigation: enforce "Next exact" in progress.md.
5. **Failure classes evaporate** — Mitigation: this binding ledger.
6. **AGENT.md encyclopedia risk** — Keep entry point short; details in docs/.
