import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  DirEntry,
  FileMeta,
  FsWatchEvent,
  HostInfo,
  Platform,
  RunCommandResult,
  StdioEnd,
  StdioLine,
} from "./types";
import { checkCommand } from "./allowlist";

export const tauriPlatform: Platform = {
  kind: "tauri",

  async hostInfo(): Promise<HostInfo> {
    return invoke<HostInfo>("host_info");
  },

  async listDir(path: string): Promise<DirEntry[]> {
    return invoke<DirEntry[]>("list_dir", { path });
  },

  async readTextFile(path: string): Promise<string> {
    return invoke<string>("read_text_file", { path });
  },

  async writeTextFile(path: string, content: string): Promise<void> {
    await invoke("write_text_file", { path, content });
  },

  async fileMeta(path: string): Promise<FileMeta> {
    return invoke<FileMeta>("file_meta", { path });
  },

  async runCommand(cmd: string, cwd?: string): Promise<RunCommandResult> {
    const gate = checkCommand(cmd);
    if (!gate.ok) {
      return { code: 126, stdout: "", stderr: `allowlist: ${gate.reason}\n`, durationMs: 0 };
    }
    return invoke<RunCommandResult>("run_command", { cmd, cwd: cwd ?? null });
  },

  async streamCommand(
    sessionId: string,
    cmd: string,
    cwd: string | undefined,
    onLine: (ev: StdioLine) => void,
    onEnd: (ev: StdioEnd) => void
  ): Promise<() => void> {
    const gate = checkCommand(cmd);
    if (!gate.ok) {
      onLine({ sessionId, stream: "stderr", line: `allowlist: ${gate.reason}` });
      onEnd({ sessionId, code: 126, durationMs: 0 });
      return () => {};
    }

    const unsubs: UnlistenFn[] = [];
    unsubs.push(
      await listen<StdioLine>("agent-os://stdio-line", (e) => {
        if (e.payload?.sessionId === sessionId) onLine(e.payload);
      })
    );
    unsubs.push(
      await listen<StdioEnd>("agent-os://stdio-end", (e) => {
        if (e.payload?.sessionId === sessionId) onEnd(e.payload);
      })
    );

    await invoke("stream_command", {
      sessionId,
      cmd,
      cwd: cwd ?? null,
    });

    return () => {
      for (const u of unsubs) void u();
      void invoke("kill_stream_command", { sessionId }).catch(() => undefined);
    };
  },

  async killStream(sessionId: string): Promise<void> {
    await invoke("kill_stream_command", { sessionId });
  },

  async saveProjectBlob(key: string, json: string): Promise<void> {
    await invoke("save_project_blob", { key, json });
  },

  async loadProjectBlob(key: string): Promise<string | null> {
    return invoke<string | null>("load_project_blob", { key });
  },

  watchPath(path: string, onEvent: (ev: FsWatchEvent) => void, intervalMs = 800): () => void {
    let lastKey = "";
    const tick = async () => {
      try {
        const meta = await invoke<FileMeta>("file_meta", { path });
        const key = `${meta.len}:${meta.modifiedMs ?? 0}`;
        if (key !== lastKey) {
          const kind: FsWatchEvent["kind"] =
            lastKey === "" || lastKey === "missing" ? "create" : "modify";
          lastKey = key;
          onEvent({ path, kind, meta });
        }
      } catch {
        if (lastKey !== "missing") {
          lastKey = "missing";
          onEvent({ path, kind: "remove" });
        }
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), intervalMs);
    return () => clearInterval(id);
  },
};
