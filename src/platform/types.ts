/** Host capabilities shared by web stubs and Tauri backend. */

export type HostKind = "web" | "tauri";

export interface DirEntry {
  name: string;
  path: string;
  kind: "file" | "dir";
}

export interface HostInfo {
  kind: HostKind;
  os?: string;
  arch?: string;
  cwd?: string;
}

export interface RunCommandResult {
  code: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export type FsWatchEvent = {
  path: string;
  kind: "create" | "modify" | "remove" | "unknown";
};

export interface Platform {
  kind: HostKind;
  hostInfo(): Promise<HostInfo>;
  listDir(path: string): Promise<DirEntry[]>;
  readTextFile(path: string): Promise<string>;
  writeTextFile(path: string, content: string): Promise<void>;
  runCommand(cmd: string, cwd?: string): Promise<RunCommandResult>;
  saveProjectBlob(key: string, json: string): Promise<void>;
  loadProjectBlob(key: string): Promise<string | null>;
  /**
   * Best-effort directory/file watch. Web: poll. Tauri: native when available.
   * Returns unsubscribe.
   */
  watchPath(path: string, onEvent: (ev: FsWatchEvent) => void, intervalMs?: number): () => void;
}
