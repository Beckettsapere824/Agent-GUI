# Agent OS — Production Roadmap

## Checkpoints

| CP | Status | Scope |
|----|--------|--------|
| CP0–CP7 | done | Shell → platform → undo → shortcuts/import |
| CP8 | done | Multi-project, agent session API, file-tail, fs watch stubs |
| CP9 | in progress | Live session mode, auto-map unknown tools/files onto graph |
| CP10 | later | Native fs notify, stdio agent process |

## Host verification (sandbox Vite)

- Graph boots; Run demo via session store streams events (`demo · running`)
- Cascade window positions leave Graph visible under Runtime
- Files → Projects: Save + registry list works
- Virtual tree includes `sessions/`
