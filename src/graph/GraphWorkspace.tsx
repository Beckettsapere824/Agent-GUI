import { useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Node,
  Edge,
  BackgroundVariant,
  MarkerType,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AgentNode } from "./nodes/AgentNode";
import { ToolNode } from "./nodes/ToolNode";
import { SkillNode } from "./nodes/SkillNode";
import { FileNode } from "./nodes/FileNode";
import { useActivityStore } from "../store/activityStore";

const nodeTypes = {
  agent: AgentNode,
  tool: ToolNode,
  skill: SkillNode,
  file: FileNode,
};

const initialNodes: Node[] = [
  {
    id: "agent-1",
    type: "agent",
    position: { x: 80, y: 160 },
    data: { label: "Coding Agent", status: "idle", model: "claude-sonnet" },
  },
  {
    id: "tool-1",
    type: "tool",
    position: { x: 380, y: 60 },
    data: { label: "read_file", category: "fs" },
  },
  {
    id: "tool-2",
    type: "tool",
    position: { x: 380, y: 160 },
    data: { label: "write_file", category: "fs" },
  },
  {
    id: "tool-3",
    type: "tool",
    position: { x: 380, y: 260 },
    data: { label: "bash", category: "shell" },
  },
  {
    id: "skill-1",
    type: "skill",
    position: { x: 680, y: 100 },
    data: { label: "harness-sdd", description: "Structured Design Doc" },
  },
  {
    id: "skill-2",
    type: "skill",
    position: { x: 680, y: 220 },
    data: { label: "code-review", description: "Review & suggest fixes" },
  },
  {
    id: "file-1",
    type: "file",
    position: { x: 80, y: 360 },
    data: { label: "src/main.rs", path: "src/main.rs" },
  },
  {
    id: "file-2",
    type: "file",
    position: { x: 280, y: 360 },
    data: { label: "Cargo.toml", path: "Cargo.toml" },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1",
    source: "agent-1",
    target: "tool-1",
    style: { stroke: "#3b82f6" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6" },
  },
  {
    id: "e2",
    source: "agent-1",
    target: "tool-2",
    style: { stroke: "#3b82f6" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6" },
  },
  {
    id: "e3",
    source: "agent-1",
    target: "tool-3",
    style: { stroke: "#3b82f6" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6" },
  },
  {
    id: "e4",
    source: "agent-1",
    target: "skill-1",
    style: { stroke: "#8b5cf6" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#8b5cf6" },
  },
  {
    id: "e5",
    source: "agent-1",
    target: "skill-2",
    style: { stroke: "#8b5cf6" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#8b5cf6" },
  },
  {
    id: "e6",
    source: "tool-2",
    target: "file-1",
    style: { stroke: "#10b981" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
  },
  {
    id: "e7",
    source: "tool-1",
    target: "file-2",
    style: { stroke: "#10b981" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
  },
];

export function GraphWorkspace() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const activeNodeIds = useActivityStore((s) => s.activeNodeIds);
  const running = useActivityStore((s) => s.running);

  // Reflect activity onto node data (status / highlight)
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        const active = !!activeNodeIds[n.id];
        const prev = n.data as { status?: string; active?: boolean };
        if (n.type === "agent") {
          const status = running ? (active ? "running" : "busy") : "idle";
          if (prev.status === status && prev.active === active) return n;
          return { ...n, data: { ...n.data, status, active } };
        }
        if (prev.active === active) return n;
        return { ...n, data: { ...n.data, active } };
      })
    );
  }, [activeNodeIds, running, setNodes]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            style: { stroke: "#3b82f6" },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6" },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: "smoothstep",
        }}
        minZoom={0.2}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#2a2f3a" />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          maskColor="rgba(15, 17, 21, 0.75)"
          position="bottom-right"
        />
        <Panel position="top-left" className="!m-2">
          <div className="flex items-center gap-2 bg-[#161a22]/90 border border-border rounded-md px-2.5 py-1.5 text-[11px] text-gray-400 backdrop-blur">
            <span className="text-blue-400 font-medium">Graph</span>
            <span className="text-gray-600">|</span>
            <span>{nodes.length} nodes</span>
            <span className="text-gray-600">·</span>
            <span>{edges.length} edges</span>
            {running && (
              <>
                <span className="text-gray-600">·</span>
                <span className="text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  live
                </span>
              </>
            )}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
