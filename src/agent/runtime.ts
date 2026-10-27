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
        if (text.length < this.offset) this.offset = 0;
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

/**
 * Stdio transport: on web, treats command as a one-shot shell (allowlisted)
 * and parses stdout as JSONL. On Tauri, same via platform.runCommand until
 * a streaming spawn command is wired.
 */
class StdioSession implements AgentSessionHandle {
  private id: string;
  private label: string;
  private command: string;
  private cwd?: string;
  private status: AgentSessionInfo["status"] = "idle";
  private startedAt?: number;
  private lastEventAt?: number;
  private error?: string;
  private stopFn: (() => void) | null = null;

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
    let cancelled = false;

    void (async () => {
      try {
        const { getPlatform } = await import("../platform");
        const p = await getPlatform();
        this.status = "running";
        const result = await p.runCommand(this.command, this.cwd);
        if (cancelled) return;
        if (result.stderr) {
          this.error = result.stderr.slice(0, 200);
        }
        const text = result.stdout || result.stderr;
        const parsed = parseTranscript(text);
        if (parsed.events.length) {
          // Stream in small batches so the graph lights progressively
          const step = 200;
          for (let i = 0; i < parsed.events.length; i++) {
            if (cancelled) return;
            await new Promise((r) => setTimeout(r, step));
            this.lastEventAt = Date.now();
            onEvents([parsed.events[i]]);
          }
        } else if (text.trim()) {
          onEvents([
            {
              kind: result.code === 0 ? "tool" : "error",
              label: this.command.slice(0, 48),
              detail: text.slice(0, 160),
            },
          ]);
        }
        this.status = result.code === 0 ? "stopped" : "error";
        if (result.code !== 0 && !this.error) this.error = `exit ${result.code}`;
      } catch (e) {
        this.status = "error";
        this.error = String(e);
      }
    })();

    this.stopFn = () => {
      cancelled = true;
      if (this.status === "running" || this.status === "starting") this.status = "stopped";
    };
    return () => this.stop();
  }

  stop(): void {
    this.stopFn?.();
    this.stopFn = null;
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
