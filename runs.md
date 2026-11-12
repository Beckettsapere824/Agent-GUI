# runs.md — Session Run Log

Append-only. Newest entry at the **top**.

Purpose: measure wall-clock duration of each agent run, track outcome, and support analysis of how long the harness stays coherent before handoff or failure.

---

## How to log (mandatory before ending a dialog)

At end of every working session, prepend one block:

```markdown
### YYYY-MM-DD HH:MM (timezone) — duration ~Xm
- **Feature:** H00X / CP21 / none
- **Outcome:** completed | partial | blocked | failed
- **What advanced:** one-line summary
- **Handoff quality:** clean | incomplete | missing next step
- **Notes:** (optional)
```

---

## Log

### 2026-11-12 ~16:20 HKT — duration ~20m
- **Feature:** H001
- **Outcome:** completed
- **What advanced:** Transplanted portable agent-harness core into Agent-GUI; adapted Mission/init/feature_list; left upstream agent-harness untouched
- **Handoff quality:** clean
- **Notes:** Next dialog: CP21 product work.
