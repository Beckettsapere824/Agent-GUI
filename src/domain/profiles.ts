import type { DomainGraph, HarnessModel } from "./types";
import { sampleDomainGraph } from "./sampleGraph";
import { sampleHarness } from "./sampleHarness";
import { useGraphStore } from "../store/graphStore";
import { useHarnessStore } from "../store/harnessStore";
import { useProjectStore } from "../store/projectStore";

export interface AgentProfile {
  id: string;
  name: string;
  description: string;
  graph: DomainGraph;
  harness: HarnessModel;
}

function cloneGraph(g: DomainGraph): DomainGraph {
  return JSON.parse(JSON.stringify(g)) as DomainGraph;
}

function cloneHarness(h: HarnessModel): HarnessModel {
  return JSON.parse(JSON.stringify(h)) as HarnessModel;
}

const codingGraph: DomainGraph = cloneGraph(sampleDomainGraph);
const codingHarness: HarnessModel = cloneHarness(sampleHarness);

const reviewGraph: DomainGraph = {
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

const reviewHarness: HarnessModel = {
  rootId: "root",
  nodes: {
    root: {
      id: "root",
      kind: "root",
      name: "review-agent",
      path: "/",
      file: "HARNESS.md",
      summary:
        "Role: code review specialist.\n\nPrefer smallest correct feedback. Load skills/code-review before commenting on diffs.",
      children: ["r-skills", "r-tools"],
    },
    "r-skills": {
      id: "r-skills",
      kind: "route",
      name: "skills/",
      path: "skills/",
      file: "SKILLS.md",
      summary: "Review-oriented skills only.",
      children: ["s-review"],
    },
    "r-tools": {
      id: "r-tools",
      kind: "route",
      name: "tools/",
      path: "tools/",
      file: "TOOLS.md",
      summary: "Read + shell for inspection.",
      children: ["t-fs", "t-shell"],
    },
    "s-review": {
      id: "s-review",
      kind: "skill",
      name: "code-review",
      path: "skills/code-review/",
      file: "SKILL.md",
      summary:
        "---\nname: code-review\ndescription: Review patches\n---\n\n# Code Review\n\n- Prefer smallest correct diff\n- Flag missing tests",
    },
    "t-fs": {
      id: "t-fs",
      kind: "leaf",
      name: "filesystem",
      path: "tools/filesystem/",
      file: "HARNESS.md",
      summary: "read_file / list_dir for reviewing sources.",
    },
    "t-shell": {
      id: "t-shell",
      kind: "leaf",
      name: "shell",
      path: "tools/shell/",
      file: "HARNESS.md",
      summary: "git diff / test runners only when needed.",
    },
  },
};

const researchGraph: DomainGraph = {
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

const researchHarness: HarnessModel = {
  rootId: "root",
  nodes: {
    root: {
      id: "root",
      kind: "root",
      name: "research-agent",
      path: "/",
      file: "HARNESS.md",
      summary:
        "Role: research and design docs.\n\nUse harness-sdd before large proposals. Prefer read + search over write.",
      children: ["r-skills", "r-tools", "r-context"],
    },
    "r-skills": {
      id: "r-skills",
      kind: "route",
      name: "skills/",
      path: "skills/",
      file: "SKILLS.md",
      summary: "SDD is primary.",
      children: ["s-sdd"],
    },
    "r-tools": {
      id: "r-tools",
      kind: "route",
      name: "tools/",
      path: "tools/",
      file: "TOOLS.md",
      summary: "Read and web search.",
      children: ["t-fs", "t-web"],
    },
    "r-context": {
      id: "r-context",
      kind: "route",
      name: "context/",
      path: "context/",
      file: "CONTEXT.md",
      summary: "Project docs and architecture notes.",
      children: ["c-arch"],
    },
    "s-sdd": {
      id: "s-sdd",
      kind: "skill",
      name: "harness-sdd",
      path: "skills/harness-sdd/",
      file: "SKILL.md",
      summary:
        "---\nname: harness-sdd\ndescription: Structured design docs\n---\n\n# SDD\n\n1. Goal / non-goals\n2. Affected modules\n3. Interfaces",
    },
    "t-fs": {
      id: "t-fs",
      kind: "leaf",
      name: "filesystem",
      path: "tools/filesystem/",
      file: "HARNESS.md",
      summary: "read_file for repo context.",
    },
    "t-web": {
      id: "t-web",
      kind: "leaf",
      name: "web",
      path: "tools/web/",
      file: "HARNESS.md",
      summary: "web_search with citation discipline.",
    },
    "c-arch": {
      id: "c-arch",
      kind: "leaf",
      name: "architecture",
      path: "context/architecture/",
      file: "ARCH.md",
      summary: "Layering and module map.",
    },
  },
};

const blankGraph: DomainGraph = {
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

const blankHarness: HarnessModel = {
  rootId: "root",
  nodes: {
    root: {
      id: "root",
      kind: "root",
      name: "blank-agent",
      path: "/",
      file: "HARNESS.md",
      summary: "Empty harness — add routes and leaves as you define the agent.",
      children: [],
    },
  },
};

export const AGENT_PROFILES: AgentProfile[] = [
  {
    id: "coding",
    name: "Coding",
    description: "Full coding surface + full progressive harness",
    graph: codingGraph,
    harness: codingHarness,
  },
  {
    id: "review",
    name: "Review",
    description: "Read + bash + code-review skill/harness",
    graph: reviewGraph,
    harness: reviewHarness,
  },
  {
    id: "research",
    name: "Research",
    description: "Read / search / SDD harness",
    graph: researchGraph,
    harness: researchHarness,
  },
  {
    id: "blank",
    name: "Blank",
    description: "Single agent + empty harness root",
    graph: blankGraph,
    harness: blankHarness,
  },
];

export function getProfile(id: string): AgentProfile | undefined {
  return AGENT_PROFILES.find((p) => p.id === id);
}

/** Apply graph + harness together (undoable graph via replaceGraph). */
export function applyProfile(id: string): boolean {
  const p = getProfile(id);
  if (!p) return false;
  useGraphStore.getState().replaceGraph(cloneGraph(p.graph));
  useHarnessStore.getState().replace(cloneHarness(p.harness));
  const proj = useProjectStore.getState();
  if (!proj.name || proj.name === "untitled-project" || proj.name.endsWith("-project")) {
    proj.setName(`${p.id}-project`);
  }
  return true;
}
