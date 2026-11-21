# Agent OS — Production Roadmap

| CP | Status | Scope |
|----|--------|--------|
| CP0–CP21 | done | Shell → links + live edges |
| CP22 | done | Persist link table in project snapshot |
| CP23 | next | Tauri hardening (native watch / packaging notes) |

## CP22

- `ProjectSnapshot.links` saved/loaded with project
- Profile pair export/import carries `links`
- Missing `links` on old saves → seed `sampleLinks`

```bash
git pull && npm run dev
# Bind a node → Ctrl+S → reload → bindings remain
```
