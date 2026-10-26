import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { DEMO_TRANSCRIPT, parseTranscript, type NormalizedEvent } from "../runtime/transcript";

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
  activeNodeIds: Record<string, number>;
  running: boolean;
  mode: "live" | "replay" | "idle";
  replayIndex: number;
  push: (e: Omit<ActivityEvent, "id" | "ts"> & { ts?: number }) => void;
  tick: () => void;
  clear: () => void;
  setRunning: (v: boolean) => void;
  /** Ingest a batch (e.g. parsed transcript) without starting timers. */
  loadEvents: (items: NormalizedEvent[]) => void;
  /** Replay loaded or provided events with staggered timing. */
  startReplay: (items?: NormalizedEvent[], stepMs?: number) => () => void;
  startDemoFromTranscript: () => () => void;
}

let seq = 0;
let replayTimers: number[] = [];

function clearReplayTimers() {
  for (const t of replayTimers) clearTimeout(t);
  replayTimers = [];
}

export const useActivityStore = create<ActivityState>()(
  immer((set, get) => ({
    events: [],
    activeNodeIds: {},
    running: false,
    mode: "idle",
    replayIndex: 0,

    push: (e) =>
      set((state) => {
        const id = `evt-${++seq}`;
        const ts = e.ts ?? Date.now();
        state.events.unshift({ ...e, id, ts });
        if (state.events.length > 120) state.events.length = 120;
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
        clearReplayTimers();
        state.events = [];
        state.activeNodeIds = {};
        state.running = false;
        state.mode = "idle";
        state.replayIndex = 0;
      }),

    setRunning: (v) =>
      set((state) => {
        state.running = v;
        if (!v && state.mode !== "idle") state.mode = "idle";
      }),

    loadEvents: (items) =>
      set((state) => {
        clearReplayTimers();
        state.events = [];
        state.activeNodeIds = {};
        state.running = false;
        state.mode = "idle";
        state.replayIndex = 0;
        const base = Date.now();
        items.forEach((e, i) => {
          const id = `evt-${++seq}`;
          state.events.push({
            id,
            ts: e.ts ?? base - (items.length - i) * 1000,
            kind: e.kind,
            label: e.label,
            detail: e.detail,
            nodeId: e.nodeId,
          });
        });
        state.events.reverse();
      }),

    startReplay: (items, stepMs = 550) => {
      clearReplayTimers();
      const list =
        items ??
        get()
          .events.slice()
          .reverse()
          .map((e) => ({
            kind: e.kind,
            label: e.label,
            detail: e.detail,
            nodeId: e.nodeId,
          }));

      set((state) => {
        state.events = [];
        state.activeNodeIds = {};
        state.running = true;
        state.mode = "replay";
        state.replayIndex = 0;
      });

      const { push, setRunning } = get();
      list.forEach((e, i) => {
        const t = window.setTimeout(() => {
          push(e);
          set((s) => {
            s.replayIndex = i + 1;
          });
          if (i === list.length - 1) setRunning(false);
        }, stepMs * (i + 1));
        replayTimers.push(t as unknown as number);
      });

      if (list.length === 0) setRunning(false);

      return () => {
        clearReplayTimers();
        setRunning(false);
      };
    },

    startDemoFromTranscript: () => {
      const parsed = parseTranscript(DEMO_TRANSCRIPT);
      return get().startReplay(parsed.events, 500);
    },
  }))
);
