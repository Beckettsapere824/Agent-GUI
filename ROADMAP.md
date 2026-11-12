# Agent OS — Production Roadmap

| CP | Status | Scope |
|----|--------|--------|
| CP0–CP20 | done | Shell → attach presets / profile hints |
| CP21 | done | Harness ↔ graph links; live edge emphasis |
| CP22 | next | Persist link table in project snapshot |

## CP21

- `useLinkStore` — bind / unbind / replace (seeded from `sampleLinks`)
- Graph inspector: bind harness leaf/skill; jump to Harness
- Harness inspector: list graph links; jump to Graph
- Active runtime nodes → amber animated edges (graph + harness)

```bash
git pull && npm run dev
# Select tool/skill → Bind harness… · Run demo → watch edges pulse
```
