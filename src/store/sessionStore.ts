import { create } from "zustand";
import { agentRuntime } from "../agent/runtime";
import type { AgentSessionInfo } from "../agent/types";
import { autoMapEvent } from "../graph/autoMap";
import type { NormalizedEvent } from "../runtime/transcript";
import { useActivityStore } from "./activityStore";

interface SessionState {
  sessions: AgentSessionInfo[];
  activeId: string | null;
  autoMap: boolean;
  setAutoMap: (v: boolean) => void;
  refresh: () => void;
  startDemo: () => void;
  attachTail: (path: string) => Promise<void>;
  attachStdio: (command: string, cwd?: string) => Promise<void>;
  stopActive: () => void;
  detachAll: () => void;
}

let unsub: (() => void) | null = null;

function ingest(batch: NormalizedEvent[], autoMap: boolean) {
  for (const e of batch) {
    let nodeId = e.nodeId;
    if (autoMap) nodeId = autoMapEvent(e) ?? nodeId;
    useActivityStore.getState().push({ ...e, nodeId });
  }
}

function bindHandle(h: { info: () => AgentSessionInfo; start: (cb: (b: NormalizedEvent[]) => void) => () => void }) {
  useActivityStore.getState().clear();
  useActivityStore.setState({ running: true, mode: "live" });
  unsub = h.start((batch) => {
    ingest(batch, useSessionStore.getState().autoMap);
    const info = h.info();
    if (info.status === "stopped" || info.status === "error") {
      useActivityStore.setState({ running: false, mode: "idle" });
    }
    useSessionStore.getState().refresh();
  });
  useSessionStore.setState({
    activeId: h.info().id,
    sessions: agentRuntime.listSessions(),
  });
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  activeId: null,
  autoMap: true,

  setAutoMap: (v) => set({ autoMap: v }),

  refresh: () => set({ sessions: agentRuntime.listSessions() }),

  startDemo: () => {
    get().stopActive();
    bindHandle(agentRuntime.attachDemo("demo"));
  },

  attachTail: async (path) => {
    get().stopActive();
    const h = await agentRuntime.attachFileTail(path);
    bindHandle(h);
  },

  attachStdio: async (command, cwd) => {
    get().stopActive();
    const h = await agentRuntime.attachStdio({ command, cwd, label: command.slice(0, 32) });
    bindHandle(h);
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
    for (const s of agentRuntime.listSessions()) agentRuntime.detach(s.id);
    useActivityStore.setState({ running: false, mode: "idle" });
    set({ activeId: null, sessions: [] });
  },
}));
