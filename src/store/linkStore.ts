import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  sampleLinks,
  type GraphHarnessLink,
} from "../domain/links";

interface LinkState {
  links: GraphHarnessLink[];
  /** Replace entire link table (e.g. profile load). */
  replace: (links: GraphHarnessLink[]) => void;
  bind: (graphNodeId: string, harnessNodeId: string, relation?: GraphHarnessLink["relation"]) => void;
  unbind: (graphNodeId: string, harnessNodeId: string) => void;
  unbindAllForGraph: (graphNodeId: string) => void;
  unbindAllForHarness: (harnessNodeId: string) => void;
  harnessIdsForGraph: (graphNodeId: string) => string[];
  graphIdsForHarness: (harnessNodeId: string) => string[];
}

function cloneSample(): GraphHarnessLink[] {
  return sampleLinks.map((l) => ({ ...l }));
}

export const useLinkStore = create<LinkState>()(
  immer((set, get) => ({
    links: cloneSample(),

    replace: (links) =>
      set((s) => {
        s.links = links.map((l) => ({ ...l }));
      }),

    bind: (graphNodeId, harnessNodeId, relation = "implements") =>
      set((s) => {
        const exists = s.links.some(
          (l) => l.graphNodeId === graphNodeId && l.harnessNodeId === harnessNodeId
        );
        if (!exists) {
          s.links.push({ graphNodeId, harnessNodeId, relation });
        }
      }),

    unbind: (graphNodeId, harnessNodeId) =>
      set((s) => {
        s.links = s.links.filter(
          (l) => !(l.graphNodeId === graphNodeId && l.harnessNodeId === harnessNodeId)
        );
      }),

    unbindAllForGraph: (graphNodeId) =>
      set((s) => {
        s.links = s.links.filter((l) => l.graphNodeId !== graphNodeId);
      }),

    unbindAllForHarness: (harnessNodeId) =>
      set((s) => {
        s.links = s.links.filter((l) => l.harnessNodeId !== harnessNodeId);
      }),

    harnessIdsForGraph: (graphNodeId) =>
      get()
        .links.filter((l) => l.graphNodeId === graphNodeId)
        .map((l) => l.harnessNodeId),

    graphIdsForHarness: (harnessNodeId) =>
      get()
        .links.filter((l) => l.harnessNodeId === harnessNodeId)
        .map((l) => l.graphNodeId),
  }))
);
