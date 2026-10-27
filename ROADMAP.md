# Agent OS — Production Roadmap

## Checkpoints

| CP | Status | Scope |
|----|--------|--------|
| CP0–CP9 | done | Shell → session auto-map |
| CP10 | done | Stdio one-shot, file_meta command |
| CP11 | partial | Meta-based watchPath, file-tail on watch, status session chip |
| CP12 | next | True streaming spawn (Tauri async), notify crate |

## CP11 notes

- `Platform.fileMeta` on web (virtual) + Tauri
- `watchPath` compares len+mtime; FileTailSession reacts to watch instead of blind interval reads
- Status bar shows `transport:status` for active session
- Allowlist: explicit `echo` JSON payloads for stdio demos

## Architecture invariants

1. UI never imports `@tauri-apps/*` outside `src/platform/`
2. Session graph mutations use `ensureNode` (no undo spam)
3. Transcript adapter is the only log → event path
