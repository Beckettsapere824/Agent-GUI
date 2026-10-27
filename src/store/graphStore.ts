import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { DomainEdge, DomainGraph, DomainNode, GraphNodeData, NodeKind } from "../domain/types";
import { sampleDomainGraph } from "../domain/sampleGraph";
import { autoLayout } from "../domain/layout";

const HISTORY_LIMIT = 40;

interface GraphState {
  graph: DomainGraph;
  past: DomainGraph[];
  future: DomainGraph[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  setSelection: (nodeId: string | null, edgeId?: string | null) => void;
  addNode: (kind: NodeKind, x: number, y: number) => string;
  /** Session-driven nodes: no undo history, no selection steal. */
  ensureNode: (
    kind: NodeKind,
    data: Partial<GraphNodeData> & { label: string },
    x: number,
    y: number
  ) => string;
  updateNodeData: (id: string, patch: Partial<GraphNodeData>) => void;
  /** Patch without history (session metadata). */
  patchNodeDataSilent: (id: string, patch: Partial<GraphNodeData>) => void;
  moveNode: (id: string, x: number, y: number) => void;
  commitMove: () => void;
  removeNode: (id: string) => void;
  addEdge: (source: string, target: string) => void;
  ensureEdge: (source: string, target: string, kind?: DomainEdge["kind"]) => void;
  removeEdge: (id: string) => void;
  replaceGraph: (g: DomainGraph) => void;
  clearSelection: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  layoutAuto: () => void;
}

let seq = 100;

const defaultsFor = (kind: NodeKind): GraphNodeData => {
  switch (kind) {
    case "agent":
      return { label: "New Agent", status: "idle", model: "unspecified" };
    case "tool":
      return { label: "new_tool", category: "custom" };
    case "skill":
      return { label: "new-skill", description: "" };
    case "file":
      return { label: "path/to/file", path: "path/to/file" };
  }
};

function pushHistory(s: {
  graph: DomainGraph;
  past: DomainGraph[];
  future: DomainGraph[];
}) {
  s.past.push(structuredClone(s.graph));
  if (s.past.length > HISTORY_LIMIT) s.past.shift();
  s.future = [];
}

export const useGraphStore = create<GraphState>()(
  immer((set, get) => ({
    graph: structuredClone(sampleDomainGraph),
    past: [],
    future: [],
    selectedNodeId: null,
    selectedEdgeId: null,

    setSelection: (nodeId, edgeId = null) =>
      set((s) => {
        s.selectedNodeId = nodeId;
        s.selectedEdgeId = edgeId;
      }),

    clearSelection: () =>
      set((s) => {
        s.selectedNodeId = null;
        s.selectedEdgeId = null;
      }),

    addNode: (kind, x, y) => {
      const id = `${kind}-${++seq}`;
      set((s) => {
        pushHistory(s);
        s.graph.nodes.push({
          id,
          kind,
          x,
          y,
          data: defaultsFor(kind),
        });
        s.selectedNodeId = id;
        s.selectedEdgeId = null;
      });
      return id;
    },

    ensureNode: (kind, data, x, y) => {
      const existing = get().graph.nodes.find((n) => {
        if (n.kind !== kind) return false;
        if (data.path && (n.data.path === data.path || n.data.label === data.path)) return true;
        if (data.label && n.data.label === data.label) return true;
        return false;
      });
      if (existing) return existing.id;

      const id = `${kind}-auto-${++seq}`;
      set((s) => {
        s.graph.nodes.push({
          id,
          kind,
          x,
          y,
          data: { ...defaultsFor(kind), ...data },
        });
      });
      return id;
    },

    updateNodeData: (id, patch) =>
      set((s) => {
        pushHistory(s);
        const n = s.graph.nodes.find((x) => x.id === id);
        if (n) Object.assign(n.data, patch);
      }),

    patchNodeDataSilent: (id, patch) =>
      set((s) => {
        const n = s.graph.nodes.find((x) => x.id === id);
        if (n) Object.assign(n.data, patch);
      }),

    moveNode: (id, x, y) =>
      set((s) => {
        const n = s.graph.nodes.find((x) => x.id === id);
        if (n) {
          n.x = x;
          n.y = y;
        }
      }),

    commitMove: () =>
      set((s) => {
        const top = s.past[s.past.length - 1];
        if (top && JSON.stringify(top) === JSON.stringify(s.graph)) return;
        s.past.push(structuredClone(s.graph));
        if (s.past.length > HISTORY_LIMIT) s.past.shift();
        s.future = [];
      }),

    removeNode: (id) =>
      set((s) => {
        pushHistory(s);
        s.graph.nodes = s.graph.nodes.filter((n) => n.id !== id);
        s.graph.edges = s.graph.edges.filter((e) => e.source !== id && e.target !== id);
        if (s.selectedNodeId === id) s.selectedNodeId = null;
      }),

    addEdge: (source, target) =>
      set((s) => {
        if (source === target) return;
        const exists = s.graph.edges.some((e) => e.source === source && e.target === target);
        if (exists) return;
        pushHistory(s);
        s.graph.edges.push({
          id: `e-${++seq}`,
          source,
          target,
          kind: "uses",
        });
      }),

    ensureEdge: (source, target, kind = "uses") =>
      set((s) => {
        if (source === target) return;
        if (s.graph.edges.some((e) => e.source === source && e.target === target)) return;
        s.graph.edges.push({
          id: `e-auto-${++seq}`,
          source,
          target,
          kind,
        });
      }),

    removeEdge: (id) =>
      set((s) => {
        pushHistory(s);
        s.graph.edges = s.graph.edges.filter((e) => e.id !== id);
        if (s.selectedEdgeId === id) s.selectedEdgeId = null;
      }),

    replaceGraph: (g) =>
      set((s) => {
        pushHistory(s);
        s.graph = structuredClone(g);
        s.selectedNodeId = null;
        s.selectedEdgeId = null;
      }),

    undo: () =>
      set((s) => {
        const prev = s.past.pop();
        if (!prev) return;
        s.future.push(structuredClone(s.graph));
        s.graph = prev;
        s.selectedNodeId = null;
        s.selectedEdgeId = null;
      }),

    redo: () =>
      set((s) => {
        const next = s.future.pop();
        if (!next) return;
        s.past.push(structuredClone(s.graph));
        s.graph = next;
        s.selectedNodeId = null;
        s.selectedEdgeId = null;
      }),

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,

    layoutAuto: () =>
      set((s) => {
        pushHistory(s);
        s.graph = autoLayout(s.graph);
      }),
  }))
);

export function domainToFlow(nodes: DomainNode[], edges: DomainEdge[]) {
  return {
    flowNodes: nodes.map((n) => ({
      id: n.id,
      type: n.kind,
      position: { x: n.x, y: n.y },
      data: { ...n.data },
      selected: false,
    })),
    flowEdges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      data: { kind: e.kind },
    })),
  };
}
