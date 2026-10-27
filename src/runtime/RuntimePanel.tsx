import { useEffect, useRef, useState } from "react";
import { useActivityStore } from "../store/activityStore";
import { useSessionStore } from "../store/sessionStore";
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
  const clear = useActivityStore((s) => s.clear);
  const tick = useActivityStore((s) => s.tick);
  const loadEvents = useActivityStore((s) => s.loadEvents);
  const startReplay = useActivityStore((s) => s.startReplay);
  const setRunning = useActivityStore((s) => s.setRunning);

  const startDemo = useSessionStore((s) => s.startDemo);
  const stopActive = useSessionStore((s) => s.stopActive);
  const attachTail = useSessionStore((s) => s.attachTail);
  const attachStdio = useSessionStore((s) => s.attachStdio);
  const sessions = useSessionStore((s) => s.sessions);
  const activeId = useSessionStore((s) => s.activeId);
  const autoMap = useSessionStore((s) => s.autoMap);
  const setAutoMap = useSessionStore((s) => s.setAutoMap);

  const stopRef = useRef<(() => void) | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [parseInfo, setParseInfo] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [tailPath, setTailPath] = useState("sessions/demo.jsonl");
  const [stdioCmd, setStdioCmd] = useState("echo {}");

  useEffect(() => {
    const id = setInterval(() => tick(), 200);
    return () => clearInterval(id);
  }, [tick]);

  const onStop = () => {
    stopRef.current?.();
    stopRef.current = null;
    stopActive();
    setRunning(false);
  };

  const onRunDemo = () => {
    if (running) return;
    onStop();
    startDemo();
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

  const active = sessions.find((s) => s.id === activeId);

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
        <span className="text-[11px] text-gray-500 truncate max-w-[180px]">
          {active
            ? `${active.transport} · ${active.status}`
            : mode === "replay"
            ? "replay"
            : "event stream"}
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
            Attach
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
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span>Import / attach session</span>
            <label className="ml-auto flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={autoMap}
                onChange={(e) => setAutoMap(e.target.checked)}
              />
              auto-map graph
            </label>
          </div>
          <div className="flex flex-wrap gap-1 items-center">
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
          <div className="flex flex-wrap gap-1 items-center">
            <input
              className="h-6 flex-1 min-w-[120px] bg-[#0c0e14] border border-border rounded px-1.5 font-mono text-[10px] text-gray-300 outline-none focus:border-accent"
              value={tailPath}
              onChange={(e) => setTailPath(e.target.value)}
              placeholder="jsonl path"
            />
            <button
              className="h-6 px-2 rounded text-[10px] bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-40"
              disabled={running}
              onClick={() => void attachTail(tailPath)}
            >
              Tail file
            </button>
          </div>
          <div className="flex flex-wrap gap-1 items-center">
            <input
              className="h-6 flex-1 min-w-[120px] bg-[#0c0e14] border border-border rounded px-1.5 font-mono text-[10px] text-gray-300 outline-none focus:border-accent"
              value={stdioCmd}
              onChange={(e) => setStdioCmd(e.target.value)}
              placeholder="allowlisted command (stdout JSONL)"
            />
            <button
              className="h-6 px-2 rounded text-[10px] bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 disabled:opacity-40"
              disabled={running || !stdioCmd.trim()}
              onClick={() => void attachStdio(stdioCmd.trim())}
            >
              Stdio
            </button>
          </div>
          <textarea
            className="w-full h-20 bg-[#0c0e14] border border-border rounded p-2 font-mono text-[11px] text-gray-200 outline-none focus:border-accent resize-y"
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
            {active?.error && (
              <span className="text-[10px] text-red-400 ml-1 truncate max-w-[40%]">{active.error}</span>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto font-mono text-[12px]">
        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 text-sm px-6 text-center gap-2">
            <div>No events — Run demo, Attach, Tail, Stdio, or drop .jsonl</div>
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
