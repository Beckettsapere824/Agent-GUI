# HARNESS_PUSH_GATE.md — Anti-placeholder / content integrity

**Binding.** Agents must follow this before and after pushes that touch critical paths.

Adapted from agent-harness (read-only upstream).

## Hard procedure

1. **Materialize full content first.** Never invent a temporary stub "to replace later."
2. **Gate before push when possible:**
   ```bash
   ./tools/assert_no_stub.sh
   ```
3. **Push only the gated body.** If the tool cannot carry the full file, do not push — report blocked and leave a note in progress.md.
4. **After push:** re-read and confirm size + required markers when tools allow.

## Forbidden payload patterns

- `PLACEHOLDER` / `PLACEHOLDER_WILL_FAIL` / `SEE_LOCAL_FILE` / `TODO_STUB`
- Empty or under ~80 characters for paths the agent just claimed to implement fully

## Critical paths (Agent-GUI)

- `AGENT.md`, `feature_list.json`, `src/**`, `docs/**`, `tools/**`
- Any file the current feature's definition_of_done names
