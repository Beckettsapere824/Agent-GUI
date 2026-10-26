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

export interface Platform {
  kind: HostKind;
  hostInfo(): Promise<HostInfo>;
  /** List directory relative to workspace root, or absolute when allowed. */
  listDir(path: string): Promise<DirEntry[]>;
  readTextFile(path: string): Promise<string>;
  writeTextFile(path: string, content: string): Promise<void>;
  /** Best-effort shell; web returns simulated output. */
  runCommand(cmd: string, cwd?: string): Promise<RunCommandResult>;
  /** Persist opaque project blob (web: localStorage; tauri: app data dir). */
  saveProjectBlob(key: string, json: string): Promise<void>;
  loadProjectBlob(key: string): Promise<string | null>;
}
