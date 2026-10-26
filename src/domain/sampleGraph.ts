import type { DomainGraph } from "./types";

export const sampleDomainGraph: DomainGraph = {
  nodes: [
    {
      id: "agent-1",
      kind: "agent",
      x: 80,
      y: 160,
      data: { label: "Coding Agent", status: "idle", model: "claude-sonnet" },
    },
    {
      id: "tool-1",
      kind: "tool",
      x: 380,
      y: 60,
      data: { label: "read_file", category: "fs" },
    },
    {
      id: "tool-2",
      kind: "tool",
      x: 380,
      y: 160,
      data: { label: "write_file", category: "fs" },
    },
    {
      id: "tool-3",
      kind: "tool",
      x: 380,
      y: 260,
      data: { label: "bash", category: "shell" },
    },
    {
      id: "skill-1",
      kind: "skill",
      x: 680,
      y: 100,
      data: { label: "harness-sdd", description: "Structured Design Doc" },
    },
    {
      id: "skill-2",
      kind: "skill",
      x: 680,
      y: 220,
      data: { label: "code-review", description: "Review & suggest fixes" },
    },
    {
      id: "file-1",
      kind: "file",
      x: 80,
      y: 360,
      data: { label: "src/main.rs", path: "src/main.rs" },
    },
    {
      id: "file-2",
      kind: "file",
      x: 280,
      y: 360,
      data: { label: "Cargo.toml", path: "Cargo.toml" },
    },
  ],
  edges: [
    { id: "e1", source: "agent-1", target: "tool-1", kind: "uses" },
    { id: "e2", source: "agent-1", target: "tool-2", kind: "uses" },
    { id: "e3", source: "agent-1", target: "tool-3", kind: "uses" },
    { id: "e4", source: "agent-1", target: "skill-1", kind: "uses" },
    { id: "e5", source: "agent-1", target: "skill-2", kind: "uses" },
    { id: "e6", source: "tool-2", target: "file-1", kind: "writes" },
    { id: "e7", source: "tool-1", target: "file-2", kind: "reads" },
  ],
};
