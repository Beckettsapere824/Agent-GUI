import { invoke } from "@tauri-apps/api/core";
import type { DirEntry, FsWatchEvent, HostInfo, Platform, RunCommandResult } from "./types";
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

  async runCommand(cmd: string, cwd?: string): Promise<RunCommandResult> {
    const gate = checkCommand(cmd);
    if (!gate.ok) {
      return { code: 126, stdout: "", stderr: `allowlist: ${gate.reason}\n`, durationMs: 0 };
    }
    return invoke<RunCommandResult>("run_command", { cmd, cwd: cwd ?? null });
  },

  async saveProjectBlob(key: string, json: string): Promise<void> {
    await invoke("save_project_blob", { key, json });
  },

  async loadProjectBlob(key: string): Promise<string | null> {
    return invoke<string | null>("load_project_blob", { key });
  },

  watchPath(path: string, onEvent: (ev: FsWatchEvent) => void, intervalMs = 1000): () => void {
    // Poll via read until native notify watcher is wired in Rust.
    let lastLen = -1;
    const tick = async () => {
      try {
        const text = await invoke<string>("read_text_file", { path });
        if (text.length !== lastLen) {
          const kind: FsWatchEvent["kind"] =
            lastLen < 0 ? "create" : text.length === 0 ? "remove" : "modify";
          lastLen = text.length;
          onEvent({ path, kind });
        }
      } catch {
        if (lastLen >= 0) {
          lastLen = -1;
          onEvent({ path, kind: "remove" });
        }
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), intervalMs);
    return () => clearInterval(id);
  },
};
