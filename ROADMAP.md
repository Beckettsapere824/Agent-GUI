# Agent OS — Production Roadmap

| CP | Status | Scope |
|----|--------|--------|
| CP0–CP18 | done | Shell → layouts / status profile |
| CP19 | done | Persist layout + profile in project snapshot |
| CP20 | next | Session attach presets; transcript → profile hints |

## CP19

- `ProjectSnapshot` carries optional `profileId` / `profileName` / `layoutId`
- Save / load / export / import restore workspace chrome
- Loading a snapshot with `layoutId` re-runs `applyLayout`
- Desktop mounts with `loadLocal()` so last session returns

```bash
git pull && npm run dev
# set Profile + Layout → Ctrl+S → reload page
```
