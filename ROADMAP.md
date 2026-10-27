# Agent OS — Production Roadmap

| CP | Status | Scope |
|----|--------|--------|
| CP0–CP17 | done | Shell → palette plugins / profile pair |
| CP18 | done | Status-bar profile; multi-window layout presets |
| CP19 | next | Persist layout + profile with project snapshot |

## CP18

- Status bar: `profile:…` / `layout:…`
- Layouts via Ctrl+K: Focus Graph, Coding, Harness design, Debug
- `applyLayout` opens/positions windows and minimizes the rest

```bash
git pull && npm run dev
# Ctrl+K → Layout: Coding
```
