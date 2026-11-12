# AGENT.md — Operating Contract for Any Agent

This file is the **entry point**. Any coding agent (Grok, Claude, Codex, etc.) working in this repository must read it first.

Read order: `AGENT.md` → `MEMORY.md` → `feature_list.json` → `progress.md` (and `session-handoff.md` / `runs.md` if present) → run `./init.sh`.

Harness core transplanted from [agent-harness](https://github.com/Beckettsapere824/agent-harness) (portable contract only — no `eval/` / `work/` packs).

---

## Mission

Build **Agent OS**: a production desktop shell (Tauri 2 + React) where agent-driven coding, harness engineering, and graph engineering are first-class visual citizens — not a chat wrapper or game UI.

---

## Startup Workflow (mandatory)

Before writing code or claiming progress:

1. Confirm working directory / repo context (`Agent-GUI`).
2. Read this file completely.
3. Read `MEMORY.md` (status, pitfalls, recent log).
4. Run `./init.sh` (or the verification commands listed at the bottom). Fix failures before new scope.
5. Read `feature_list.json`. Select **exactly one** unfinished feature.
6. Read `progress.md`, `session-handoff.md`, and recent entries in `runs.md` if they exist.
7. Load `ROADMAP.md`, `src/`, or `docs/` only when needed for the chosen feature.

If baseline verification fails, repair that first.

---

## Working Rules (invariants)

- **One feature at a time.** Do not start a second feature until the current one has evidence of done.
- **Verification required.** Do not mark a feature done or say “done” without running the verification commands and recording evidence in `feature_list.json` or `progress.md`.
- **Repo is the system of record.** Chat history is ephemeral. All durable state lives in the files above.
- **Stay in scope.** Do not modify unrelated files or rewrite the feature list to hide unfinished work.
- **Leave clean state.** The next session/dialog must be able to run `./init.sh` immediately.
- **Honest reporting.** Mark drafts unfinished; report failures as failures; do not bypass limits to avoid asking.
- **Log every run.** Append a duration entry to `runs.md` before ending the dialog (see End of Session).
- **Do not touch upstream agent-harness.** This repo consumes a *copy* of the portable core; never modify `Beckettsapere824/agent-harness` unless the human explicitly asks.

---

## Definition of Done

A feature is done only when **all** of the following are true:

- [ ] Target behavior is implemented
- [ ] Required verification actually ran (tests / type-check / build / smoke)
- [ ] Evidence recorded in `feature_list.json` or `progress.md`
- [ ] Repository remains restartable from the standard startup path

---

## End of Session / Dialog

Before ending:

1. Update `progress.md` with current state and **exact** next concrete step.
2. Update `feature_list.json` status and evidence fields.
3. If work is incomplete, refresh `session-handoff.md` including **all** of:
   - Active feature (id + title)
   - **Timing**: last run duration, feature start, elapsed wall time, expected remaining
   - What was done / what remains (actionable)
   - **Resume checklist** (ordered steps for the next agent)
   - **Known failure modes** relevant to current work
4. **Prepend a run entry to `runs.md`** (approx duration, feature, outcome, handoff quality).
5. Commit only when the tree is in a safe, restartable state.
6. Prefer short, actionable notes over long narrative.

A fresh agent must be able to resume from files alone. If the next agent would need to ask “what were we doing?”, the handoff is incomplete.

---

## Verification Commands

```bash
# Primary entrypoint
./init.sh

# Optional structural self-check
./audit-harness.sh

# Project checks (also invoked from init.sh when deps present)
npm install
npm run build
```

---

## Escalation

- Architecture or product decisions → consult `ROADMAP.md` / `README.md`, otherwise ask the human.
- Unclear requirements → ask one concrete question; do not invent scope.
- Repeated verification failures → update progress, leave a clear blocker note, stop.

---

## Pointers (directory page)

| Path | Role |
|------|------|
| `MEMORY.md` | Status, pitfalls, log |
| `feature_list.json` | Structured features + evidence |
| `progress.md` | Live session continuity |
| `session-handoff.md` | Explicit handoff (timing + resume checklist + failure modes) |
| `runs.md` | Per-session duration + outcome log |
| `init.sh` | Startup + verification |
| `audit-harness.sh` | Minimal structural self-check |
| `ROADMAP.md` | Product checkpoints (CP0+) |
| `src/` | Tauri/React application |
| `.grok/README.md` | Grok-oriented harness notes |

Keep this file short. Put project facts in `ROADMAP.md` or domain modules, not here.
