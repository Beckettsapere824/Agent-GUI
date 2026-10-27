# Agent OS — Production Roadmap

| CP | Status | Scope |
|----|--------|--------|
| CP0–CP15 | done | Shell → session highlight / profiles |
| CP16 | done | Profile ↔ harness binding; Ctrl+K command palette |
| CP17 | next | Palette plugins; project export of profile pair |

## CP16

- Each profile ships a matching **HarnessModel** (`applyProfile` updates graph + harness)
- **Ctrl/⌘ K** command palette: windows, profiles, runtime demo/stop
- Graph toolbar profiles use the same `applyProfile` path
