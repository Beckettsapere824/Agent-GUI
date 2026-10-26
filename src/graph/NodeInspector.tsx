import { useGraphStore } from "../store/graphStore";

export function NodeInspector() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const node = useGraphStore((s) => s.graph.nodes.find((n) => n.id === selectedNodeId));
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const removeNode = useGraphStore((s) => s.removeNode);
  const clearSelection = useGraphStore((s) => s.clearSelection);

  if (!node) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600 text-xs px-4 text-center">
        Select a node to inspect
      </div>
    );
  }

  const d = node.data;

  return (
    <div className="h-full flex flex-col text-xs">
      <div className="h-8 shrink-0 flex items-center justify-between px-3 border-b border-border bg-[#12151c]">
        <span className="text-gray-300 font-medium uppercase tracking-wide text-[10px]">
          {node.kind}
        </span>
        <button
          className="text-gray-500 hover:text-gray-300"
          onClick={clearSelection}
          title="Clear selection"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <Field label="ID">
          <div className="font-mono text-gray-400">{node.id}</div>
        </Field>

        <Field label="Label">
          <input
            className="w-full bg-[#0f1115] border border-border rounded px-2 py-1.5 text-gray-100 outline-none focus:border-accent"
            value={d.label}
            onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
          />
        </Field>

        {node.kind === "agent" && (
          <Field label="Model">
            <input
              className="w-full bg-[#0f1115] border border-border rounded px-2 py-1.5 text-gray-100 outline-none focus:border-accent"
              value={d.model ?? ""}
              onChange={(e) => updateNodeData(node.id, { model: e.target.value })}
            />
          </Field>
        )}

        {node.kind === "tool" && (
          <Field label="Category">
            <input
              className="w-full bg-[#0f1115] border border-border rounded px-2 py-1.5 text-gray-100 outline-none focus:border-accent"
              value={d.category ?? ""}
              onChange={(e) => updateNodeData(node.id, { category: e.target.value })}
            />
          </Field>
        )}

        {node.kind === "skill" && (
          <Field label="Description">
            <textarea
              className="w-full bg-[#0f1115] border border-border rounded px-2 py-1.5 text-gray-100 outline-none focus:border-accent min-h-[64px] resize-y"
              value={d.description ?? ""}
              onChange={(e) => updateNodeData(node.id, { description: e.target.value })}
            />
          </Field>
        )}

        {node.kind === "file" && (
          <Field label="Path">
            <input
              className="w-full bg-[#0f1115] border border-border rounded px-2 py-1.5 text-gray-100 font-mono outline-none focus:border-accent"
              value={d.path ?? d.label}
              onChange={(e) =>
                updateNodeData(node.id, { path: e.target.value, label: e.target.value })
              }
            />
          </Field>
        )}

        <div className="pt-2 border-t border-border">
          <button
            className="w-full h-8 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 text-[11px]"
            onClick={() => removeNode(node.id)}
          >
            Delete node
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      {children}
    </label>
  );
}
