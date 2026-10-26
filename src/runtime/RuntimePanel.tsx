import { useEffect, useRef, useState } from "react";
import { useActivityStore } from "../store/activityStore";
import { parseTranscript } from "./transcript";

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
  const mode = useActivityStore((s) => s.mode);
  const setRunning = useActivityStore((s) => s.setRunning);
  const clear = useActivityStore((s) => s.clear);
  const tick = useActivityStore((s) => s.tick);
  const startDemoFromTranscript = useActivityStore((s) => s.startDemoFromTranscript);
  const startReplay = useActivityStore((s) => s.startReplay);
  const loadEvents = useActivityStore((s) => s.loadEvents);

  const stopRef = useRef<(() => void) | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [parseInfo, setParseInfo] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => tick(), 200);
    return () => clearInterval(id);
  }, [tick]);

  const onStop = () => {
    stopRef.current?.();
    stopRef.current = null;
    setRunning(false);
  };

  const onRunDemo = () => {
    if (running) return;
    onStop();
    stopRef.current = startDemoFromTranscript();
  };

  const onLoadPaste = () => {
    const result = parseTranscript(pasteText);
    loadEvents(result.events);
    setParseInfo(
      `${result.source}: ${result.events.length} events` +
        (result.warnings.length ? ` · ${result.warnings.length} warnings` : "")
    );
  };

  const onReplayPaste = () => {
    if (running) return;
    onStop();
    const result = parseTranscript(pasteText);
    setParseInfo(`${result.source}: replaying ${result.events.length} events`);
    stopRef.current = startReplay(result.events, 500);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="h-9 shrink-0 flex items-center gap-2 px-3 border-b border-border bg-[#12151c]">
        <span className="text-[11px] text-blue-400 font-medium">Agent Runtime</span>
        <span className="text-gray-600 text-[11px]">|</span>
        <span className="text-[11px] text-gray-500">
          {mode === "replay" ? "replay" : mode === "live" ? "live" : "event stream"}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {running && (
            <span className="flex items-center gap-1 text-[10px] text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              running
            </span>
          )}
          <button
            className="h-6 px-2.5 rounded text-[11px] bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-40"
            onClick={onRunDemo}
            disabled={running}
          >
            Run demo
          </button>
          <button
            className="h-6 px-2 rounded text-[11px] text-gray-400 hover:bg-white/5"
            onClick={() => setPasteOpen((v) => !v)}
          >
            Transcript
          </button>
          <button className="h-6 px-2 rounded text-[11px] text-gray-400 hover:bg-white/5" onClick={onStop}>
            Stop
          </button>
          <button
            className="h-6 px-2 rounded text-[11px] text-gray-500 hover:bg-white/5"
            onClick={() => {
              onStop();
              clear();
              setParseInfo(null);
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {pasteOpen && (
        <div className="border-b border-border bg-[#0f1115] p-2 space-y-2">
          <div className="text-[10px] text-gray-500">
            Paste JSONL (generic or Claude-Code-like). Load into list or Replay with graph lighting.
          </div>
          <textarea
            className="w-full h-24 bg-[#0c0e14] border border-border rounded p-2 font-mono text-[11px] text-gray-200 outline-none focus:border-accent resize-y"
            placeholder='{"kind":"tool","label":"read_file","detail":"src/main.rs"}'
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <div className="flex items-center gap-1.5">
            <button
              className="h-6 px-2 rounded text-[11px] bg-white/5 text-gray-300 hover:bg-white/10"
              onClick={onLoadPaste}
            >
              Load
            </button>
            <button
              className="h-6 px-2 rounded text-[11px] bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-40"
              onClick={onReplayPaste}
              disabled={running || !pasteText.trim()}
            >
              Replay
            </button>
            {parseInfo && <span className="text-[10px] text-gray-500 ml-1">{parseInfo}</span>}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto font-mono text-[12px]">
        {events.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm px-6 text-center">
            No events — Run demo or paste a transcript
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
                className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-sans font-medium ${
                  kindBadge[e.kind]
                }`}
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
