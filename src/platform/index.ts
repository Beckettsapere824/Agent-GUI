import type { Platform } from "./types";
import { webPlatform } from "./web";

export type { DirEntry, HostInfo, Platform, RunCommandResult, HostKind } from "./types";

function detectTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

let cached: Platform | null = null;

/**
 * Single entry for host I/O. UI code must import from here — never
 * `@tauri-apps/*` outside `src/platform/`.
 */
export async function getPlatform(): Promise<Platform> {
  if (cached) return cached;
  if (detectTauri()) {
    const { tauriPlatform } = await import("./tauri");
    cached = tauriPlatform;
  } else {
    cached = webPlatform;
  }
  return cached;
}

export function isTauriRuntime(): boolean {
  return detectTauri();
}
