import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

export const ToolNode = memo(({ data }: NodeProps) => {
  const d = data as { label: string; category?: string; active?: boolean };
  const active = !!d.active;
  return (
    <div
      className={`min-w-[130px] rounded-md border shadow transition-all duration-300 ${
        active
          ? "border-emerald-400 bg-[#1a3028] ring-2 ring-emerald-500/40"
          : "border-emerald-500/30 bg-[#15201a]"
      }`}
    >
      <div className="px-2.5 py-1 border-b border-emerald-500/15">
        <span className="text-[10px] font-semibold text-emerald-400/80 tracking-wide">TOOL</span>
      </div>
      <div className="px-2.5 py-1.5">
        <div className="text-xs font-medium text-gray-100">{d.label}</div>
        {d.category && <div className="text-[10px] text-gray-500">{d.category}</div>}
      </div>
      <Handle type="target" position={Position.Left} className="!bg-emerald-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-emerald-400 !w-2 !h-2" />
    </div>
  );
});
