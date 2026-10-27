# Agent OS — Production Roadmap

| CP | Status | Scope |
|----|--------|--------|
| CP0–CP12 | done | Shell → stream_command |
| CP13 | done | Multi-session UI, exclusive toggle, kill_stream_command |
| CP14 | next | OS notify watcher, session event filters |

## CP13

- Sessions chip bar: select + per-session stop
- exclusive (default on): new session detaches previous
- Tauri kill_stream_command + child registry
- Clear detaches all sessions

See CHECKLIST.md.
