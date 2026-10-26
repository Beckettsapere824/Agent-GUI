import { create } from "zustand";
import { agentRuntime } from "../agent/runtime";
import type { AgentSessionInfo } from "../agent/types";
import { useActivityStore } from "./activityStore";

interface SessionState {
  sessions: AgentSessionInfo[];
  activeId: string | null;
  refresh: () => void;
  startDemo: () => void;
  attachTail: (path: string) => Promise<void>;
  stopActive: () => void;
  detachAll: () => void;
}

let unsub: (() => void) | null = null;

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  activeId: null,

  refresh: () => set({ sessions: agentRuntime.listSessions() }),

  startDemo: () => {
    get().stopActive();
    const h = agentRuntime.attachDemo("demo");
    useActivityStore.getState().clear();
    useActivityStore.getState().setRunning(true);
    unsub = h.start((batch) => {
      for (const e of batch) {
        useActivityStore.getState().push(e);
      }
      if (h.info().status === "stopped") {
        useActivityStore.getState().setRunning(false);
      }
      get().refresh();
    });
    set({ activeId: h.info().id, sessions: agentRuntime.listSessions() });
  },

  attachTail: async (path) => {
    get().stopActive();
    const h = await agentRuntime.attachFileTail(path);
    useActivityStore.getState().clear();
    useActivityStore.getState().setRunning(true);
    unsub = h.start((batch) => {
      for (const e of batch) {
        useActivityStore.getState().push(e);
      }
      get().refresh();
    });
    set({ activeId: h.info().id, sessions: agentRuntime.listSessions() });
  },

  stopActive: () => {
    unsub?.();
    unsub = null;
    const id = get().activeId;
    if (id) agentRuntime.detach(id);
    useActivityStore.getState().setRunning(false);
    set({ activeId: null, sessions: agentRuntime.listSessions() });
  },

  detachAll: () => {
    unsub?.();
    unsub = null;
    for (const s of agentRuntime.listSessions()) {
      agentRuntime.detach(s.id);
    }
    useActivityStore.getState().setRunning(false);
    set({ activeId: null, sessions: [] });
  },
}));
