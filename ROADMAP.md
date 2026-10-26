# Agent OS — Production Roadmap

## Checkpoints

| CP | Status | Scope |
|----|--------|--------|
| CP0–CP7 | done | Shell → platform → undo → shortcuts/import |
| CP8 | done | Multi-project registry, agent session API, file-tail attach, fs watch stubs |
| CP9 | next | Native fs notify, stdio agent process, session graph auto-map |

## CP8 notes

- `src/agent/` — `AgentRuntime` with **demo** and **file-tail** transports
- Runtime: Run demo uses session store; Import → **Attach tail** polls a jsonl path
- `platform.watchPath` — poll-based on web + tauri (native notify later)
- Files → **Projects**: new / switch / delete; registry in localStorage

## Verified on host (sandbox)

- Vite boots after transcript/samples syntax fixes
- Graph + Run demo event stream + Help overlay
