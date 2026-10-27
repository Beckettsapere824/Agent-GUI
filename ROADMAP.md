# Agent OS — Production Roadmap

## Checkpoints

| CP | Status | Scope |
|----|--------|--------|
| CP0–CP8 | done | OS shell through multi-project + session API |
| CP9 | done | Silent ensureNode/auto-map, live mode, Attach UI |
| CP10 | partial | Stdio transport (one-shot via allowlist), `file_meta` on Tauri |
| CP11 | next | Streaming spawn, native notify watcher |

## CP9–10 notes

- `ensureNode` / `ensureEdge` — session graph mutations skip undo stack
- Runtime **Attach**: Tail file, Stdio command, presets, auto-map toggle
- `attachStdio` runs allowlisted command, parses stdout as JSONL, streams events
- Tauri `file_meta` for efficient change detection (length/mtime)

## Run

```bash
git pull && npm install --registry https://registry.npmjs.org && npm run dev
```
