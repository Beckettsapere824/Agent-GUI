# Agent OS

Graphical operating system for **Agent-driven coding**, **Harness engineering**, and **Graph engineering**.

Not a chat wrapper. Not another Flowise clone. A local-first desktop environment where agent graphs, harness structures, and coding sessions are first-class visual objects.

See [ROADMAP.md](./ROADMAP.md) for positioning, adopted ideas, rejected patterns, and checkpoints.

## Stack

- **Tauri 2** — native desktop, small binary
- **React + TypeScript + Vite**
- **@xyflow/react** — interactive graphs
- **Zustand** — OS + domain state
- **Tailwind** — dense dark UI

## Status

**CP0 done · CP1 in progress**

- Desktop shell (windows, taskbar, resize, z-order)
- Agent Graph with domain model + inspector + add/delete
- Harness structure panel (sketch)
- Runtime event stream with demo run driving graph highlights

## Run

```bash
npm install
npm run dev          # browser
npm run tauri:dev    # desktop (needs Rust)
```

## Design principles

1. Graph is the primary surface
2. High information density
3. Local-first
4. Harness / progressive disclosure as a first-class concept
5. Observation (events lighting structure) over pure authoring chrome

---

MIT License
