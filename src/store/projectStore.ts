import { create } from "zustand";
import { useGraphStore } from "./graphStore";
import { useHarnessStore } from "./harnessStore";
import { useWorkspaceStore } from "./workspaceStore";
import type { DomainGraph, HarnessModel } from "../domain/types";
import { sampleDomainGraph } from "../domain/sampleGraph";
import { sampleHarness } from "../domain/sampleHarness";

const STORAGE_KEY = "agent-os-project-v1";
const REGISTRY_KEY = "agent-os-projects-registry";

export interface ProjectSnapshot {
  version: 1;
  id: string;
  name: string;
  updatedAt: string;
  graph: DomainGraph;
  harness: HarnessModel;
  /** Optional workspace chrome (CP19). Older saves omit these. */
  profileId?: string | null;
  profileName?: string | null;
  layoutId?: string | null;
}

export interface ProjectMeta {
  id: string;
  name: string;
  updatedAt: string;
}

function loadRegistry(): ProjectMeta[] {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ProjectMeta[];
  } catch {
    return [];
  }
}

function saveRegistry(list: ProjectMeta[]) {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(list));
}

function projectKey(id: string) {
  return `agent-os-project:${id}`;
}

function newId() {
  return `proj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildSnapshot(id: string, name: string): ProjectSnapshot {
  const ws = useWorkspaceStore.getState();
  return {
    version: 1,
    id,
    name,
    updatedAt: new Date().toISOString(),
    graph: useGraphStore.getState().graph,
    harness: useHarnessStore.getState().model,
    profileId: ws.activeProfileId,
    profileName: ws.activeProfileName,
    layoutId: ws.activeLayoutId,
  };
}

function applyWorkspaceFromSnap(snap: ProjectSnapshot) {
  useWorkspaceStore.getState().setProfile(snap.profileId ?? null, snap.profileName ?? null);
  useWorkspaceStore.getState().setLayout(snap.layoutId ?? null);
  if (snap.layoutId) {
    // lazy to avoid circular import at module top
    void import("../desktop/layouts").then(({ applyLayout }) => {
      applyLayout(snap.layoutId!);
    });
  }
}

function applySnap(snap: ProjectSnapshot) {
  useGraphStore.getState().replaceGraph(snap.graph);
  useHarnessStore.getState().replace(snap.harness);
  applyWorkspaceFromSnap(snap);
}

interface ProjectState {
  id: string;
  name: string;
  lastSavedAt: string | null;
  registry: ProjectMeta[];
  setName: (n: string) => void;
  refreshRegistry: () => void;
  saveLocal: () => boolean;
  loadLocal: () => boolean;
  loadProject: (id: string) => boolean;
  newProject: (name?: string) => void;
  deleteProject: (id: string) => void;
  exportJson: () => string;
  importJson: (raw: string) => boolean;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  id: "local-default",
  name: "untitled-project",
  lastSavedAt: null,
  registry: typeof localStorage !== "undefined" ? loadRegistry() : [],

  setName: (n) => set({ name: n }),

  refreshRegistry: () => set({ registry: loadRegistry() }),

  saveLocal: () => {
    try {
      const { id, name } = get();
      const snap = buildSnapshot(id, name);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
      localStorage.setItem(projectKey(id), JSON.stringify(snap));
      const reg = loadRegistry().filter((p) => p.id !== id);
      reg.unshift({ id, name, updatedAt: snap.updatedAt });
      saveRegistry(reg.slice(0, 30));
      set({ lastSavedAt: snap.updatedAt, registry: reg.slice(0, 30) });
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
      if (snap.version !== 1 || !snap.graph || !snap.harness) return false;
      applySnap(snap);
      set({
        id: snap.id ?? "local-default",
        name: snap.name,
        lastSavedAt: snap.updatedAt,
        registry: loadRegistry(),
      });
      return true;
    } catch {
      return false;
    }
  },

  loadProject: (id) => {
    try {
      const raw = localStorage.getItem(projectKey(id));
      if (!raw) return false;
      const snap = JSON.parse(raw) as ProjectSnapshot;
      if (snap.version !== 1 || !snap.graph || !snap.harness) return false;
      applySnap(snap);
      localStorage.setItem(STORAGE_KEY, raw);
      set({
        id: snap.id,
        name: snap.name,
        lastSavedAt: snap.updatedAt,
        registry: loadRegistry(),
      });
      return true;
    } catch {
      return false;
    }
  },

  newProject: (name = "untitled-project") => {
    const id = newId();
    useGraphStore.getState().replaceGraph(structuredClone(sampleDomainGraph));
    useHarnessStore.getState().replace(structuredClone(sampleHarness));
    useWorkspaceStore.getState().setProfile(null, null);
    useWorkspaceStore.getState().setLayout(null);
    set({ id, name, lastSavedAt: null });
    get().saveLocal();
  },

  deleteProject: (id) => {
    localStorage.removeItem(projectKey(id));
    const reg = loadRegistry().filter((p) => p.id !== id);
    saveRegistry(reg);
    if (get().id === id) {
      get().newProject();
    } else {
      set({ registry: reg });
    }
  },

  exportJson: () => {
    const snap = buildSnapshot(get().id, get().name);
    return JSON.stringify(snap, null, 2);
  },

  importJson: (raw) => {
    try {
      const snap = JSON.parse(raw) as ProjectSnapshot;
      if (snap.version !== 1 || !snap.graph || !snap.harness) return false;
      const id = snap.id || newId();
      applySnap({ ...snap, id });
      set({
        id,
        name: snap.name ?? "imported",
        lastSavedAt: snap.updatedAt ?? null,
      });
      get().saveLocal();
      return true;
    } catch {
      return false;
    }
  },
}));
