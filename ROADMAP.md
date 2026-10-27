# Agent OS — Production Roadmap

| CP | Status | Scope |
|----|--------|--------|
| CP0–CP13 | done | Shell → multi-session / kill |
| CP14 | done | Session event filters; Tauri notify watcher |
| CP15 | next | Session-scoped graph highlight; agent profile presets |

## CP14

- Activity events carry `sessionId`
- Runtime: **all** filter + click session chip to filter stream
- Tauri: `watch_path_native` / `unwatch_path_native` via `notify` crate; frontend falls back to meta-poll
