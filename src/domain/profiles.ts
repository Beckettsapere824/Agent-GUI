import type { DomainGraph } from "./types";
import { sampleDomainGraph } from "./sampleGraph";

export interface AgentProfile {
  id: string;
  name: string;
  description: string;
  graph: DomainGraph;
}

function cloneGraph(g: DomainGraph): DomainGraph {
  return JSON.parse(JSON.stringify(g)) as DomainGraph;
}

/** Coding — default sample graph. */
const coding: DomainGraph = cloneGraph(sampleDomainGraph);

/** Review-focused: lighter tool surface, emphasize code-review skill. */
const review: DomainGraph = {
  nodes: [
    {
      id: "agent-1",
      kind: "agent",
      x: 80,
      y: 160,
      data: { label: "Review Agent", status: "idle", model: "claude-sonnet" },
    },
    {
      id: "tool-1",
      kind: "tool",
      x: 380,
      y: 80,
      data: { label: "read_file", category: "fs" },
    },
    {
      id: "tool-3",
      kind: "tool",
      x: 380,
      y: 200,
      data: { label: "bash", category: "shell" },
    },
    {
      id: "skill-2",
      kind: "skill",
      x: 680,
      y: 140,
      data: { label: "code-review", description: "Review & suggest fixes" },
    },
    {
      id: "file-1",
      kind: "file",
      x: 80,
      y: 340,
      data: { label: "src/main.rs", path: "src/main.rs" },
    },
  ],
  edges: [
    { id: "e1", source: "agent-1", target: "tool-1", kind: "uses" },
    { id: "e2", source: "agent-1", target: "tool-3", kind: "uses" },
    { id: "e3", source: "agent-1", target: "skill-2", kind: "uses" },
    { id: "e4", source: "tool-1", target: "file-1", kind: "reads" },
  ],
};

/** Research / docs: harness-sdd + read-heavy. */
const research: DomainGraph = {
  nodes: [
    {
      id: "agent-1",
      kind: "agent",
      x: 80,
      y: 140,
      data: { label: "Research Agent", status: "idle", model: "claude-sonnet" },
    },
    {
      id: "tool-1",
      kind: "tool",
      x: 380,
      y: 60,
      data: { label: "read_file", category: "fs" },
    },
    {
      id: "tool-web",
      kind: "tool",
      x: 380,
      y: 180,
      data: { label: "web_search", category: "net" },
    },
    {
      id: "skill-1",
      kind: "skill",
      x: 680,
      y: 120,
      data: { label: "harness-sdd", description: "Structured Design Doc" },
    },
    {
      id: "file-readme",
      kind: "file",
      x: 80,
      y: 320,
      data: { label: "README.md", path: "README.md" },
    },
    {
      id: "file-h",
      kind: "file",
      x: 280,
      y: 320,
      data: { label: "HARNESS.md", path: "HARNESS.md" },
    },
  ],
  edges: [
    { id: "e1", source: "agent-1", target: "tool-1", kind: "uses" },
    { id: "e2", source: "agent-1", target: "tool-web", kind: "uses" },
    { id: "e3", source: "agent-1", target: "skill-1", kind: "uses" },
    { id: "e4", source: "tool-1", target: "file-readme", kind: "reads" },
    { id: "e5", source: "tool-1", target: "file-h", kind: "reads" },
  ],
};

/** Minimal blank agent for custom builds. */
const blank: DomainGraph = {
  nodes: [
    {
      id: "agent-1",
      kind: "agent",
      x: 200,
      y: 160,
      data: { label: "New Agent", status: "idle", model: "unspecified" },
    },
  ],
  edges: [],
};

export const AGENT_PROFILES: AgentProfile[] = [
  {
    id: "coding",
    name: "Coding",
    description: "Full coding surface: fs tools, shell, skills",
    graph: coding,
  },
  {
    id: "review",
    name: "Review",
    description: "Read + bash + code-review skill",
    graph: review,
  },
  {
    id: "research",
    name: "Research",
    description: "Read / search / SDD harness",
    graph: research,
  },
  {
    id: "blank",
    name: "Blank",
    description: "Single agent — build the graph yourself",
    graph: blank,
  },
];

export function getProfile(id: string): AgentProfile | undefined {
  return AGENT_PROFILES.find((p) => p.id === id);
}
