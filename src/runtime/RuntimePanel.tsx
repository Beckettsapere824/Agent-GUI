import { useEffect, useRef } from "react";
import { useActivityStore, startDemoRun } from "../store/activityStore";

const kindColor: Record<string, string> = {
  read: "text-emerald-400",
  write: "text-amber-400",
  tool: "text-blue-400",
  think: "text-violet-400",
  error: "text-red-400",
};

const kindBadge: Record<string, string> = {
  read: "bg-emerald-500/15 text-emerald-400",
  write: "bg-amber-500/15 text-amber-400",
  tool: "bg-blue-500/15 text-blue-400",
  think: "bg-violet-500/15 text-violet-400",
  error: "bg-red-500/15 text-red-400",
};

export function RuntimePanel() {
  const events = useActivityStore((s) => s.events);
  const running = useActivityStore((s) => s.running);
  const setRunning = useActivityStore((s) => s.setRunning);
  const clear = useActivityStore((s) => s.clear);
  const tick = useActivityStore((s) => s.tick);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const id = setInterval(() => tick(), 200);
    return () => clearInterval(id);
  }, [tick]);

  const onRun = () => {
    if (running) return;
    stopRef.current?.();
    stopRef.current = startDemoRun();
  };

  const onStop = () => {
    stopRef.current?.();
    stopRef.current = null;
    setRunning(false);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="h-9 shrink-0 flex items-center gap-2 px-3 border-b border-border bg-[#12151c]">
        <span className="text-[11px] text-blue-400 font-medium">Agent Runtime</span>
        <span className="text-gray-600 text-[11px]">|</span>
        <span className="text-[11px] text-gray-500">event stream</span>
        <div className="ml-auto flex items-center gap-1.5">
          {running && (
            <span className="flex items-center gap-1 text-[10px] text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              running
            </span>
          )}
          <button
            className="h-6 px-2.5 rounded text-[11px] bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-40"
            onClick={onRun}
            disabled={running}
          >
            Run demo
          </button>
          <button
            className="h-6 px-2 rounded text-[11px] text-gray-400 hover:bg-white/5"
            onClick={onStop}
          >
            Stop
          </button>
          <button
            className="h-6 px-2 rounded text-[11px] text-gray-500 hover:bg-white/5"
            onClick={() => {
              onStop();
              clear();
            }}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto font-mono text-[12px]">
        {events.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            No events — click “Run demo” to simulate a coding agent session
          </div>
        )}
        <ul className="divide-y divide-border/60">
          {events.map((e) => (
            <li key={e.id} className="px-3 py-1.5 flex items-start gap-2 hover:bg-white/[0.02]">
              <span className="text-gray-600 tabular-nums shrink-0 w-14">
                {new Date(e.ts).toLocaleTimeString(undefined, {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
              <span
                className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-sans font-medium ${kindBadge[e.kind]}`}
              >
                {e.kind}
              </span>
              <span className={kindColor[e.kind] ?? "text-gray-300"}>{e.label}</span>
              {e.detail && <span className="text-gray-500 truncate">{e.detail}</span>}
              {e.nodeId && (
                <span className="ml-auto text-[10px] text-gray-600 shrink-0">{e.nodeId}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
