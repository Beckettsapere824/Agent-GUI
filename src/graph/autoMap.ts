import type { NormalizedEvent } from "../runtime/transcript";
import { useGraphStore } from "../store/graphStore";

/**
 * When a session event references a tool/file not on the graph,
 * create a lightweight node so lighting and inspection stay coherent.
 */
export function autoMapEvent(e: NormalizedEvent): string | undefined {
  if (e.nodeId) {
    const exists = useGraphStore.getState().graph.nodes.some((n) => n.id === e.nodeId);
    if (exists) return e.nodeId;
  }

  const graph = useGraphStore.getState().graph;
  const label = e.label.trim();
  if (!label) return e.nodeId;

  // Match by label
  const byLabel = graph.nodes.find(
    (n) => n.data.label === label || n.data.path === label || n.data.path === e.detail
  );
  if (byLabel) return byLabel.id;

  const kind =
    e.kind === "read" || e.kind === "write" || (e.detail && /[./]/.test(e.detail))
      ? e.kind === "tool"
        ? "tool"
        : "file"
      : e.kind === "tool"
      ? "tool"
      : e.kind === "think"
      ? null
      : "tool";

  if (!kind) return e.nodeId;

  // Avoid flooding: only auto-add tools and files
  if (kind === "tool") {
    const id = useGraphStore.getState().addNode("tool", 380 + Math.random() * 40, 80 + graph.nodes.length * 12);
    useGraphStore.getState().updateNodeData(id, {
      label,
      category: "session",
    });
    const agent = graph.nodes.find((n) => n.kind === "agent");
    if (agent) useGraphStore.getState().addEdge(agent.id, id);
    return id;
  }

  if (kind === "file") {
    const path = e.detail || label;
    const id = useGraphStore.getState().addNode("file", 80 + Math.random() * 40, 360 + Math.random() * 40);
    useGraphStore.getState().updateNodeData(id, { label: path, path });
    return id;
  }

  return e.nodeId;
}
