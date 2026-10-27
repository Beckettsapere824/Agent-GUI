import type { DomainGraph, HarnessModel } from "./types";
import { useGraphStore } from "../store/graphStore";
import { useHarnessStore } from "../store/harnessStore";
import { useProjectStore } from "../store/projectStore";
import { useWorkspaceStore } from "../store/workspaceStore";

/** Portable graph+harness bundle (profile pair). */
export interface ProfilePairSnapshot {
  version: 1;
  kind: "agent-os-profile";
  id?: string;
  name: string;
  description?: string;
  exportedAt: string;
  graph: DomainGraph;
  harness: HarnessModel;
  profileId?: string | null;
  profileName?: string | null;
  layoutId?: string | null;
}

export function exportProfilePair(name?: string, description?: string): string {
  const proj = useProjectStore.getState();
  const ws = useWorkspaceStore.getState();
  const snap: ProfilePairSnapshot = {
    version: 1,
    kind: "agent-os-profile",
    id: proj.id,
    name: name ?? proj.name ?? "profile",
    description,
    exportedAt: new Date().toISOString(),
    graph: useGraphStore.getState().graph,
    harness: useHarnessStore.getState().model,
    profileId: ws.activeProfileId,
    profileName: ws.activeProfileName,
    layoutId: ws.activeLayoutId,
  };
  return JSON.stringify(snap, null, 2);
}

export function importProfilePair(raw: string): boolean {
  try {
    const snap = JSON.parse(raw) as ProfilePairSnapshot;
    if (snap.version !== 1 || snap.kind !== "agent-os-profile") return false;
    if (!snap.graph || !snap.harness) return false;
    useGraphStore.getState().replaceGraph(snap.graph);
    useHarnessStore.getState().replace(snap.harness);
    useWorkspaceStore
      .getState()
      .setProfile(snap.profileId ?? null, snap.profileName ?? snap.name ?? null);
    useWorkspaceStore.getState().setLayout(snap.layoutId ?? null);
    if (snap.layoutId) {
      void import("../desktop/layouts").then(({ applyLayout }) => {
        applyLayout(snap.layoutId!);
      });
    }
    const proj = useProjectStore.getState();
    if (snap.name) proj.setName(snap.name);
    proj.saveLocal();
    return true;
  } catch {
    return false;
  }
}

export function downloadText(filename: string, text: string, mime = "application/json") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function pickTextFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) {
        resolve(null);
        return;
      }
      resolve(await f.text());
    };
    input.click();
  });
}
