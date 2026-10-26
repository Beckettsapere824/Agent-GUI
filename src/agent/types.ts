/** Agent process / session boundary — UI talks only to this surface. */

import type { NormalizedEvent } from "../runtime/transcript";

export type SessionStatus = "idle" | "starting" | "running" | "stopped" | "error";

export interface AgentSessionInfo {
  id: string;
  label: string;
  status: SessionStatus;
  /** How the session is attached */
  transport: "demo" | "file-tail" | "stdio" | "none";
  startedAt?: number;
  lastEventAt?: number;
  error?: string;
}

export type SessionListener = (events: NormalizedEvent[]) => void;

export interface AgentSessionHandle {
  info(): AgentSessionInfo;
  /** Start emitting events (demo or live). Returns unsubscribe. */
  start(onEvents: SessionListener): () => void;
  stop(): void;
}

export interface AgentRuntime {
  listSessions(): AgentSessionInfo[];
  /** Create a demo session that replays a transcript. */
  attachDemo(label?: string): AgentSessionHandle;
  /** Attach by watching a transcript file path (platform-dependent). */
  attachFileTail(path: string, label?: string): Promise<AgentSessionHandle>;
  detach(id: string): void;
}
