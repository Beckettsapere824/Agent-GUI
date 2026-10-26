import { create } from "zustand";
import { agentRuntime } from "../agent/runtime";
import type { AgentSessionInfo } from "../agent/types";
import { autoMapEvent } from "../graph/autoMap";
import { useActivityStore } from "./activityStore";

interface SessionState {
  sessions: AgentSessionInfo[];
  activeId: string | null;
  autoMap: boolean;
  setAutoMap: (v: boolean) => void;
  refresh: () => void;
  startDemo: () => void;
  attachTail: (path: string) => Promise<void>;
  stopActive: () => void;
  detachAll: () => void;
}

let unsub: (() => void) | null = null;

function ingest(batch: Parameters<typeof autoMapEvent>[0][], autoMap: boolean) {
  for (const e of batch) {
    let nodeId = e.nodeId;
    if (autoMap) {
      nodeId = autoMapEvent(e) ?? nodeId;
    }
    useActivityStore.getState().push({ ...e, nodeId });
  }
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  activeId: null,
  autoMap: true,

  setAutoMap: (v) => set({ autoMap: v }),

  refresh: () => set({ sessions: agentRuntime.listSessions() }),

  startDemo: () => {
    get().stopActive();
    const h = agentRuntime.attachDemo("demo");
    useActivityStore.getState().clear();
    useActivityStore.setState({ running: true, mode: "live" });
    unsub = h.start((batch) => {
      ingest(batch, get().autoMap);
      if (h.info().status === "stopped") {
        useActivityStore.setState({ running: false, mode: "idle" });
      }
      get().refresh();
    });
    set({ activeId: h.info().id, sessions: agentRuntime.listSessions() });
  },

  attachTail: async (path) => {
    get().stopActive();
    const h = await agentRuntime.attachFileTail(path);
    useActivityStore.getState().clear();
    useActivityStore.setState({ running: true, mode: "live" });
    unsub = h.start((batch) => {
      ingest(batch, get().autoMap);
      get().refresh();
    });
    set({ activeId: h.info().id, sessions: agentRuntime.listSessions() });
  },

  stopActive: () => {
    unsub?.();
    unsub = null;
    const id = get().activeId;
    if (id) agentRuntime.detach(id);
    useActivityStore.setState({ running: false, mode: "idle" });
    set({ activeId: null, sessions: agentRuntime.listSessions() });
  },

  detachAll: () => {
    unsub?.();
    unsub = null;
    for (const s of agentRuntime.listSessions()) {
      agentRuntime.detach(s.id);
    }
    useActivityStore.setState({ running: false, mode: "idle" });
    set({ activeId: null, sessions: [] });
  },
}));
