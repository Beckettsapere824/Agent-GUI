import { create } from "zustand";
import { getPlatform, type DirEntry, type HostInfo } from "../platform";

interface WorkspaceState {
  root: string;
  host: HostInfo | null;
  entries: DirEntry[];
  loading: boolean;
  error: string | null;
  init: () => Promise<void>;
  setRoot: (path: string) => Promise<void>;
  refresh: () => Promise<void>;
  readFile: (path: string) => Promise<string>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  root: "",
  host: null,
  entries: [],
  loading: false,
  error: null,

  init: async () => {
    set({ loading: true, error: null });
    try {
      const p = await getPlatform();
      const host = await p.hostInfo();
      const root = host.kind === "web" ? "" : host.cwd ?? ".";
      const entries = await p.listDir(root || ".");
      set({ host, root: root || ".", entries, loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  setRoot: async (path) => {
    set({ loading: true, error: null, root: path });
    try {
      const p = await getPlatform();
      const entries = await p.listDir(path);
      set({ entries, loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  refresh: async () => {
    await get().setRoot(get().root);
  },

  readFile: async (path) => {
    const p = await getPlatform();
    return p.readTextFile(path);
  },
}));
