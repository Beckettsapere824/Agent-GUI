import { useRef, useState, useCallback, ReactNode } from "react";
import { WindowState, useOSStore } from "../store/osStore";

interface Props {
  window: WindowState;
  children: ReactNode;
}

export function Window({ window, children }: Props) {
  const { focusWindow, moveWindow, closeWindow, toggleMinimize, toggleMaximize } =
    useOSStore();
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const onMouseDownTitle = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      focusWindow(window.id);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: window.x,
        origY: window.y,
      };
      setDragging(true);

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        moveWindow(window.id, dragRef.current.origX + dx, dragRef.current.origY + dy);
      };

      const onUp = () => {
        dragRef.current = null;
        setDragging(false);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [window, focusWindow, moveWindow]
  );

  const style: React.CSSProperties = window.maximized
    ? {
        left: 0,
        top: 0,
        width: "100%",
        height: "calc(100% - 40px)",
        zIndex: window.zIndex,
      }
    : {
        left: window.x,
        top: window.y,
        width: window.width,
        height: window.height,
        zIndex: window.zIndex,
      };

  return (
    <div
      className={`absolute flex flex-col bg-panel border border-border rounded-lg shadow-2xl overflow-hidden ${
        dragging ? "cursor-grabbing" : ""
      }`}
      style={style}
      onMouseDown={() => focusWindow(window.id)}
    >
      <div
        className="h-9 flex items-center justify-between px-3 bg-[#1a1f2a] border-b border-border select-none"
        onMouseDown={onMouseDownTitle}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
          <span className="w-2 h-2 rounded-full bg-accent" />
          {window.title}
        </div>
        <div className="flex items-center gap-1">
          <button
            className="w-7 h-6 flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white text-xs"
            onClick={(e) => {
              e.stopPropagation();
              toggleMinimize(window.id);
            }}
          >
            −
          </button>
          <button
            className="w-7 h-6 flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white text-xs"
            onClick={(e) => {
              e.stopPropagation();
              toggleMaximize(window.id);
            }}
          >
            □
          </button>
          <button
            className="w-7 h-6 flex items-center justify-center rounded hover:bg-red-500/80 text-gray-400 hover:text-white text-xs"
            onClick={(e) => {
              e.stopPropagation();
              closeWindow(window.id);
            }}
          >
            ×
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">{children}</div>
    </div>
  );
}