# Agent OS

Graphical operating system for **Agent-driven coding**, **Harness engineering** and **Graph engineering**.

Not a chat wrapper. A real desktop environment where agent graphs, harness structures and coding sessions are first-class visual objects.

## Tech Stack

- **Tauri 2** — small binary, strong security, native desktop
- **React + TypeScript + Vite**
- **@xyflow/react** — production-grade interactive graph
- **Zustand** — lightweight state
- **Tailwind** — fast styling

## Current Status (v0.1)

- Desktop shell with movable / minimizable / maximizable windows
- Taskbar + multi-window management
- Main **Agent Graph** workspace with custom node types (Agent / Tool / Skill / File)
- Dark OS aesthetic, high information density

## Quick Start

### Prerequisites

- Node.js 20+
- Rust (for Tauri) — https://rustup.rs
- Tauri system dependencies: https://v2.tauri.app/start/prerequisites/

### Run (Web preview — fastest)

```bash
npm install
npm run dev
```

Open http://localhost:1420

### Run (Real Desktop App)

```bash
npm install
npm run tauri:dev
```

### Build release

```bash
npm run tauri:build
```

## Roadmap

1. Harness structure visualization
2. Agent runtime event stream (light up nodes)
3. Trace & waterfall view
4. Code diff & file heat
5. Real agent process management via Tauri

## Design Principles

- Graph is the primary surface
- High information density
- Local-first
- Specialized windows (Graph / Harness / Runtime / Files / Logs)

---

MIT License
