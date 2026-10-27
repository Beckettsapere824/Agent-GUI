import type { NormalizedEvent } from "../runtime/transcript";
import { useGraphStore } from "../store/graphStore";

/**
 * Map session events onto graph nodes. Creates tool/file nodes without
 * touching undo history when missing.
 */
export function autoMapEvent(e: NormalizedEvent): string | undefined {
  const store = useGraphStore.getState();
  const graph = store.graph;

  if (e.nodeId) {
    const exists = graph.nodes.some((n) => n.id === e.nodeId);
    if (exists) return e.nodeId;
  }

  const label = e.label.trim();
  if (!label) return e.nodeId;

  const byLabel = graph.nodes.find(
    (n) =>
      n.data.label === label ||
      n.data.path === label ||
      (e.detail != null && (n.data.path === e.detail || n.data.label === e.detail))
  );
  if (byLabel) return byLabel.id;

  if (e.kind === "think") {
    const agent = graph.nodes.find((n) => n.kind === "agent");
    return agent?.id ?? e.nodeId;
  }

  if (e.kind === "tool") {
    const id = store.ensureNode(
      "tool",
      { label, category: "session" },
      380 + (graph.nodes.length % 5) * 8,
      60 + graph.nodes.filter((n) => n.kind === "tool").length * 72
    );
    const agent = graph.nodes.find((n) => n.kind === "agent");
    if (agent) store.ensureEdge(agent.id, id, "uses");
    return id;
  }

  if (e.kind === "read" || e.kind === "write") {
    const path = e.detail || label;
    const id = store.ensureNode(
      "file",
      { label: path, path },
      80 + (graph.nodes.filter((n) => n.kind === "file").length % 3) * 180,
      340 + Math.floor(graph.nodes.filter((n) => n.kind === "file").length / 3) * 70
    );
    return id;
  }

  return e.nodeId;
}
