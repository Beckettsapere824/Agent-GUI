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
  /** When true, starting a session detaches the previous one. */
  exclusive: boolean;
  setAutoMap: (v: boolean) => void;
  setExclusive: (v: boolean) => void;
  setActive: (id: string | null) => void;
  refresh: () => void;
  startDemo: () => void;
  attachTail: (path: string) => Promise<void>;
  attachStdio: (command: string, cwd?: string) => Promise<void>;
  stopSession: (id: string) => void;
  stopActive: () => void;
  detachAll: () => void;
}

/** Per-session unsubscribe for event pumps. */
const unsubs = new Map<string, () => void>();

function ingest(batch: NormalizedEvent[], autoMap: boolean, sessionId: string) {
  for (const e of batch) {
    let nodeId = e.nodeId;
    if (autoMap) nodeId = autoMapEvent(e) ?? nodeId;
    useActivityStore.getState().push({ ...e, nodeId, sessionId });
  }
}

function anyRunning(): boolean {
  return agentRuntime.listSessions().some(
    (s) => s.status === "running" || s.status === "starting"
  );
}

function bindHandle(h: {
  info: () => AgentSessionInfo;
  start: (cb: (b: NormalizedEvent[]) => void) => () => void;
  stop: () => void;
}) {
  const id = h.info().id;
  useActivityStore.setState({ running: true, mode: "live" });
  const stopPump = h.start((batch) => {
    ingest(batch, useSessionStore.getState().autoMap, id);
    const info = h.info();
    if (info.status === "stopped" || info.status === "error") {
      unsubs.delete(id);
      if (!anyRunning()) {
        useActivityStore.setState({ running: false, mode: "idle" });
      }
    }
    useSessionStore.getState().refresh();
  });
  unsubs.set(id, () => {
    stopPump();
    h.stop();
  });
  useSessionStore.setState({
    activeId: id,
    sessions: agentRuntime.listSessions(),
  });
  useActivityStore.getState().setFilterSessionId(id);
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  activeId: null,
  autoMap: true,
  exclusive: true,

  setAutoMap: (v) => set({ autoMap: v }),
  setExclusive: (v) => set({ exclusive: v }),
  setActive: (id) => {
    set({ activeId: id });
    if (id) useActivityStore.getState().setFilterSessionId(id);
  },

  refresh: () => set({ sessions: agentRuntime.listSessions() }),

  startDemo: () => {
    if (get().exclusive) get().stopActive();
    bindHandle(agentRuntime.attachDemo(`demo-${Date.now().toString(36).slice(-4)}`));
  },

  attachTail: async (path) => {
    if (get().exclusive) get().stopActive();
    const h = await agentRuntime.attachFileTail(path);
    bindHandle(h);
  },

  attachStdio: async (command, cwd) => {
    if (get().exclusive) get().stopActive();
    const h = await agentRuntime.attachStdio({
      command,
      cwd,
      label: command.slice(0, 32),
    });
    bindHandle(h);
  },

  stopSession: (id) => {
    const u = unsubs.get(id);
    u?.();
    unsubs.delete(id);
    agentRuntime.detach(id);
    void import("../platform").then(async ({ getPlatform }) => {
      const p = await getPlatform();
      if (p.killStream) await p.killStream(id).catch(() => undefined);
    });
    const next = agentRuntime.listSessions();
    const activeId = get().activeId === id ? next[0]?.id ?? null : get().activeId;
    if (!anyRunning()) {
      useActivityStore.setState({ running: false, mode: "idle" });
    }
    set({ sessions: next, activeId });
  },

  stopActive: () => {
    const id = get().activeId;
    if (id) {
      get().stopSession(id);
      return;
    }
    for (const s of agentRuntime.listSessions()) {
      if (s.status === "running" || s.status === "starting") {
        get().stopSession(s.id);
      }
    }
  },

  detachAll: () => {
    for (const id of [...unsubs.keys()]) {
      unsubs.get(id)?.();
      unsubs.delete(id);
    }
    for (const s of agentRuntime.listSessions()) {
      agentRuntime.detach(s.id);
      void import("../platform").then(async ({ getPlatform }) => {
        const p = await getPlatform();
        if (p.killStream) await p.killStream(s.id).catch(() => undefined);
      });
    }
    useActivityStore.setState({ running: false, mode: "idle", filterSessionId: null });
    set({ activeId: null, sessions: [] });
  },
}));
