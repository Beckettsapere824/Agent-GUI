import { create } from "zustand";
import { useGraphStore } from "./graphStore";
import { useHarnessStore } from "./harnessStore";
import type { DomainGraph, HarnessModel } from "../domain/types";

const STORAGE_KEY = "agent-os-project-v1";

export interface ProjectSnapshot {
  version: 1;
  name: string;
  updatedAt: string;
  graph: DomainGraph;
  harness: HarnessModel;
}

interface ProjectState {
  name: string;
  lastSavedAt: string | null;
  setName: (n: string) => void;
  saveLocal: () => boolean;
  loadLocal: () => boolean;
  exportJson: () => string;
  importJson: (raw: string) => boolean;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  name: "untitled-project",
  lastSavedAt: null,

  setName: (n) => set({ name: n }),

  saveLocal: () => {
    try {
      const snap: ProjectSnapshot = {
        version: 1,
        name: get().name,
        updatedAt: new Date().toISOString(),
        graph: useGraphStore.getState().graph,
        harness: useHarnessStore.getState().model,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
      set({ lastSavedAt: snap.updatedAt });
      return true;
    } catch {
      return false;
    }
  },

  loadLocal: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const snap = JSON.parse(raw) as ProjectSnapshot;
      if (snap.version !== 1) return false;
      useGraphStore.getState().replaceGraph(snap.graph);
      useHarnessStore.getState().replace(snap.harness);
      set({ name: snap.name, lastSavedAt: snap.updatedAt });
      return true;
    } catch {
      return false;
    }
  },

  exportJson: () => {
    const snap: ProjectSnapshot = {
      version: 1,
      name: get().name,
      updatedAt: new Date().toISOString(),
      graph: useGraphStore.getState().graph,
      harness: useHarnessStore.getState().model,
    };
    return JSON.stringify(snap, null, 2);
  },

  importJson: (raw) => {
    try {
      const snap = JSON.parse(raw) as ProjectSnapshot;
      if (snap.version !== 1 || !snap.graph || !snap.harness) return false;
      useGraphStore.getState().replaceGraph(snap.graph);
      useHarnessStore.getState().replace(snap.harness);
      set({ name: snap.name ?? "imported", lastSavedAt: snap.updatedAt ?? null });
      return true;
    } catch {
      return false;
    }
  },
}));
