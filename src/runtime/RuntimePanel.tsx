import { useEffect, useRef, useState } from "react";
import { useActivityStore } from "../store/activityStore";
import { parseTranscript } from "./transcript";
import { SAMPLE_CLAUDE_CODE, SAMPLE_GENERIC } from "./samples";

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
  const fileRef = useRef<HTMLInputElement>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [parseInfo, setParseInfo] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

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

  const ingestText = (text: string, replay: boolean) => {
    const result = parseTranscript(text);
    setParseInfo(
      `${result.source}: ${result.events.length} events` +
        (result.warnings.length ? ` · ${result.warnings.length} warnings` : "")
    );
    if (replay) {
      if (running) return;
      onStop();
      stopRef.current = startReplay(result.events, 500);
    } else {
      loadEvents(result.events);
    }
  };

  const onFile = async (file: File) => {
    const text = await file.text();
    setPasteText(text);
    setPasteOpen(true);
    ingestText(text, true);
  };

  return (
    <div
      className={`w-full h-full flex flex-col ${
        dragOver ? "ring-2 ring-accent/50 ring-inset" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) void onFile(f);
      }}
    >
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
            Import
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
            Paste JSONL, drop a file, or load a preset. Replay lights the Agent Graph.
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              className="h-6 px-2 rounded text-[10px] bg-white/5 text-gray-300 hover:bg-white/10"
              onClick={() => {
                setPasteText(SAMPLE_GENERIC);
                ingestText(SAMPLE_GENERIC, false);
              }}
            >
              Sample generic
            </button>
            <button
              className="h-6 px-2 rounded text-[10px] bg-white/5 text-gray-300 hover:bg-white/10"
              onClick={() => {
                setPasteText(SAMPLE_CLAUDE_CODE);
                ingestText(SAMPLE_CLAUDE_CODE, false);
              }}
            >
              Sample Claude-code
            </button>
            <button
              className="h-6 px-2 rounded text-[10px] bg-white/5 text-gray-300 hover:bg-white/10"
              onClick={() => fileRef.current?.click()}
            >
              Open file…
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".jsonl,.json,.txt,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
                e.target.value = "";
              }}
            />
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
              onClick={() => ingestText(pasteText, false)}
            >
              Load
            </button>
            <button
              className="h-6 px-2 rounded text-[11px] bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-40"
              onClick={() => ingestText(pasteText, true)}
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
          <div className="flex flex-col items-center justify-center h-full text-gray-600 text-sm px-6 text-center gap-2">
            <div>No events — Run demo, Import, or drop a .jsonl file</div>
            <div className="text-[11px] text-gray-700">Sessions light matching graph nodes</div>
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
