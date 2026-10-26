import type { NodeKind } from "../domain/types";
import { useGraphStore } from "../store/graphStore";

const kinds: { kind: NodeKind; label: string; color: string }[] = [
  { kind: "agent", label: "Agent", color: "text-blue-400 border-blue-500/30 hover:bg-blue-500/10" },
  { kind: "tool", label: "Tool", color: "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10" },
  { kind: "skill", label: "Skill", color: "text-violet-400 border-violet-500/30 hover:bg-violet-500/10" },
  { kind: "file", label: "File", color: "text-amber-400 border-amber-500/30 hover:bg-amber-500/10" },
];

export function GraphToolbar() {
  const addNode = useGraphStore((s) => s.addNode);
  const nodeCount = useGraphStore((s) => s.graph.nodes.length);
  const edgeCount = useGraphStore((s) => s.graph.edges.length);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] text-blue-400 font-medium">Graph</span>
      <span className="text-gray-600 text-[11px]">|</span>
      <span className="text-[11px] text-gray-500">
        {nodeCount} nodes · {edgeCount} edges
      </span>
      <span className="text-gray-600 text-[11px]">|</span>
      <span className="text-[10px] text-gray-600 uppercase tracking-wide">Add</span>
      {kinds.map((k) => (
        <button
          key={k.kind}
          className={`h-6 px-2 rounded border text-[11px] ${k.color}`}
          onClick={() => addNode(k.kind, 120 + Math.random() * 200, 80 + Math.random() * 160)}
        >
          + {k.label}
        </button>
      ))}
    </div>
  );
}
