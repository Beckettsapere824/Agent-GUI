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

## Checkpoints

| CP | Status | Scope |
|----|--------|--------|
| CP0 | done | Desktop shell, graph, runtime demo, harness sketch |
| CP1 | done | Domain graph model, add/delete, inspector, toolbar |
| CP2 | done | Harness model + content inspector |
| CP3 | done | Files panel, local save/load, export JSON |
| CP4 | done | Transcript adapter, replay, graph↔harness links |
| CP5 | next | Tauri `src/platform/`, FS stubs, process stubs |
| CP6 | later | Undo, layout engine, export image, perf |

## CP4 notes

- `src/runtime/transcript.ts` — parse generic JSONL and Claude-Code-ish lines; `inferNodeId` maps labels onto sample graph
- Runtime **Transcript** panel: paste → Load or Replay
- Demo run now goes through the same transcript path
- `src/domain/links.ts` — explicit graph node ↔ harness node relations; inspector can open Harness on a linked node
- Files **+ graph** writes correct `path` / `label` on the new FILE node

## When to run a full demo

CP0–CP4 is a coherent demo bar:
1. Edit graph + inspector + harness links
2. Harness content inspector
3. Save/Load + export project JSON
4. Run demo / paste transcript + watch graph light up
