import { useMemo, useState } from "react";
import { useGraphStore } from "../store/graphStore";
import { useHarnessStore } from "../store/harnessStore";
import { useLinkStore } from "../store/linkStore";
import { useOSStore } from "../store/osStore";

export function NodeInspector() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const node = useGraphStore((s) => s.graph.nodes.find((n) => n.id === selectedNodeId));
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const removeNode = useGraphStore((s) => s.removeNode);
  const clearSelection = useGraphStore((s) => s.clearSelection);
  const harnessModel = useHarnessStore((s) => s.model);
  const selectHarness = useHarnessStore((s) => s.select);
  const openWindow = useOSStore((s) => s.openWindow);
  const links = useLinkStore((s) => s.links);
  const bind = useLinkStore((s) => s.bind);
  const unbind = useLinkStore((s) => s.unbind);
  const [bindTarget, setBindTarget] = useState("");

  const linked = useMemo(() => {
    if (!node) return [];
    return links
      .filter((l) => l.graphNodeId === node.id)
      .map((l) => ({
        link: l,
        harness: harnessModel.nodes[l.harnessNodeId],
      }))
      .filter((x) => x.harness);
  }, [node, links, harnessModel]);

  const bindable = useMemo(() => {
    if (!node) return [];
    const taken = new Set(linked.map((x) => x.harness!.id));
    return Object.values(harnessModel.nodes).filter(
      (h) => (h.kind === "leaf" || h.kind === "skill" || h.kind === "root") && !taken.has(h.id)
    );
  }, [node, harnessModel, linked]);

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

        <div className="pt-2 border-t border-border space-y-1.5">
          <div className="text-[10px] uppercase tracking-wide text-gray-500">Harness links</div>
          {linked.length === 0 && (
            <div className="text-gray-600 text-[11px]">No harness binding yet</div>
          )}
          {linked.map(({ link, harness: h }) => (
            <div
              key={`${link.graphNodeId}-${link.harnessNodeId}`}
              className="flex gap-1 items-stretch"
            >
              <button
                className="flex-1 text-left px-2 py-1.5 rounded border border-border bg-[#0f1115] hover:border-sky-500/40"
                onClick={() => {
                  selectHarness(h!.id);
                  openWindow({
                    id: "harness",
                    title: "Harness",
                    type: "harness",
                    x: 80,
                    y: 60,
                    width: 900,
                    height: 560,
                  });
                }}
              >
                <div className="text-[10px] text-sky-400/90 uppercase">
                  {h!.kind} · {link.relation}
                </div>
                <div className="text-gray-200">{h!.name}</div>
                {h!.path && <div className="font-mono text-[10px] text-gray-500">{h!.path}</div>}
              </button>
              <button
                className="px-2 rounded border border-border text-gray-500 hover:text-red-400 hover:border-red-500/40"
                title="Unbind"
                onClick={() => unbind(node.id, h!.id)}
              >
                ×
              </button>
            </div>
          ))}
          {bindable.length > 0 && (
            <div className="flex gap-1 pt-1">
              <select
                className="flex-1 h-7 bg-[#0f1115] border border-border rounded px-1 text-[11px] text-gray-300"
                value={bindTarget}
                onChange={(e) => setBindTarget(e.target.value)}
              >
                <option value="">Bind harness…</option>
                {bindable.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.kind}: {h.name}
                  </option>
                ))}
              </select>
              <button
                className="h-7 px-2 rounded text-[10px] bg-sky-500/15 text-sky-300 border border-sky-500/30 disabled:opacity-40"
                disabled={!bindTarget}
                onClick={() => {
                  if (!bindTarget) return;
                  bind(node.id, bindTarget, node.kind === "tool" ? "exposes" : "implements");
                  setBindTarget("");
                }}
              >
                Bind
              </button>
            </div>
          )}
        </div>

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
