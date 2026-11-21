# AGENT.md — Operating Contract for Any Agent

This file is the **entry point**. Any coding agent working in **Agent-GUI** must read it first.

**Read order:** `AGENT.md` → `MEMORY.md` → `docs/HARNESS_LESSONS.md` (skim) → `feature_list.json` → `progress.md` → `session-handoff.md` / `runs.md` → run `./init.sh`.

Portable harness pattern from [agent-harness](https://github.com/Beckettsapere824/agent-harness) (**read-only** upstream — do not modify that repo unless the human explicitly asks).

---

## Mission

Build **Agent OS**: a production desktop shell (Tauri 2 + React) where agent-driven coding, harness engineering, and graph engineering are first-class visual citizens — not a chat wrapper or game UI.

---

## Startup Workflow (mandatory)

1. Confirm repo context (`Agent-GUI`).
2. Read this file completely.
3. Read `MEMORY.md`.
4. Skim `docs/HARNESS_LESSONS.md` and `docs/EXIT_CRITERIA.md`.
5. Run `./init.sh`. Fix failures before new scope.
6. Optionally `./audit-harness.sh` and `./tools/assert_no_stub.sh`.
7. Read `feature_list.json`. Select **exactly one** unfinished feature.
8. Read `progress.md` (**Next exact**), `session-handoff.md`, recent `runs.md`.
9. Load `ROADMAP.md` / `src/` only as needed for that feature.

---

## Working Rules (invariants)

- **One feature at a time** with evidence before `done`.
- **Repo is system of record** — chat is ephemeral.
- **Log every run** in `runs.md`.
- **Push integrity** — follow `docs/HARNESS_PUSH_GATE.md`; run `./tools/assert_no_stub.sh` when possible.
- **Never touch upstream agent-harness** unless explicitly requested.

---

## Definition of Done

- [ ] Behavior implemented
- [ ] Verification ran (`./init.sh` / `npm run build` / relevant smoke)
- [ ] Evidence in `feature_list.json` or `progress.md`
- [ ] Tree restartable from standard startup path

---

## End of Session

1. Update `progress.md` with **Next exact**.
2. Update `feature_list.json`.
3. Refresh `session-handoff.md` if incomplete (Timing, Resume checklist, Known failure modes).
4. Prepend `runs.md`.
5. Append new failure classes to `docs/HARNESS_LESSONS.md`.
6. Commit only when safe.

---

## Verification Commands

```bash
./init.sh
./audit-harness.sh
./tools/assert_no_stub.sh
npm run build   # also via init.sh when node_modules present
```

---

## Pointers

| Path | Role |
|------|------|
| `MEMORY.md` | Status, pitfalls, log |
| `docs/HARNESS_LESSONS.md` | Binding failure ledger |
| `docs/HARNESS_PUSH_GATE.md` | Anti-stub gate |
| `docs/EXIT_CRITERIA.md` | Product bars G1–G9 |
| `feature_list.json` | Features + evidence |
| `progress.md` | Continuity + **Next exact** |
| `ROADMAP.md` | Product checkpoints |
| `src/` | Application |
| `.grok/README.md` | Grok notes |
