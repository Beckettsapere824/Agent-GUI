# Agent OS — Production Roadmap

## Positioning

Graphical OS for coding-agent / harness / graph engineering — not a Flowise clone.

## Checkpoints

| CP | Status | Scope |
|----|--------|--------|
| CP0 | done | Desktop shell, graph, runtime demo, harness sketch |
| CP1 | done | Domain graph, editor, inspector |
| CP2 | done | Harness model + content inspector |
| CP3 | done | Files panel, save/load, export |
| CP4 | done | Transcript adapter, replay, graph↔harness links |
| CP5 | done | `src/platform/` boundary, web stubs, Tauri FS/shell commands |
| CP6 | next | Undo stack, layout, export image, perf, command allowlist |

## CP5 notes

- **Rule**: UI imports host I/O only from `src/platform/` — never `@tauri-apps/*` elsewhere.
- `getPlatform()` selects web vs Tauri at runtime.
- Web: virtual workspace tree + simulated shell.
- Tauri commands: `host_info`, `list_dir`, `read_text_file`, `write_text_file`, `run_command`, `save_project_blob`, `load_project_blob`.
- Files panel browses platform listDir; preview reads files.
- Logs taskbar entry → Shell panel (`runCommand`).

## Security note

`run_command` is intentionally open for local demo. Before production ship: allowlist binaries / deny patterns / user confirm for network-capable tools.
