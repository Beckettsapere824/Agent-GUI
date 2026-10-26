/** Domain types independent of React Flow rendering. */

export type NodeKind = "agent" | "tool" | "skill" | "file";

export interface GraphNodeData {
  label: string;
  model?: string;
  category?: string;
  description?: string;
  path?: string;
  status?: "idle" | "busy" | "running";
  active?: boolean;
}

export interface DomainNode {
  id: string;
  kind: NodeKind;
  x: number;
  y: number;
  data: GraphNodeData;
}

export interface DomainEdge {
  id: string;
  source: string;
  target: string;
  kind?: "uses" | "writes" | "reads" | "manages";
}

export interface DomainGraph {
  nodes: DomainNode[];
  edges: DomainEdge[];
}

export type HarnessNodeKind = "root" | "route" | "leaf" | "skill";

export interface HarnessNode {
  id: string;
  kind: HarnessNodeKind;
  name: string;
  path?: string;
  file?: string;
  summary?: string;
  children?: string[];
}

export interface HarnessModel {
  rootId: string;
  nodes: Record<string, HarnessNode>;
}
