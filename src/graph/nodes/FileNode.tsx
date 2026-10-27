import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

export const FileNode = memo(({ data }: NodeProps) => {
  const d = data as { label: string; path?: string; active?: boolean; dimmed?: boolean };
  const active = !!d.active;
  const dimmed = !!d.dimmed;
  return (
    <div
      className={`min-w-[120px] rounded-md border shadow transition-all duration-300 ${dimmed ? "opacity-35 " : ""}${
        active
          ? "border-amber-400 bg-[#2a2210] ring-2 ring-amber-500/40"
          : "border-amber-500/30 bg-[#1c1810]"
      }`}
    >
      <div className="px-2.5 py-1 border-b border-amber-500/15">
        <span className="text-[10px] font-semibold text-amber-400/80 tracking-wide">FILE</span>
      </div>
      <div className="px-2.5 py-1.5">
        <div className="text-xs font-medium text-gray-100 font-mono truncate max-w-[180px]">
          {d.path || d.label}
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-amber-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-amber-400 !w-2 !h-2" />
    </div>
  );
});
