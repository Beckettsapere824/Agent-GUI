# Local verification checklist (CP0–CP12)

```bash
git pull
npm install --registry https://registry.npmjs.org
npm run dev          # browser
# npm run tauri:dev  # desktop + stream_command
```

## Smoke path

1. **Desktop** — Graph window opens; status bar shows project · nodes · WEB/TAURI
2. **Keys** — `?` help; `1–5` switch apps; `Ctrl/⌘S` save
3. **Graph** — Add node, Undo/Redo, Layout, SVG export, select → inspector
4. **Runtime → Run demo** — events stream; status `demo:running` · live; graph lights
5. **Runtime → Attach** — Sample Claude-code Load/Replay; auto-map toggle
6. **Tail file** — path `sessions/demo.jsonl` (web virtual; may be empty until written)
7. **Stdio** — `echo` JSON line (allowlisted); web synthetic stream; Tauri uses `stream_command`
8. **Files → Projects** — Save, New project, switch, del
9. **Shell** — `pwd` / `ls` ok; denied command blocked
10. **Harness** — tree + content; graph skill → harness link

## Tauri-only

- `file_meta` / host FS list_dir
- `stream_command` emits `agent-os://stdio-line` / `stdio-end`

## Known limits

- Web cannot truly stream OS processes
- FS watch is meta-poll, not OS notify
- `run_command` / stream still need production allowlist hardening
