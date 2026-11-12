# MEMORY.md — Persistent Project Memory

Newest entries at the **top** of each section.

---

## Status

### Current focus

- **Repo:** Agent-GUI (Agent OS desktop shell).
- **Harness core:** Portable contract transplanted from agent-harness (2026-11-12). Upstream `agent-harness` must not be modified for this work.
- **Active:** See `feature_list.json` / `progress.md` (next product CP after CP20).

### Done

- CP0–CP20 shell: windows, graph, harness UI, runtime attach, profiles/layouts, palette, persistence, attach presets, profile hints.
- Portable harness files landed at repo root (`AGENT.md`, `MEMORY.md`, `feature_list.json`, `progress.md`, `session-handoff.md`, `runs.md`, `init.sh`, `audit-harness.sh`, `.grok/README.md`).

### Next

- CP21: Harness leaf ↔ graph node binding; live edge emphasis (product).
- Optional: wire `feature_list` IDs to ROADMAP CPs more tightly; keep one active feature only.

---

## Pitfalls / decisions

- Prefer short root `AGENT.md`; do not grow it into an encyclopedia.
- Verification must be runnable commands (`./init.sh`, `npm run build`), not model self-assessment.
- One active feature at a time.
- **Duration matters:** log wall-clock in `runs.md`.
- Soft chat continuity does not validate persistence — files are the system of record.
- Do **not** push to `agent-harness` when working in Agent-GUI unless explicitly requested.
- GUI domain harness (`src/domain/sampleHarness.ts`, Harness panel) is the *visual* progressive-disclosure model; root harness files are the *agent operating* contract — both coexist.

---

## Log

### 2026-11-12

- Transplanted portable agent-harness core into Agent-GUI; adapted Mission / init / feature list for this product.
- Confirmed upstream agent-harness left untouched.

### 2026-10-27 (historical product)

- CP16–CP20: profile↔harness, palette plugins, layouts, project snapshot persistence, attach presets + profile hints.
