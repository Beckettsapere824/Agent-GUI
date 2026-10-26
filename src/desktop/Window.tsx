import { useRef, useState, useCallback, ReactNode } from "react";
import { WindowState, useOSStore } from "../store/osStore";

interface Props {
  win: WindowState;
  children: ReactNode;
}

export function Window({ win, children }: Props) {
  const { focusWindow, moveWindow, resizeWindow, closeWindow, toggleMinimize, toggleMaximize } =
    useOSStore();
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    origW: number;
    origH: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);

  const onMouseDownTitle = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 || win.maximized) return;
      e.preventDefault();
      focusWindow(win.id);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: win.x,
        origY: win.y,
      };
      setDragging(true);

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        moveWindow(win.id, dragRef.current.origX + dx, dragRef.current.origY + dy);
      };

      const onUp = () => {
        dragRef.current = null;
        setDragging(false);
        globalThis.window.removeEventListener("mousemove", onMove);
        globalThis.window.removeEventListener("mouseup", onUp);
      };

      globalThis.window.addEventListener("mousemove", onMove);
      globalThis.window.addEventListener("mouseup", onUp);
    },
    [win, focusWindow, moveWindow]
  );

  const onMouseDownResize = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 || win.maximized) return;
      e.preventDefault();
      e.stopPropagation();
      focusWindow(win.id);
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origW: win.width,
        origH: win.height,
      };
      setResizing(true);

      const onMove = (ev: MouseEvent) => {
        if (!resizeRef.current) return;
        const dx = ev.clientX - resizeRef.current.startX;
        const dy = ev.clientY - resizeRef.current.startY;
        resizeWindow(win.id, resizeRef.current.origW + dx, resizeRef.current.origH + dy);
      };

      const onUp = () => {
        resizeRef.current = null;
        setResizing(false);
        globalThis.window.removeEventListener("mousemove", onMove);
        globalThis.window.removeEventListener("mouseup", onUp);
      };

      globalThis.window.addEventListener("mousemove", onMove);
      globalThis.window.addEventListener("mouseup", onUp);
    },
    [win, focusWindow, resizeWindow]
  );

  const style: React.CSSProperties = win.maximized
    ? {
        left: 0,
        top: 0,
        width: "100%",
        height: "calc(100% - 40px)",
        zIndex: win.zIndex,
      }
    : {
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.zIndex,
      };

  return (
    <div
      className={`absolute flex flex-col bg-panel border border-border rounded-lg shadow-2xl overflow-hidden ${
        dragging || resizing ? "cursor-default" : ""
      }`}
      style={style}
      onMouseDown={() => focusWindow(win.id)}
    >
      <div
        className="h-9 flex items-center justify-between px-3 bg-[#1a1f2a] border-b border-border select-none shrink-0"
        onMouseDown={onMouseDownTitle}
        onDoubleClick={() => toggleMaximize(win.id)}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-gray-200 truncate">
          <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
          {win.title}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            className="w-8 h-7 flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white text-sm leading-none"
            onClick={(e) => {
              e.stopPropagation();
              toggleMinimize(win.id);
            }}
            title="Minimize"
          >
            −
          </button>
          <button
            className="w-8 h-7 flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white text-xs leading-none"
            onClick={(e) => {
              e.stopPropagation();
              toggleMaximize(win.id);
            }}
            title="Maximize"
          >
            {win.maximized ? "❐" : "□"}
          </button>
          <button
            className="w-8 h-7 flex items-center justify-center rounded hover:bg-red-500/80 text-gray-400 hover:text-white text-sm leading-none"
            onClick={(e) => {
              e.stopPropagation();
              closeWindow(win.id);
            }}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">{children}</div>

      {!win.maximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={onMouseDownResize}
          style={{
            background:
              "linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.12) 60%, transparent 60%)",
          }}
        />
      )}
    </div>
  );
}
