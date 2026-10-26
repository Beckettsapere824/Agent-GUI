import { DEMO_TRANSCRIPT, parseTranscript, type NormalizedEvent } from "../runtime/transcript";
import type {
  AgentRuntime,
  AgentSessionHandle,
  AgentSessionInfo,
  SessionListener,
} from "./types";

let seq = 0;

class DemoSession implements AgentSessionHandle {
  private id: string;
  private label: string;
  private status: AgentSessionInfo["status"] = "idle";
  private startedAt?: number;
  private lastEventAt?: number;
  private timers: number[] = [];
  private stopFn: (() => void) | null = null;
  private events: NormalizedEvent[];

  constructor(label: string, transcript = DEMO_TRANSCRIPT) {
    this.id = `sess-${++seq}`;
    this.label = label;
    this.events = parseTranscript(transcript).events;
  }

  info(): AgentSessionInfo {
    return {
      id: this.id,
      label: this.label,
      status: this.status,
      transport: "demo",
      startedAt: this.startedAt,
      lastEventAt: this.lastEventAt,
    };
  }

  start(onEvents: SessionListener): () => void {
    this.stop();
    this.status = "running";
    this.startedAt = Date.now();
    const step = 480;
    this.events.forEach((e, i) => {
      const t = window.setTimeout(() => {
        this.lastEventAt = Date.now();
        onEvents([e]);
        if (i === this.events.length - 1) {
          this.status = "stopped";
        }
      }, step * (i + 1));
      this.timers.push(t as unknown as number);
    });
    this.stopFn = () => {
      for (const t of this.timers) clearTimeout(t);
      this.timers = [];
      if (this.status === "running") this.status = "stopped";
    };
    return () => this.stop();
  }

  stop(): void {
    this.stopFn?.();
    this.stopFn = null;
  }
}

class FileTailSession implements AgentSessionHandle {
  private id: string;
  private label: string;
  private path: string;
  private status: AgentSessionInfo["status"] = "idle";
  private startedAt?: number;
  private lastEventAt?: number;
  private error?: string;
  private offset = 0;
  private timer: number | null = null;
  private buffer = "";

  constructor(path: string, label: string) {
    this.id = `sess-${++seq}`;
    this.path = path;
    this.label = label;
  }

  info(): AgentSessionInfo {
    return {
      id: this.id,
      label: this.label,
      status: this.status,
      transport: "file-tail",
      startedAt: this.startedAt,
      lastEventAt: this.lastEventAt,
      error: this.error,
    };
  }

  start(onEvents: SessionListener): () => void {
    this.stop();
    this.status = "running";
    this.startedAt = Date.now();
    this.error = undefined;

    const tick = async () => {
      try {
        const { getPlatform } = await import("../platform");
        const p = await getPlatform();
        const text = await p.readTextFile(this.path);
        if (text.length < this.offset) this.offset = 0; // truncated
        const chunk = text.slice(this.offset);
        this.offset = text.length;
        if (chunk) {
          this.buffer += chunk;
          const lines = this.buffer.split(/\r?\n/);
          this.buffer = lines.pop() ?? "";
          const joined = lines.filter(Boolean).join("\n");
          if (joined) {
            const parsed = parseTranscript(joined);
            if (parsed.events.length) {
              this.lastEventAt = Date.now();
              onEvents(parsed.events);
            }
          }
        }
      } catch (e) {
        this.error = String(e);
        // keep polling — file may appear later
      }
    };

    void tick();
    this.timer = window.setInterval(() => void tick(), 800) as unknown as number;
    return () => this.stop();
  }

  stop(): void {
    if (this.timer != null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.status === "running") this.status = "stopped";
  }
}

class LocalAgentRuntime implements AgentRuntime {
  private sessions = new Map<string, AgentSessionHandle>();

  listSessions(): AgentSessionInfo[] {
    return [...this.sessions.values()].map((s) => s.info());
  }

  attachDemo(label = "demo-session"): AgentSessionHandle {
    const h = new DemoSession(label);
    this.sessions.set(h.info().id, h);
    return h;
  }

  async attachFileTail(path: string, label?: string): Promise<AgentSessionHandle> {
    const h = new FileTailSession(path, label ?? path);
    this.sessions.set(h.info().id, h);
    return h;
  }

  detach(id: string): void {
    const h = this.sessions.get(id);
    h?.stop();
    this.sessions.delete(id);
  }
}

export const agentRuntime: AgentRuntime = new LocalAgentRuntime();
