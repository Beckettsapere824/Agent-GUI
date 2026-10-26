import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export type ActivityKind = "read" | "write" | "tool" | "think" | "error";

export interface ActivityEvent {
  id: string;
  ts: number;
  kind: ActivityKind;
  nodeId?: string;
  label: string;
  detail?: string;
}

interface ActivityState {
  events: ActivityEvent[];
  activeNodeIds: Record<string, number>; // nodeId -> expire timestamp
  running: boolean;
  push: (e: Omit<ActivityEvent, "id" | "ts">) => void;
  tick: () => void;
  clear: () => void;
  setRunning: (v: boolean) => void;
}

let seq = 0;

export const useActivityStore = create<ActivityState>()(
  immer((set, get) => ({
    events: [],
    activeNodeIds: {},
    running: false,

    push: (e) =>
      set((state) => {
        const id = `evt-${++seq}`;
        const ts = Date.now();
        state.events.unshift({ ...e, id, ts });
        if (state.events.length > 80) state.events.length = 80;
        if (e.nodeId) {
          state.activeNodeIds[e.nodeId] = ts + 1800;
        }
      }),

    tick: () =>
      set((state) => {
        const now = Date.now();
        for (const k of Object.keys(state.activeNodeIds)) {
          if (state.activeNodeIds[k] < now) delete state.activeNodeIds[k];
        }
      }),

    clear: () =>
      set((state) => {
        state.events = [];
        state.activeNodeIds = {};
      }),

    setRunning: (v) =>
      set((state) => {
        state.running = v;
      }),
  }))
);

/** Demo script that simulates a coding agent run */
export function startDemoRun() {
  const { push, setRunning, clear } = useActivityStore.getState();
  clear();
  setRunning(true);

  const steps: Array<{ delay: number; event: Omit<ActivityEvent, "id" | "ts"> }> = [
    { delay: 400, event: { kind: "think", label: "Planning task", detail: "Fix build error in main.rs" } },
    { delay: 900, event: { kind: "tool", nodeId: "tool-1", label: "read_file", detail: "src/main.rs" } },
    { delay: 1400, event: { kind: "read", nodeId: "file-1", label: "Opened", detail: "src/main.rs" } },
    { delay: 2000, event: { kind: "tool", nodeId: "tool-1", label: "read_file", detail: "Cargo.toml" } },
    { delay: 2400, event: { kind: "read", nodeId: "file-2", label: "Opened", detail: "Cargo.toml" } },
    { delay: 3000, event: { kind: "think", nodeId: "agent-1", label: "Analyzing", detail: "Missing dependency" } },
    { delay: 3600, event: { kind: "tool", nodeId: "tool-3", label: "bash", detail: "cargo check" } },
    { delay: 4500, event: { kind: "tool", nodeId: "tool-2", label: "write_file", detail: "src/main.rs" } },
    { delay: 4900, event: { kind: "write", nodeId: "file-1", label: "Edited", detail: "src/main.rs (+12 −3)" } },
    { delay: 5600, event: { kind: "tool", nodeId: "skill-2", label: "code-review", detail: "Reviewing patch" } },
    { delay: 6400, event: { kind: "tool", nodeId: "tool-3", label: "bash", detail: "cargo test" } },
    { delay: 7200, event: { kind: "think", nodeId: "agent-1", label: "Done", detail: "All tests passed" } },
  ];

  const timers: number[] = [];
  for (const s of steps) {
    timers.push(
      window.setTimeout(() => {
        push(s.event);
      }, s.delay) as unknown as number
    );
  }
  timers.push(
    window.setTimeout(() => {
      setRunning(false);
    }, 7800) as unknown as number
  );

  return () => timers.forEach((t) => clearTimeout(t));
}
