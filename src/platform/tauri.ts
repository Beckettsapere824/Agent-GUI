import { invoke } from "@tauri-apps/api/core";
import type { DirEntry, HostInfo, Platform, RunCommandResult } from "./types";

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
    return invoke<RunCommandResult>("run_command", { cmd, cwd: cwd ?? null });
  },

  async saveProjectBlob(key: string, json: string): Promise<void> {
    await invoke("save_project_blob", { key, json });
  },

  async loadProjectBlob(key: string): Promise<string | null> {
    return invoke<string | null>("load_project_blob", { key });
  },
};
