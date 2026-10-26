/**
 * Explicit links between Agent Graph nodes and Harness structure nodes.
 * Used by inspectors to show "same concept, two surfaces".
 */

export interface GraphHarnessLink {
  graphNodeId: string;
  harnessNodeId: string;
  relation: "implements" | "documents" | "exposes";
}

export const sampleLinks: GraphHarnessLink[] = [
  { graphNodeId: "skill-1", harnessNodeId: "s-sdd", relation: "implements" },
  { graphNodeId: "skill-2", harnessNodeId: "s-review", relation: "implements" },
  { graphNodeId: "tool-1", harnessNodeId: "t-fs", relation: "exposes" },
  { graphNodeId: "tool-2", harnessNodeId: "t-fs", relation: "exposes" },
  { graphNodeId: "tool-3", harnessNodeId: "t-shell", relation: "exposes" },
  { graphNodeId: "agent-1", harnessNodeId: "root", relation: "documents" },
];

export function harnessIdsForGraph(graphNodeId: string): string[] {
  return sampleLinks.filter((l) => l.graphNodeId === graphNodeId).map((l) => l.harnessNodeId);
}

export function graphIdsForHarness(harnessNodeId: string): string[] {
  return sampleLinks.filter((l) => l.harnessNodeId === harnessNodeId).map((l) => l.graphNodeId);
}
