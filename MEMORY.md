# MEMORY.md — Persistent Project Memory

Newest at top of each section.

---

## Status

### Current focus

- Soft product exit **G1–G6** met (shell through link persistence).
- **Next exact product work:** CP23 Tauri production hardening (G8).

### Done

- CP0–CP22 product arc.
- H001 / H003 portable harness + hardening docs (upstream read-only).
- H002 init.sh build gate (confirm G7 on clean clone).

### Next

- CP23 / G8 Tauri path.
- G9 deeper real-agent attach reliability.

---

## Pitfalls / decisions

- Never modify upstream agent-harness unless asked.
- Operating harness (root) ≠ visual harness (`src/harness`).
- Links must live in ProjectSnapshot (CP22) or they evaporate.

---

## Log

### 2026-11-21

- Re-sync from agent-harness docs; CP22 links persistence.

### 2026-11-12

- Initial harness transplant; CP21 links UI.
