# Agent OS — Production Roadmap

## Positioning (why this is not another Flowise / Langflow / Dify)

Existing visual agent builders optimize for **composing LLM pipelines**.
We optimize for **operating a coding-agent system as a graphical OS**:

| Their focus | Our focus |
|---|---|
| Drag LLM / RAG / tool nodes into a flow | Agent / Tool / Skill / File / Harness as OS citizens |
| Chat panel as primary UX | **Graph is the primary surface** |
| Generic multi-agent orchestration | **Coding-agent + harness engineering** specifically |
| Cloud / Docker platform | **Local-first desktop (Tauri)** |
| Pretty demos | **High information density, production observation** |

We take good ideas from the ecosystem; we do not copy mediocre product shapes.

## Ideas we deliberately adopt

From **agent-harnesses** / progressive disclosure:
- `HARNESS.md` as root identity
- Route directories + routing index files (`TOOLS.md`, `SKILLS.md`)
- Leaf detectors / `SKILL.md` boundaries
- Load → Discovery → Activation → Execution phases

From **ahar-visualizer / coding-agent-visualizer**:
- Live activity lighting of structural nodes
- Session event stream as a first-class surface
- Compact shape language over label soup

From **LangGraph / production frameworks** (not their Studio UX):
- Explicit graph state, durable runs, human checkpoints as concepts
- Traceability: every edge should eventually cite why it exists

From **Tauri production patterns**:
- Frontend stays runnable in browser; host I/O behind `src/platform/`
- Zustand for UI/OS state; domain models separate from React Flow props
- `nodeTypes` defined outside components

## What we reject

- Chat-first shells with a diagram as decoration
- Low-density “AI startup” aesthetics
- Framework lock-in to one orchestrator (LangGraph-only, Crew-only, …)
- Pretending visual builders replace code-first harness engineering

## Checkpoints

### CP0 — Skeleton (done)
Desktop shell, multi-window, Agent Graph, demo Runtime stream, Harness structure sketch.

### CP1 — Graph as an editor (this commit)
- Add / delete nodes and edges
- Context-driven node palette
- Node inspector (properties panel)
- Domain graph model independent of React Flow

### CP2 — Harness engineering depth
- Canonical harness tree model (root / route / leaf / skill)
- Inspector shows HARNESS.md / SKILL.md excerpts
- Map harness leaves ↔ agent graph tools/skills

### CP3 — Project & Files
- Files window: virtual project tree
- FILE nodes bind to paths
- Open project / save graph JSON (local)

### CP4 — Observation layer
- Unified activity bus
- Transcript adapter interface (Claude Code / Codex / generic JSONL)
- Replay mode + live mode switch

### CP5 — Host integration (Tauri)
- `src/platform/` boundary
- FS watch, open folder, spawn process stubs
- Persistence via Rust commands when available, localStorage fallback in web

### CP6 — Production hardening
- Keyboard shortcuts, undo stack for graph edits
- Layout algorithms (dagre/ELK optional)
- Export PNG/SVG of graphs
- Performance pass for large graphs

## Demo readiness bar (when you should run)

You can wait until:
1. Graph edit is complete (add/remove/inspect)
2. Harness inspector shows real markdown-shaped content
3. Save/load project works in browser
4. Runtime demo clearly drives graph highlights

That is roughly end of **CP3**. Before that, incremental commits remain self-contained.
