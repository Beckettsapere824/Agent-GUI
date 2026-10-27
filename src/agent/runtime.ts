import { DEMO_TRANSCRIPT, parseTranscript, type NormalizedEvent } from "../runtime/transcript";
import type {
  AgentRuntime,
  AgentSessionHandle,
  AgentSessionInfo,
  SessionListener,
  StdioAttachOptions,
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
        if (i === this.events.length - 1) this.status = "stopped";
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
  private unwatch: (() => void) | null = null;
  private buffer = "";
  private reading = false;

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
    this.offset = 0;
    this.buffer = "";

    const readDelta = async () => {
      if (this.reading) return;
      this.reading = true;
      try {
        const { getPlatform } = await import("../platform");
        const p = await getPlatform();
        const text = await p.readTextFile(this.path);
        if (text.length < this.offset) this.offset = 0;
        const chunk = text.slice(this.offset);
        this.offset = text.length;
        if (!chunk) return;
        this.buffer += chunk;
        const lines = this.buffer.split(/\r?\n/);
        this.buffer = lines.pop() ?? "";
        const joined = lines.filter(Boolean).join("\n");
        if (joined) {
          const parsed = parseTranscript(joined);
          if (parsed.events.length) {
            this.lastEventAt = Date.now();
            this.error = undefined;
            onEvents(parsed.events);
          }
        }
      } catch (e) {
        this.error = String(e);
      } finally {
        this.reading = false;
      }
    };

    void (async () => {
      const { getPlatform } = await import("../platform");
      const p = await getPlatform();
      void readDelta();
      this.unwatch = p.watchPath(this.path, () => {
        void readDelta();
      }, 600);
    })();

    return () => this.stop();
  }

  stop(): void {
    this.unwatch?.();
    this.unwatch = null;
    if (this.status === "running") this.status = "stopped";
  }
}

/** Stdio via platform.streamCommand (Tauri real stream / web synthetic). */
class StdioSession implements AgentSessionHandle {
  private id: string;
  private label: string;
  private command: string;
  private cwd?: string;
  private status: AgentSessionInfo["status"] = "idle";
  private startedAt?: number;
  private lastEventAt?: number;
  private error?: string;
  private unsub: (() => void) | null = null;

  constructor(opts: StdioAttachOptions) {
    this.id = `sess-${++seq}`;
    this.label = opts.label ?? opts.command.slice(0, 40);
    this.command = opts.command;
    this.cwd = opts.cwd;
  }

  info(): AgentSessionInfo {
    return {
      id: this.id,
      label: this.label,
      status: this.status,
      transport: "stdio",
      startedAt: this.startedAt,
      lastEventAt: this.lastEventAt,
      error: this.error,
    };
  }

  start(onEvents: SessionListener): () => void {
    this.stop();
    this.status = "starting";
    this.startedAt = Date.now();
    this.error = undefined;

    void (async () => {
      try {
        const { getPlatform } = await import("../platform");
        const p = await getPlatform();
        this.status = "running";
        this.unsub = await p.streamCommand(
          this.id,
          this.command,
          this.cwd,
          (line) => {
            this.lastEventAt = Date.now();
            if (line.stream === "stderr") {
              this.error = line.line.slice(0, 200);
              onEvents([{ kind: "error", label: "stderr", detail: line.line.slice(0, 160) }]);
              return;
            }
            const parsed = parseTranscript(line.line);
            if (parsed.events.length) {
              onEvents(parsed.events);
            } else if (line.line.trim()) {
              onEvents([{ kind: "tool", label: line.line.slice(0, 48), detail: line.line.slice(0, 120) }]);
            }
          },
          (end) => {
            this.status = end.code === 0 ? "stopped" : "error";
            if (end.code !== 0 && !this.error) this.error = `exit ${end.code}`;
          }
        );
      } catch (e) {
        this.status = "error";
        this.error = String(e);
      }
    })();

    return () => this.stop();
  }

  stop(): void {
    this.unsub?.();
    this.unsub = null;
    if (this.status === "running" || this.status === "starting") this.status = "stopped";
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

  async attachStdio(opts: StdioAttachOptions): Promise<AgentSessionHandle> {
    const h = new StdioSession(opts);
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
