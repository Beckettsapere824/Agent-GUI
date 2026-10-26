# Agent OS — Production Roadmap

## Checkpoints

| CP | Status | Scope |
|----|--------|--------|
| CP0–CP5 | done | Shell, graph, harness, files, transcript, platform |
| CP6 | done | Undo/redo, auto-layout, SVG export, command allowlist |
| CP7 | next | Polish + deeper agent wiring (session import UX, multi-window keyboard) |

## CP6 notes

- Graph history stack (add/remove/edit/layout); Ctrl/Cmd+Z / Shift+Z
- `autoLayout` by node kind columns (no dagre dependency)
- Domain → SVG export download
- Shell `checkCommand` allowlist shared by web + Tauri front door

## Demo bar (ready to run)

```bash
git pull && npm install && npm run dev
```

1. Agent Graph — edit, Undo, Layout, SVG
2. Runtime — Run demo / paste transcript
3. Harness — structure + inspector + links from graph
4. Files — browse virtual tree, + graph, preview
5. Shell — allowlisted commands
