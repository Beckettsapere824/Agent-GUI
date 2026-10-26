import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  MarkerType,
  Panel,
  Connection,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  Node as RFNode,
  Edge as RFEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useState } from "react";
import { AgentNode } from "./nodes/AgentNode";
import { ToolNode } from "./nodes/ToolNode";
import { SkillNode } from "./nodes/SkillNode";
import { FileNode } from "./nodes/FileNode";
import { useActivityStore } from "../store/activityStore";
import { domainToFlow, useGraphStore } from "../store/graphStore";
import { GraphToolbar } from "./GraphToolbar";
import { NodeInspector } from "./NodeInspector";

const nodeTypes = {
  agent: AgentNode,
  tool: ToolNode,
  skill: SkillNode,
  file: FileNode,
};

const edgeStroke: Record<string, string> = {
  uses: "#3b82f6",
  writes: "#10b981",
  reads: "#10b981",
  manages: "#8b5cf6",
};

export function GraphWorkspace() {
  const graph = useGraphStore((s) => s.graph);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const moveNode = useGraphStore((s) => s.moveNode);
  const addEdge = useGraphStore((s) => s.addEdge);
  const removeEdge = useGraphStore((s) => s.removeEdge);
  const removeNode = useGraphStore((s) => s.removeNode);
  const setSelection = useGraphStore((s) => s.setSelection);
  const updateNodeData = useGraphStore((s) => s.updateNodeData);

  const activeNodeIds = useActivityStore((s) => s.activeNodeIds);
  const running = useActivityStore((s) => s.running);

  const base = useMemo(() => domainToFlow(graph.nodes, graph.edges), [graph]);

  const [nodes, setNodes] = useState<RFNode[]>(base.flowNodes);
  const [edges, setEdges] = useState<RFEdge[]>(base.flowEdges);

  // Sync domain → flow when domain changes (add/remove/data)
  useEffect(() => {
    const { flowNodes, flowEdges } = domainToFlow(graph.nodes, graph.edges);
    setNodes(
      flowNodes.map((n) => ({
        ...n,
        selected: n.id === selectedNodeId,
        data: {
          ...n.data,
          active: !!activeNodeIds[n.id],
          status:
            n.type === "agent"
              ? running
                ? activeNodeIds[n.id]
                  ? "running"
                  : "busy"
                : (n.data as { status?: string }).status ?? "idle"
              : (n.data as { status?: string }).status,
        },
      }))
    );
    setEdges(
      flowEdges.map((e) => {
        const kind = (e.data as { kind?: string } | undefined)?.kind ?? "uses";
        const color = edgeStroke[kind] ?? "#3b82f6";
        return {
          ...e,
          style: { stroke: color },
          markerEnd: { type: MarkerType.ArrowClosed, color },
          type: "smoothstep",
        };
      })
    );
  }, [graph, selectedNodeId, activeNodeIds, running]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      for (const c of changes) {
        if (c.type === "position" && c.position && c.dragging === false) {
          moveNode(c.id, c.position.x, c.position.y);
        }
        if (c.type === "select" && c.selected) {
          setSelection(c.id, null);
        }
        if (c.type === "remove") {
          removeNode(c.id);
        }
      }
    },
    [moveNode, setSelection, removeNode]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
      for (const c of changes) {
        if (c.type === "remove") removeEdge(c.id);
        if (c.type === "select" && c.selected) setSelection(null, c.id);
      }
    },
    [removeEdge, setSelection]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        addEdge(connection.source, connection.target);
      }
    },
    [addEdge]
  );

  const onPaneClick = useCallback(() => {
    setSelection(null, null);
  }, [setSelection]);

  // keep activity flags fresh on nodes without full domain rewrite path for agent status only
  useEffect(() => {
    for (const [id, exp] of Object.entries(activeNodeIds)) {
      if (exp < Date.now()) continue;
      // activity store tick handles expiry; visual already bound via effect above
      void id;
    }
  }, [activeNodeIds, updateNodeData]);

  return (
    <div className="w-full h-full flex">
      <div className="flex-1 min-w-0 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          deleteKeyCode={["Backspace", "Delete"]}
          multiSelectionKeyCode="Shift"
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
            <div className="bg-[#161a22]/95 border border-border rounded-md px-2.5 py-1.5 backdrop-blur">
              <GraphToolbar />
              {running && (
                <div className="mt-1 text-[10px] text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  live activity
                </div>
              )}
            </div>
          </Panel>
        </ReactFlow>
      </div>

      <div className="w-64 shrink-0 border-l border-border bg-panel">
        <NodeInspector />
      </div>
    </div>
  );
}
