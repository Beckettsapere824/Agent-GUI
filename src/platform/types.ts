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

export interface FileMeta {
  path: string;
  len: number;
  modifiedMs?: number | null;
}

export type FsWatchEvent = {
  path: string;
  kind: "create" | "modify" | "remove" | "unknown";
  meta?: FileMeta;
};

export interface Platform {
  kind: HostKind;
  hostInfo(): Promise<HostInfo>;
  listDir(path: string): Promise<DirEntry[]>;
  readTextFile(path: string): Promise<string>;
  writeTextFile(path: string, content: string): Promise<void>;
  fileMeta(path: string): Promise<FileMeta>;
  runCommand(cmd: string, cwd?: string): Promise<RunCommandResult>;
  saveProjectBlob(key: string, json: string): Promise<void>;
  loadProjectBlob(key: string): Promise<string | null>;
  /**
   * Best-effort file/dir watch via meta poll (len/mtime).
   * Native notify still CP11+ on Tauri.
   */
  watchPath(path: string, onEvent: (ev: FsWatchEvent) => void, intervalMs?: number): () => void;
}
