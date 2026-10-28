import { useEffect, useMemo, useRef, useState } from "react";
import { ATTACH_PRESETS, type AttachPreset } from "../domain/attachPresets";
import { applyProfile } from "../domain/profiles";
import { useActivityStore } from "../store/activityStore";
import { useSessionStore } from "../store/sessionStore";
import { hintProfileFromEvents, type ProfileHint } from "./profileHints";
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

async function runAttachPreset(
  preset: AttachPreset,
  api: {
    startDemo: () => void;
    attachTail: (path: string) => Promise<void>;
    attachStdio: (command: string, cwd?: string) => Promise<void>;
  }
) {
  if (preset.kind === "demo") {
    api.startDemo();
    return;
  }
  if (preset.kind === "tail" && preset.path) {
    await api.attachTail(preset.path);
    return;
  }
  if (preset.kind === "stdio" && preset.command) {
    await api.attachStdio(preset.command, preset.cwd);
  }
}

export function RuntimePanel() {
  const allEvents = useActivityStore((s) => s.events);
  const filterSessionId = useActivityStore((s) => s.filterSessionId);
  const setFilterSessionId = useActivityStore((s) => s.setFilterSessionId);
  const events =
    filterSessionId == null
      ? allEvents
      : allEvents.filter((e) => !e.sessionId || e.sessionId === filterSessionId);
  const running = useActivityStore((s) => s.running);
  const mode = useActivityStore((s) => s.mode);
  const clear = useActivityStore((s) => s.clear);
  const tick = useActivityStore((s) => s.tick);
  const loadEvents = useActivityStore((s) => s.loadEvents);
  const startReplay = useActivityStore((s) => s.startReplay);
  const setRunning = useActivityStore((s) => s.setRunning);

  const startDemo = useSessionStore((s) => s.startDemo);
  const stopActive = useSessionStore((s) => s.stopActive);
  const stopSession = useSessionStore((s) => s.stopSession);
  const detachAll = useSessionStore((s) => s.detachAll);
  const attachTail = useSessionStore((s) => s.attachTail);
  const attachStdio = useSessionStore((s) => s.attachStdio);
  const sessions = useSessionStore((s) => s.sessions);
  const activeId = useSessionStore((s) => s.activeId);
  const setActive = useSessionStore((s) => s.setActive);
  const autoMap = useSessionStore((s) => s.autoMap);
  const setAutoMap = useSessionStore((s) => s.setAutoMap);
  const exclusive = useSessionStore((s) => s.exclusive);
  const setExclusive = useSessionStore((s) => s.setExclusive);
  const refresh = useSessionStore((s) => s.refresh);

  const stopRef = useRef<(() => void) | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [tailPath, setTailPath] = useState("sessions/demo.jsonl");
  const [stdioCmd, setStdioCmd] = useState("cargo check");
  const [attachError, setAttachError] = useState<string | null>(null);
  const [hintDismissed, setHintDismissed] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => tick(), 400);
    return () => clearInterval(id);
  }, [running, tick]);

  const profileHint: ProfileHint | null = useMemo(() => {
    if (hintDismissed || events.length < 3) return null;
    return hintProfileFromEvents(events);
  }, [events, hintDismissed]);

  useEffect(() => {
    setHintDismissed(false);
  }, [filterSessionId, activeId]);

  const ingestText = (text: string, autoPlay: boolean) => {
    const result = parseTranscript(text);
    loadEvents(
      result.events.map((e) => ({
        ...e,
        id: `import-${Math.random().toString(36).slice(2, 9)}`,
        ts: e.ts ?? Date.now(),
      }))
    );
    if (autoPlay && result.events.length) {
      stopRef.current?.();
      stopRef.current = startReplay(result.events, 280);
      setRunning(true);
    }
  };

  const onFile = async (file: File) => {
    const text = await file.text();
    setPasteText(text);
    setPasteOpen(true);
    ingestText(text, true);
  };

  const onPreset = async (preset: AttachPreset) => {
    setAttachError(null);
    try {
      await runAttachPreset(preset, { startDemo, attachTail, attachStdio });
      if (preset.path) setTailPath(preset.path);
      if (preset.command) setStdioCmd(preset.command);
    } catch (e) {
      setAttachError(String(e));
    }
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
            className="h-6 px-2 rounded text-[10px] bg-accent/20 text-accent hover:bg-accent/30"
            onClick={() => startDemo()}
            disabled={running}
          >
            Run demo
          </button>
          <button
            className="h-6 px-2 rounded text-[10px] text-gray-300 hover:bg-white/5 border border-border"
            onClick={() => setPasteOpen((v) => !v)}
          >
            Attach
          </button>
          <button
            className="h-6 px-2 rounded text-[10px] text-gray-400 hover:bg-white/5"
            onClick={() => {
              stopRef.current?.();
              stopRef.current = null;
              stopActive();
              setRunning(false);
            }}
          >
            Stop
          </button>
          <button
            className="h-6 px-2 rounded text-[10px] text-gray-400 hover:bg-white/5"
            onClick={() => {
              stopRef.current?.();
              stopRef.current = null;
              clear();
              detachAll();
            }}
          >
            Clear
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".jsonl,.json,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
        </div>
      </div>

      {sessions.length > 0 && (
        <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 border-b border-border overflow-x-auto">
          <button
            type="button"
            className={`h-6 px-2 rounded text-[10px] border ${
              filterSessionId == null
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border text-gray-500"
            }`}
            onClick={() => setFilterSessionId(null)}
          >
            all
          </button>
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setActive(s.id);
                setFilterSessionId(s.id);
              }}
              className={`group flex items-center gap-1.5 h-6 pl-2 pr-1 rounded text-[10px] border ${
                s.id === filterSessionId || (filterSessionId == null && s.id === activeId)
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border text-gray-400 hover:bg-white/5"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  s.status === "running" || s.status === "starting"
                    ? "bg-green-400 animate-pulse"
                    : s.status === "error"
                    ? "bg-red-400"
                    : "bg-gray-600"
                }`}
              />
              <span className="truncate max-w-[100px]">{s.label || s.transport}</span>
              <span className="text-gray-600">{s.transport}</span>
              <span
                role="button"
                className="opacity-60 hover:opacity-100 hover:text-red-400 px-1"
                onClick={(e) => {
                  e.stopPropagation();
                  stopSession(s.id);
                }}
              >
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      {profileHint && (
        <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 border-b border-border bg-violet-500/5 text-[11px]">
          <span className="text-violet-300">Profile hint</span>
          <span className="text-gray-400">
            → <span className="text-violet-200 font-medium">{profileHint.profileName}</span>
            <span className="text-gray-600"> ({profileHint.confidence})</span>
            {profileHint.reasons[0] ? (
              <span className="text-gray-600"> · {profileHint.reasons[0]}</span>
            ) : null}
          </span>
          <button
            type="button"
            className="h-6 px-2 rounded border border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
            onClick={() => applyProfile(profileHint.profileId)}
          >
            Apply
          </button>
          <button
            type="button"
            className="ml-auto text-gray-600 hover:text-gray-400"
            onClick={() => setHintDismissed(true)}
          >
            dismiss
          </button>
        </div>
      )}

      {pasteOpen && (
        <div className="border-b border-border bg-[#0f1115] p-2 space-y-2">
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500">
            <span>Import / attach session</span>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={autoMap} onChange={(e) => setAutoMap(e.target.checked)} />
              auto-map
            </label>
            <label
              className="flex items-center gap-1 cursor-pointer"
              title="Stop previous session when starting a new one"
            >
              <input
                type="checkbox"
                checked={exclusive}
                onChange={(e) => setExclusive(e.target.checked)}
              />
              exclusive
            </label>
          </div>

          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] text-gray-600 self-center mr-1">Presets</span>
            {ATTACH_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                title={p.description}
                className="h-6 px-2 rounded text-[10px] border border-border text-gray-300 hover:bg-white/5 hover:border-accent/40"
                onClick={() => void onPreset(p)}
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1 items-center">
            <button
              className="h-6 px-2 rounded text-[10px] bg-white/5 text-gray-300 hover:bg-white/10"
              onClick={() => {
                setPasteText(SAMPLE_CLAUDE_CODE);
                ingestText(SAMPLE_CLAUDE_CODE, true);
              }}
            >
              Sample Claude
            </button>
            <button
              className="h-6 px-2 rounded text-[10px] bg-white/5 text-gray-300 hover:bg-white/10"
              onClick={() => {
                setPasteText(SAMPLE_GENERIC);
                ingestText(SAMPLE_GENERIC, true);
              }}
            >
              Sample generic
            </button>
            <button
              className="h-6 px-2 rounded text-[10px] bg-white/5 text-gray-300 hover:bg-white/10"
              onClick={() => fileRef.current?.click()}
            >
              Open file…
            </button>
          </div>

          <div className="flex gap-1 items-center">
            <input
              className="flex-1 h-7 bg-[#0c0e14] border border-border rounded px-2 text-[11px] text-gray-300 outline-none"
              value={tailPath}
              onChange={(e) => setTailPath(e.target.value)}
              placeholder="path to .jsonl"
            />
            <button
              className="h-7 px-2 rounded text-[10px] bg-white/5 text-gray-300"
              onClick={() => void attachTail(tailPath).catch((e) => setAttachError(String(e)))}
            >
              Tail file
            </button>
          </div>
          <div className="flex gap-1 items-center">
            <input
              className="flex-1 h-7 bg-[#0c0e14] border border-border rounded px-2 text-[11px] text-gray-300 outline-none font-mono"
              value={stdioCmd}
              onChange={(e) => setStdioCmd(e.target.value)}
              placeholder="command"
            />
            <button
              className="h-7 px-2 rounded text-[10px] bg-white/5 text-gray-300"
              onClick={() =>
                void attachStdio(stdioCmd.trim()).catch((e) => setAttachError(String(e)))
              }
            >
              Stdio
            </button>
          </div>
          <textarea
            className="w-full h-24 bg-[#0c0e14] border border-border rounded p-2 text-[11px] text-gray-300 font-mono outline-none"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste JSONL transcript…"
          />
          <div className="flex gap-1">
            <button
              className="h-6 px-2 rounded text-[10px] bg-white/5 text-gray-300"
              onClick={() => ingestText(pasteText, false)}
              disabled={!pasteText.trim()}
            >
              Load
            </button>
            <button
              className="h-6 px-2 rounded text-[10px] bg-accent/20 text-accent"
              onClick={() => ingestText(pasteText, true)}
              disabled={running || !pasteText.trim()}
            >
              Replay
            </button>
          </div>
          {attachError && <div className="text-[10px] text-red-400">{attachError}</div>}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-6 text-center text-gray-600 text-xs space-y-1">
            <div>No events — Run demo, Attach, Tail, Stdio, or drop .jsonl</div>
            <div className="text-[10px]">Sessions light matching graph nodes</div>
          </div>
        ) : (
          <ul className="divide-y divide-border/40">
            {events.map((e) => (
              <li key={e.id} className="px-3 py-1.5 flex gap-2 items-start text-[11px]">
                <span
                  className={`shrink-0 mt-0.5 text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded ${kindBadge[e.kind] ?? "bg-white/5 text-gray-500"}`}
                >
                  {e.kind}
                </span>
                <div className="min-w-0 flex-1">
                  <div className={`${kindColor[e.kind] ?? "text-gray-300"} truncate`}>{e.label}</div>
                  {e.detail && (
                    <div className="text-gray-600 truncate font-mono text-[10px]">{e.detail}</div>
                  )}
                </div>
                {e.nodeId && (
                  <span className="text-[9px] text-gray-600 font-mono shrink-0">{e.nodeId}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
