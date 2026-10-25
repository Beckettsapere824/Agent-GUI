import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

export const AgentNode = memo(({ data }: NodeProps) => {
  const d = data as { label: string; status?: string; model?: string };
  return (
    <div className="min-w-[160px] rounded-lg border border-blue-500/40 bg-[#1a2332] shadow-lg">
      <div className="px-3 py-1.5 border-b border-blue-500/20 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-blue-300 tracking-wide">AGENT</span>
        <span
          className={`w-2 h-2 rounded-full ${
            d.status === "running" ? "bg-green-400 animate-pulse" : "bg-gray-500"
          }`}
        />
      </div>
      <div className="px-3 py-2">
        <div className="text-sm font-medium text-gray-100">{d.label}</div>
        {d.model && (
          <div className="text-[10px] text-gray-500 mt-0.5">{d.model}</div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="!bg-blue-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-blue-400 !w-2 !h-2" />
    </div>
  );
});