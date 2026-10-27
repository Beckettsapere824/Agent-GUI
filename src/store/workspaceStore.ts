import { create } from "zustand";
import { getPlatform, isTauriRuntime } from "../platform";
import type { DirEntry } from "../platform/types";

interface WorkspaceState {
  root: string;
  host: "web" | "tauri";
  entries: DirEntry[];
  loading: boolean;
  error: string | null;

  activeProfileId: string | null;
  activeProfileName: string | null;
  activeLayoutId: string | null;

  setProfile: (id: string | null, name?: string | null) => void;
  setLayout: (id: string | null) => void;

  init: () => Promise<void>;
  setRoot: (path: string) => Promise<void>;
  refresh: () => Promise<void>;
  readFile: (path: string) => Promise<string>;
}

async function listSafe(path: string): Promise<DirEntry[]> {
  const p = await getPlatform();
  return p.listDir(path);
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  root: ".",
  host: isTauriRuntime() ? "tauri" : "web",
  entries: [],
  loading: false,
  error: null,

  activeProfileId: null,
  activeProfileName: null,
  activeLayoutId: null,

  setProfile: (id, name = null) =>
    set({ activeProfileId: id, activeProfileName: name ?? id }),
  setLayout: (id) => set({ activeLayoutId: id }),

  init: async () => {
    const p = await getPlatform();
    set({ host: p.kind, loading: true, error: null });
    try {
      const entries = await listSafe(get().root);
      set({ entries, loading: false });
    } catch (e) {
      set({ entries: [], loading: false, error: String(e) });
    }
  },

  setRoot: async (path: string) => {
    set({ root: path, loading: true, error: null });
    try {
      const entries = await listSafe(path);
      set({ entries, loading: false });
    } catch (e) {
      set({ entries: [], loading: false, error: String(e) });
    }
  },

  refresh: async () => {
    const { root } = get();
    set({ loading: true, error: null });
    try {
      const entries = await listSafe(root);
      set({ entries, loading: false });
    } catch (e) {
      set({ entries: [], loading: false, error: String(e) });
    }
  },

  readFile: async (path: string) => {
    const p = await getPlatform();
    return p.readTextFile(path);
  },
}));
