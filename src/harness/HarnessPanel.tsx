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

const RootNode = memo(({ data }: NodeProps) => {
  const d = data as { label: string };
  return (
    <div className="min-w-[140px] rounded-lg border border-sky-500/40 bg-[#152030] px-3 py-2 shadow">
      <div className="text-[10px] font-semibold text-sky-400 tracking-wide">HARNESS ROOT</div>
      <div className="text-sm font-medium text-gray-100 mt-0.5">{d.label}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-sky-400 !w-2 !h-2" />
    </div>
  );
});

const RouteNode = memo(({ data }: NodeProps) => {
  const d = data as { label: string; kind?: string };
  return (
    <div className="min-w-[120px] rounded-md border border-indigo-500/35 bg-[#1a1830] px-2.5 py-1.5 shadow">
      <div className="text-[10px] font-semibold text-indigo-400/90 tracking-wide">
        {d.kind ?? "ROUTE"}
      </div>
      <div className="text-xs font-medium text-gray-100">{d.label}</div>
      <Handle type="target" position={Position.Top} className="!bg-indigo-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400 !w-2 !h-2" />
    </div>
  );
});

const LeafNode = memo(({ data }: NodeProps) => {
  const d = data as { label: string; file?: string };
  return (
    <div className="min-w-[110px] rounded-md border border-teal-500/30 px-2.5 py-1.5 shadow" style={{ background: "#14221c" }}>
      <div className="text-[10px] font-semibold text-teal-400/90 tracking-wide">LEAF</div>
      <div className="text-xs font-medium text-gray-100">{d.label}</div>
      {d.file && <div className="text-[10px] text-gray-500 font-mono mt-0.5">{d.file}</div>}
      <Handle type="target" position={Position.Top} className="!bg-teal-400 !w-2 !h-2" />
    </div>
  );
});

const SkillLeafNode = memo(({ data }: NodeProps) => {
  const d = data as { label: string; file?: string };
  return (
    <div className="min-w-[110px] rounded-md border border-violet-500/30 bg-[#1c1828] px-2.5 py-1.5 shadow">
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

function buildHarnessGraph(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    { id: "root", type: "root", position: { x: 280, y: 20 }, data: { label: "coding-agent" } },
    { id: "r-skills", type: "route", position: { x: 80, y: 140 }, data: { label: "skills/", kind: "ROUTE" } },
    { id: "r-tools", type: "route", position: { x: 280, y: 140 }, data: { label: "tools/", kind: "ROUTE" } },
    { id: "r-context", type: "route", position: { x: 480, y: 140 }, data: { label: "context/", kind: "ROUTE" } },
    { id: "s-sdd", type: "skill", position: { x: 20, y: 280 }, data: { label: "harness-sdd", file: "SKILL.md" } },
    { id: "s-review", type: "skill", position: { x: 140, y: 280 }, data: { label: "code-review", file: "SKILL.md" } },
    { id: "t-fs", type: "leaf", position: { x: 220, y: 280 }, data: { label: "filesystem", file: "HARNESS.md" } },
    { id: "t-shell", type: "leaf", position: { x: 340, y: 280 }, data: { label: "shell", file: "HARNESS.md" } },
    { id: "c-arch", type: "leaf", position: { x: 440, y: 280 }, data: { label: "architecture", file: "ARCH.md" } },
    { id: "c-api", type: "leaf", position: { x: 560, y: 280 }, data: { label: "api-surface", file: "API.md" } },
  ];

  const edge = (id: string, source: string, target: string, color: string): Edge => ({
    id,
    source,
    target,
    style: { stroke: color },
    markerEnd: { type: MarkerType.ArrowClosed, color },
  });

  const edges: Edge[] = [
    edge("e1", "root", "r-skills", "#38bdf8"),
    edge("e2", "root", "r-tools", "#38bdf8"),
    edge("e3", "root", "r-context", "#38bdf8"),
    edge("e4", "r-skills", "s-sdd", "#8b5cf6"),
    edge("e5", "r-skills", "s-review", "#8b5cf6"),
    edge("e6", "r-tools", "t-fs", "#14b8a6"),
    edge("e7", "r-tools", "t-shell", "#14b8a6"),
    edge("e8", "r-context", "c-arch", "#14b8a6"),
    edge("e9", "r-context", "c-api", "#14b8a6"),
  ];

  return { nodes, edges };
}

export function HarnessPanel() {
  const { nodes, edges } = useMemo(() => buildHarnessGraph(), []);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="h-8 shrink-0 flex items-center gap-3 px-3 border-b border-border bg-[#12151c] text-[11px] text-gray-400">
        <span className="text-sky-400 font-medium">Harness Structure</span>
        <span className="text-gray-600">|</span>
        <span>coding-agent · progressive disclosure</span>
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
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable
          minZoom={0.3}
          maxZoom={1.8}
          defaultEdgeOptions={{ type: "smoothstep" }}
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#2a2f3a" />
          <Controls showInteractive={false} position="bottom-left" />
        </ReactFlow>
      </div>
    </div>
  );
}
