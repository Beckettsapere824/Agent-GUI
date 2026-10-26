# Agent OS — Production Roadmap

## Checkpoints

| CP | Status | Scope |
|----|--------|--------|
| CP0–CP6 | done | Shell → platform → undo/layout/SVG/allowlist |
| CP7 | done | Global shortcuts, help overlay, status bar, session import UX |
| CP8 | later | Real agent process attach, fs watch, multi-project |

## CP7 notes

- Keys `1–5` open/focus Graph / Harness / Runtime / Files / Shell
- `?` help overlay · `Ctrl/⌘S` save project · Esc closes help
- Top status bar: project name, graph size, host kind, live/replay
- Runtime **Import**: presets, file picker, drag-and-drop JSONL, Load/Replay

## Run

```bash
git pull && npm install && npm run dev
```

Press `?` for shortcuts. Open Runtime → Import → Sample Claude-code → Replay.
