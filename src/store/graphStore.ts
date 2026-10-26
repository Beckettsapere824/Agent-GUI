import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { DomainEdge, DomainGraph, DomainNode, GraphNodeData, NodeKind } from "../domain/types";
import { sampleDomainGraph } from "../domain/sampleGraph";

interface GraphState {
  graph: DomainGraph;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  setSelection: (nodeId: string | null, edgeId?: string | null) => void;
  addNode: (kind: NodeKind, x: number, y: number) => string;
  updateNodeData: (id: string, patch: Partial<GraphNodeData>) => void;
  moveNode: (id: string, x: number, y: number) => void;
  removeNode: (id: string) => void;
  addEdge: (source: string, target: string) => void;
  removeEdge: (id: string) => void;
  replaceGraph: (g: DomainGraph) => void;
  clearSelection: () => void;
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

export const useGraphStore = create<GraphState>()(
  immer((set, get) => ({
    graph: structuredClone(sampleDomainGraph),
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

    updateNodeData: (id, patch) =>
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

    removeNode: (id) =>
      set((s) => {
        s.graph.nodes = s.graph.nodes.filter((n) => n.id !== id);
        s.graph.edges = s.graph.edges.filter((e) => e.source !== id && e.target !== id);
        if (s.selectedNodeId === id) s.selectedNodeId = null;
      }),

    addEdge: (source, target) =>
      set((s) => {
        if (source === target) return;
        const exists = s.graph.edges.some((e) => e.source === source && e.target === target);
        if (exists) return;
        s.graph.edges.push({
          id: `e-${++seq}`,
          source,
          target,
          kind: "uses",
        });
      }),

    removeEdge: (id) =>
      set((s) => {
        s.graph.edges = s.graph.edges.filter((e) => e.id !== id);
        if (s.selectedEdgeId === id) s.selectedEdgeId = null;
      }),

    replaceGraph: (g) =>
      set((s) => {
        s.graph = structuredClone(g);
        s.selectedNodeId = null;
        s.selectedEdgeId = null;
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
