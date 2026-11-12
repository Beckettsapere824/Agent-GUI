import { useCallback, useEffect, useMemo, useRef } from "react";
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
  const commitMove = useGraphStore((s) => s.commitMove);
  const addEdge = useGraphStore((s) => s.addEdge);
  const removeEdge = useGraphStore((s) => s.removeEdge);
  const removeNode = useGraphStore((s) => s.removeNode);
  const setSelection = useGraphStore((s) => s.setSelection);
  const undo = useGraphStore((s) => s.undo);
  const redo = useGraphStore((s) => s.redo);

  const activeNodeIds = useActivityStore((s) => s.activeNodeIds);
  const running = useActivityStore((s) => s.running);
  const filterSessionId = useActivityStore((s) => s.filterSessionId);
  const activityEvents = useActivityStore((s) => s.events);

  const sessionNodeIds = useMemo(() => {
    if (!filterSessionId) return null as Set<string> | null;
    const set = new Set<string>();
    for (const e of activityEvents) {
      if (e.sessionId === filterSessionId && e.nodeId) set.add(e.nodeId);
    }
    return set;
  }, [filterSessionId, activityEvents]);

  const draggingRef = useRef(false);
  const snapshotBeforeDrag = useRef<string | null>(null);

  const base = useMemo(() => domainToFlow(graph.nodes, graph.edges), [graph]);

  const [nodes, setNodes] = useState<RFNode[]>(base.flowNodes);
  const [edges, setEdges] = useState<RFEdge[]>(base.flowEdges);

  useEffect(() => {
    const { flowNodes, flowEdges } = domainToFlow(graph.nodes, graph.edges);
    setNodes(
      flowNodes.map((n) => {
        const inSession = !sessionNodeIds || sessionNodeIds.has(n.id);
        const live = !!activeNodeIds[n.id];
        const active = inSession && live;
        return {
          ...n,
          selected: n.id === selectedNodeId,
          data: {
            ...n.data,
            active,
            dimmed: !!sessionNodeIds && !inSession,
            status:
              n.type === "agent"
                ? running
                  ? active
                    ? "running"
                    : inSession
                    ? "busy"
                    : "idle"
                  : (n.data as { status?: string }).status ?? "idle"
                : (n.data as { status?: string }).status,
          },
        };
      })
    );
    setEdges(
      flowEdges.map((e) => {
        const kind = (e.data as { kind?: string } | undefined)?.kind ?? "uses";
        const baseColor = edgeStroke[kind] ?? "#3b82f6";
        const related =
          !sessionNodeIds ||
          sessionNodeIds.has(e.source) ||
          sessionNodeIds.has(e.target);
        const srcLive = !!activeNodeIds[e.source];
        const tgtLive = !!activeNodeIds[e.target];
        const liveEdge = srcLive || tgtLive;
        const color = liveEdge ? "#fbbf24" : baseColor;
        return {
          ...e,
          animated: liveEdge,
          style: {
            stroke: color,
            strokeWidth: liveEdge ? 2.75 : related ? 1.5 : 1,
            opacity: related ? 1 : 0.22,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color },
          type: "smoothstep",
        };
      })
    );
  }, [graph, selectedNodeId, activeNodeIds, running, sessionNodeIds]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      for (const c of changes) {
        if (c.type === "position" && c.position) {
          if (c.dragging && !draggingRef.current) {
            draggingRef.current = true;
            snapshotBeforeDrag.current = JSON.stringify(useGraphStore.getState().graph);
          }
          moveNode(c.id, c.position.x, c.position.y);
          if (c.dragging === false && draggingRef.current) {
            draggingRef.current = false;
            commitMove();
          }
        }
        if (c.type === "select" && c.selected) {
          setSelection(c.id, null);
        }
        if (c.type === "remove") {
          removeNode(c.id);
        }
      }
    },
    [moveNode, commitMove, setSelection, removeNode]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
      for (const c of changes) {
        if (c.type === "remove") removeEdge(c.id);
      }
    },
    [removeEdge]
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (c.source && c.target) addEdge(c.source, c.target);
    },
    [addEdge]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: RFNode) => {
      setSelection(node.id, null);
    },
    [setSelection]
  );

  const onPaneClick = useCallback(() => {
    setSelection(null, null);
  }, [setSelection]);

  return (
    <div className="w-full h-full flex">
      <div className="flex-1 min-w-0 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          proOptions={{ hideAttribution: true }}
          className="bg-transparent"
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#1f2937" />
          <Controls className="!bg-[#12151c] !border-border !shadow-none" />
          <MiniMap
            className="!bg-[#0c0e14] !border-border"
            nodeColor={(n) => {
              if (n.type === "agent") return "#3b82f6";
              if (n.type === "tool") return "#10b981";
              if (n.type === "skill") return "#8b5cf6";
              return "#f59e0b";
            }}
          />
          <Panel position="top-left" className="!m-2">
            <div className="bg-[#12151c]/90 border border-border rounded-lg px-2 py-1.5 backdrop-blur">
              <GraphToolbar />
            </div>
          </Panel>
          {running && (
            <Panel position="top-left" className="!m-2 !mt-14">
              <div className="text-[10px] text-green-400/90 flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                live activity · edges pulse on active nodes
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
      <div className="w-[280px] shrink-0 border-l border-border bg-[#0f1115]">
        <NodeInspector />
      </div>
    </div>
  );
}
