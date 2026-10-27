import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

export const ToolNode = memo(({ data }: NodeProps) => {
  const d = data as { label: string; category?: string; active?: boolean; dimmed?: boolean };
  const active = !!d.active;
  const dimmed = !!d.dimmed;
  return (
    <div
      className={`min-w-[140px] rounded-md border shadow transition-all duration-300 ${dimmed ? "opacity-35 " : ""}${
        active
          ? "border-emerald-400 bg-[#142820] ring-2 ring-emerald-500/40"
          : "border-emerald-500/30 bg-[#121c18]"
      }`}
    >
      <div className="px-2.5 py-1 border-b border-emerald-500/15 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-emerald-400/80 tracking-wide">TOOL</span>
        {d.category && <span className="text-[9px] text-gray-600">{d.category}</span>}
      </div>
      <div className="px-2.5 py-1.5">
        <div className="text-xs font-medium text-gray-100 font-mono">{d.label}</div>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-emerald-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-emerald-400 !w-2 !h-2" />
    </div>
  );
});
