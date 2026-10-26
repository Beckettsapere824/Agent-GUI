import type { DomainGraph, DomainNode, NodeKind } from "./types";

/** Layered left-to-right layout by node kind — no external layout lib. */
const RANK: Record<NodeKind, number> = {
  agent: 0,
  tool: 1,
  skill: 2,
  file: 3,
};

const COL_X = [80, 360, 640, 100];
const ROW_GAP = 100;
const COL_FILE_OFFSET_Y = 320;

export function autoLayout(graph: DomainGraph): DomainGraph {
  const buckets: Record<NodeKind, DomainNode[]> = {
    agent: [],
    tool: [],
    skill: [],
    file: [],
  };
  for (const n of graph.nodes) {
    buckets[n.kind].push(n);
  }

  const nodes: DomainNode[] = [];
  (Object.keys(buckets) as NodeKind[]).forEach((kind) => {
    const list = buckets[kind];
    list.forEach((n, i) => {
      const x = COL_X[RANK[kind]] ?? 80;
      const y =
        kind === "file"
          ? COL_FILE_OFFSET_Y + Math.floor(i / 2) * ROW_GAP
          : 60 + i * ROW_GAP;
      const xFile = kind === "file" ? 80 + (i % 2) * 200 : x;
      nodes.push({
        ...n,
        x: kind === "file" ? xFile : x,
        y,
      });
    });
  });

  return { nodes, edges: graph.edges.map((e) => ({ ...e })) };
}
