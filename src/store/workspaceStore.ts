import { create } from "zustand";

interface WorkspaceState {
  /** Last applied agent profile id, if any. */
  activeProfileId: string | null;
  activeProfileName: string | null;
  /** Last applied window layout id. */
  activeLayoutId: string | null;
  setProfile: (id: string | null, name?: string | null) => void;
  setLayout: (id: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeProfileId: null,
  activeProfileName: null,
  activeLayoutId: null,
  setProfile: (id, name = null) =>
    set({ activeProfileId: id, activeProfileName: name ?? id }),
  setLayout: (id) => set({ activeLayoutId: id }),
}));
