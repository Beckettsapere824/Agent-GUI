import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

export const SkillNode = memo(({ data }: NodeProps) => {
  const d = data as { label: string; description?: string; active?: boolean };
  const active = !!d.active;
  return (
    <div
      className={`min-w-[140px] rounded-md border shadow transition-all duration-300 ${
        active
          ? "border-violet-400 bg-[#2a2040] ring-2 ring-violet-500/40"
          : "border-violet-500/30 bg-[#1c1828]"
      }`}
    >
      <div className="px-2.5 py-1 border-b border-violet-500/15">
        <span className="text-[10px] font-semibold text-violet-400/80 tracking-wide">SKILL</span>
      </div>
      <div className="px-2.5 py-1.5">
        <div className="text-xs font-medium text-gray-100">{d.label}</div>
        {d.description && (
          <div className="text-[10px] text-gray-500 mt-0.5">{d.description}</div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="!bg-violet-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-violet-400 !w-2 !h-2" />
    </div>
  );
});
