# EXIT_CRITERIA.md — Measurable bars for Agent OS GUI

Updated: 2026-11-21

Product bars for **Agent-GUI** (not the upstream agent-harness eval packs).

## Thesis

A production agent OS shell is ready when a developer can open the desktop, load a project (graph + harness + links + profile/layout), attach a session, and resume agent work from repo files without chat history.

## Exit bars

| ID | Bar | Status |
|----|-----|--------|
| **G1** | Desktop shell: windows, graph, harness panel, runtime, files, shell | Met (CP0–CP15) |
| **G2** | Profiles + layouts + palette + project snapshot (profile/layout) | Met (CP16–CP19) |
| **G3** | Attach presets + transcript profile hints | Met (CP20) |
| **G4** | Editable graph↔harness links + live edge emphasis | Met (CP21) |
| **G5** | Links persist in project snapshot / export / import | Met (CP22) |
| **G6** | Portable operating harness in-repo (AGENT.md … init/audit) | Met (H001) |
| **G7** | `./init.sh` green on clean clone (`npm run build`) | Soft — confirm locally |
| **G8** | Native Tauri desktop path production-hardened (FS notify, packaging) | Open |
| **G9** | Real agent process attach beyond demo/replay (stdio/file-tail reliability) | Partial |

### Soft product exit

**DECLARED when G1–G6 are green.** G7–G9 remain ongoing production pressure.
