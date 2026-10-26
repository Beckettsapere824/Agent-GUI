import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

export const FileNode = memo(({ data }: NodeProps) => {
  const d = data as { label: string; path?: string; active?: boolean };
  const active = !!d.active;
  return (
    <div
      className={`min-w-[140px] rounded-md border shadow transition-all duration-300 ${
        active
          ? "border-amber-400 bg-[#2a2418] ring-2 ring-amber-500/40"
          : "border-amber-500/25 bg-[#1f1c14]"
      }`}
    >
      <div className="px-2.5 py-1 border-b border-amber-500/15">
        <span className="text-[10px] font-semibold text-amber-400/80 tracking-wide">FILE</span>
      </div>
      <div className="px-2.5 py-1.5">
        <div className="text-xs font-medium text-gray-100 font-mono">{d.label}</div>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-amber-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-amber-400 !w-2 !h-2" />
    </div>
  );
});
