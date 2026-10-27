/** Agent process / session boundary — UI talks only to this surface. */

import type { NormalizedEvent } from "../runtime/transcript";

export type SessionStatus = "idle" | "starting" | "running" | "stopped" | "error";

export type SessionTransport = "demo" | "file-tail" | "stdio" | "none";

export interface AgentSessionInfo {
  id: string;
  label: string;
  status: SessionStatus;
  transport: SessionTransport;
  startedAt?: number;
  lastEventAt?: number;
  error?: string;
}

export type SessionListener = (events: NormalizedEvent[]) => void;

export interface AgentSessionHandle {
  info(): AgentSessionInfo;
  start(onEvents: SessionListener): () => void;
  stop(): void;
}

export interface StdioAttachOptions {
  /** Executable or shell one-liner (subject to allowlist on host). */
  command: string;
  cwd?: string;
  label?: string;
}

export interface AgentRuntime {
  listSessions(): AgentSessionInfo[];
  attachDemo(label?: string): AgentSessionHandle;
  attachFileTail(path: string, label?: string): Promise<AgentSessionHandle>;
  /** Spawn / stream process stdout as JSONL when host supports it. */
  attachStdio(opts: StdioAttachOptions): Promise<AgentSessionHandle>;
  detach(id: string): void;
}
