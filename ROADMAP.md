# Agent OS — Production Roadmap

## Positioning

Existing visual agent builders (Flowise, Langflow, Dify, n8n AI nodes) optimize for **composing LLM pipelines**.
Agent OS optimizes for **operating a coding-agent system as a graphical OS**:

| Typical builder | Agent OS |
|---|---|
| Drag LLM/RAG/tool nodes | Agent / Tool / Skill / File / Harness as OS citizens |
| Chat as primary UX | **Graph is the primary surface** |
| Generic multi-agent | **Coding-agent + harness engineering** |
| Cloud / Docker platform | **Local-first desktop (Tauri)** |
| Pretty demos | **High information density + observation** |

We learn good ideas; we do not copy mediocre product shapes.

## Adopted ideas

**agent-harnesses progressive disclosure**
- `HARNESS.md` root identity
- Route dirs + routing index files
- Leaf / `SKILL.md` boundaries
- Load → Discovery → Activation → Execution

**Live observation (ahar / coding-agent visualizers)**
- Activity lights structural nodes
- Event stream as first-class window

**Production frameworks (concepts, not Studio UX)**
- Explicit graph state
- Traceable edges over time

**Tauri production patterns**
- Browser-runnable frontend; host I/O behind platform boundary later
- Domain models separate from React Flow props

## Rejected

- Chat-first shells with decorative diagrams
- Low-density “AI startup” UI
- Single-orchestrator lock-in
- Treating visual builders as a substitute for harness engineering

## Checkpoints

| CP | Status | Scope |
|----|--------|--------|
| CP0 | done | Desktop shell, graph, runtime demo, harness sketch |
| CP1 | done | Domain graph model, add/delete, inspector, toolbar |
| CP2 | done | Harness model + content inspector |
| CP3 | partial | Files panel, local save/load, export JSON |
| CP4 | next | Transcript adapter interface, replay |
| CP5 | later | Tauri `src/platform/`, FS, process |
| CP6 | later | Undo, layout engine, export image, perf |

## When to run a full demo

Suggested bar:
1. Graph edit + inspector works
2. Harness inspector shows markdown-shaped content
3. Save/Load project in browser
4. Runtime demo drives graph highlights

CP0–CP3 cover that bar. CP4+ adds depth before real agent wiring.
