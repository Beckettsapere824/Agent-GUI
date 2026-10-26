import { useMemo, memo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  BackgroundVariant,
  MarkerType,
  Handle,
  Position,
  NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useHarnessStore } from "../store/harnessStore";
import type { HarnessNodeKind } from "../domain/types";

const RootNode = memo(({ data, selected }: NodeProps) => {
  const d = data as { label: string };
  return (
    <div
      className={`min-w-[140px] rounded-lg border px-3 py-2 shadow ${
        selected ? "border-sky-400 ring-2 ring-sky-500/30" : "border-sky-500/40"
      } bg-[#152030]`}
    >
      <div className="text-[10px] font-semibold text-sky-400 tracking-wide">HARNESS ROOT</div>
      <div className="text-sm font-medium text-gray-100 mt-0.5">{d.label}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-sky-400 !w-2 !h-2" />
    </div>
  );
});

const RouteNode = memo(({ data, selected }: NodeProps) => {
  const d = data as { label: string };
  return (
    <div
      className={`min-w-[120px] rounded-md border px-2.5 py-1.5 shadow bg-[#1a1830] ${
        selected ? "border-indigo-400 ring-2 ring-indigo-500/30" : "border-indigo-500/35"
      }`}
    >
      <div className="text-[10px] font-semibold text-indigo-400/90 tracking-wide">ROUTE</div>
      <div className="text-xs font-medium text-gray-100">{d.label}</div>
      <Handle type="target" position={Position.Top} className="!bg-indigo-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400 !w-2 !h-2" />
    </div>
  );
});

const LeafNode = memo(({ data, selected }: NodeProps) => {
  const d = data as { label: string; file?: string };
  return (
    <div
      className={`min-w-[110px] rounded-md border px-2.5 py-1.5 shadow ${
        selected ? "border-teal-400 ring-2 ring-teal-500/30" : "border-teal-500/30"
      }`}
      style={{ background: "#14221c" }}
    >
      <div className="text-[10px] font-semibold text-teal-400/90 tracking-wide">LEAF</div>
      <div className="text-xs font-medium text-gray-100">{d.label}</div>
      {d.file && <div className="text-[10px] text-gray-500 font-mono mt-0.5">{d.file}</div>}
      <Handle type="target" position={Position.Top} className="!bg-teal-400 !w-2 !h-2" />
    </div>
  );
});

const SkillLeafNode = memo(({ data, selected }: NodeProps) => {
  const d = data as { label: string; file?: string };
  return (
    <div
      className={`min-w-[110px] rounded-md border px-2.5 py-1.5 shadow bg-[#1c1828] ${
        selected ? "border-violet-400 ring-2 ring-violet-500/30" : "border-violet-500/30"
      }`}
    >
      <div className="text-[10px] font-semibold text-violet-400/90 tracking-wide">SKILL</div>
      <div className="text-xs font-medium text-gray-100">{d.label}</div>
      {d.file && <div className="text-[10px] text-gray-500 font-mono mt-0.5">{d.file}</div>}
      <Handle type="target" position={Position.Top} className="!bg-violet-400 !w-2 !h-2" />
    </div>
  );
});

const harnessNodeTypes = {
  root: RootNode,
  route: RouteNode,
  leaf: LeafNode,
  skill: SkillLeafNode,
};

const layoutY: Record<HarnessNodeKind, number> = {
  root: 20,
  route: 140,
  leaf: 280,
  skill: 280,
};

export function HarnessPanel() {
  const model = useHarnessStore((s) => s.model);
  const selectedId = useHarnessStore((s) => s.selectedId);
  const select = useHarnessStore((s) => s.select);

  const { nodes, edges } = useMemo(() => {
    const list = Object.values(model.nodes);
    const byKind = {
      root: list.filter((n) => n.kind === "root"),
      route: list.filter((n) => n.kind === "route"),
      leaf: list.filter((n) => n.kind === "leaf"),
      skill: list.filter((n) => n.kind === "skill"),
    };

    const placed: Node[] = [];
    const placeRow = (items: typeof list, y: number, startX: number, gap: number) => {
      items.forEach((n, i) => {
        placed.push({
          id: n.id,
          type: n.kind,
          position: { x: startX + i * gap, y },
          data: { label: n.name, file: n.file },
          selected: n.id === selectedId,
        });
      });
    };

    placeRow(byKind.root, layoutY.root, 280, 200);
    placeRow(byKind.route, layoutY.route, 80, 200);
    const bottom = [...byKind.skill, ...byKind.leaf];
    placeRow(bottom, layoutY.leaf, 20, 120);

    const flowEdges: Edge[] = [];
    for (const n of list) {
      for (const child of n.children ?? []) {
        const color =
          model.nodes[child]?.kind === "skill"
            ? "#8b5cf6"
            : n.kind === "root"
            ? "#38bdf8"
            : "#14b8a6";
        flowEdges.push({
          id: `${n.id}->${child}`,
          source: n.id,
          target: child,
          style: { stroke: color },
          markerEnd: { type: MarkerType.ArrowClosed, color },
          type: "smoothstep",
        });
      }
    }

    return { nodes: placed, edges: flowEdges };
  }, [model, selectedId]);

  const selected = selectedId ? model.nodes[selectedId] : null;

  return (
    <div className="w-full h-full flex">
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="h-8 shrink-0 flex items-center gap-3 px-3 border-b border-border bg-[#12151c] text-[11px] text-gray-400">
          <span className="text-sky-400 font-medium">Harness Structure</span>
          <span className="text-gray-600">|</span>
          <span>progressive disclosure</span>
          <span className="ml-auto text-gray-600">root → route → leaf / skill</span>
        </div>
        <div className="flex-1 min-h-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={harnessNodeTypes}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            onNodeClick={(_, n) => select(n.id)}
            onPaneClick={() => select(null)}
            minZoom={0.3}
            maxZoom={1.8}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#2a2f3a" />
            <Controls showInteractive={false} position="bottom-left" />
          </ReactFlow>
        </div>
      </div>

      <div className="w-72 shrink-0 border-l border-border bg-panel flex flex-col">
        <div className="h-8 shrink-0 flex items-center px-3 border-b border-border bg-[#12151c] text-[10px] uppercase tracking-wide text-gray-500">
          Inspector
        </div>
        {!selected && (
          <div className="flex-1 flex items-center justify-center text-gray-600 text-xs px-4 text-center">
            Select a harness node
          </div>
        )}
        {selected && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Kind</div>
              <div className="text-gray-200 mt-0.5">{selected.kind}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Name</div>
              <div className="text-gray-100 mt-0.5">{selected.name}</div>
            </div>
            {selected.path && (
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wide">Path</div>
                <div className="font-mono text-gray-400 mt-0.5">{selected.path}</div>
              </div>
            )}
            {selected.file && (
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wide">File</div>
                <div className="font-mono text-gray-400 mt-0.5">{selected.file}</div>
              </div>
            )}
            {selected.summary && (
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Content</div>
                <pre className="whitespace-pre-wrap font-mono text-[11px] text-gray-300 bg-[#0f1115] border border-border rounded p-2 max-h-64 overflow-y-auto">
                  {selected.summary}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
