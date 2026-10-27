# Agent OS — Production Roadmap

| CP | Status | Scope |
|----|--------|--------|
| CP0–CP16 | done | Shell → profile/harness + Ctrl+K |
| CP17 | done | Palette plugins; profile-pair export/import |
| CP18 | next | Status-bar profile indicator; multi-window layout presets |

## CP17

- `registerPalettePlugin` / `collectPluginActions` — third-party palette actions
- Built-ins: Windows, Profiles, Runtime, Project (save/export/import)
- **Profile pair** JSON (`kind: agent-os-profile`) = graph + harness portable bundle

```bash
git pull && npm run dev
# Ctrl+K → "Export profile pair" / "Import profile pair"
```
