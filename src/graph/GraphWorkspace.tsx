import { useCallback } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AgentNode } from "./nodes/AgentNode";
import { ToolNode } from "./nodes/ToolNode";
import { SkillNode } from "./nodes/SkillNode";
import { FileNode } from "./nodes/FileNode";

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
    position: { x: 120, y: 120 },
    data: { label: "Coding Agent", status: "idle", model: "claude-sonnet" },
  },
  {
    id: "tool-1",
    type: "tool",
    position: { x: 420, y: 80 },
    data: { label: "read_file", category: "fs" },
  },
  {
    id: "tool-2",
    type: "tool",
    position: { x: 420, y: 180 },
    data: { label: "write_file", category: "fs" },
  },
  {
    id: "tool-3",
    type: "tool",
    position: { x: 420, y: 280 },
    data: { label: "bash", category: "shell" },
  },
  {
    id: "skill-1",
    type: "skill",
    position: { x: 720, y: 140 },
    data: { label: "harness-sdd", description: "Structured Design Doc" },
  },
  {
    id: "file-1",
    type: "file",
    position: { x: 120, y: 320 },
    data: { label: "src/main.rs", path: "src/main.rs" },
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
    source: "tool-2",
    target: "file-1",
    style: { stroke: "#10b981" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
  },
];

export function GraphWorkspace() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: "smoothstep",
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#2a2f3a" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          maskColor="rgba(15, 17, 21, 0.7)"
        />
      </ReactFlow>
    </div>
  );
}