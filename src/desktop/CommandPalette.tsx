import { useEffect, useMemo, useRef, useState } from "react";
import { AGENT_PROFILES, applyProfile } from "../domain/profiles";
import { useSessionStore } from "../store/sessionStore";
import { APP_DEFS, openAppById } from "./shortcuts";

export type PaletteAction = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  run: () => void;
};

interface Props {
  open: boolean;
  onClose: () => void;
}

function buildActions(onClose: () => void): PaletteAction[] {
  const actions: PaletteAction[] = [];

  for (const a of APP_DEFS) {
    actions.push({
      id: `app-${a.id}`,
      group: "Windows",
      label: `Open ${a.title}`,
      hint: a.key,
      run: () => {
        openAppById(a.id);
        onClose();
      },
    });
  }

  for (const p of AGENT_PROFILES) {
    actions.push({
      id: `profile-${p.id}`,
      group: "Profiles",
      label: `Profile: ${p.name}`,
      hint: p.description,
      run: () => {
        applyProfile(p.id);
        openAppById("main-graph");
        onClose();
      },
    });
  }

  actions.push({
    id: "runtime-demo",
    group: "Runtime",
    label: "Run session demo",
    run: () => {
      openAppById("runtime");
      useSessionStore.getState().startDemo();
      onClose();
    },
  });
  actions.push({
    id: "runtime-stop",
    group: "Runtime",
    label: "Stop active session",
    run: () => {
      useSessionStore.getState().stopActive();
      onClose();
    },
  });

  return actions;
}

export function CommandPalette({ open, onClose }: Props) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const actions = useMemo(() => buildActions(onClose), [onClose]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return actions;
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(s) ||
        a.group.toLowerCase().includes(s) ||
        (a.hint && a.hint.toLowerCase().includes(s))
    );
  }, [actions, q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setIdx(0);
  }, [q]);

  if (!open) return null;

  const runIdx = (i: number) => {
    const a = filtered[i];
    if (a) a.run();
  };

  return (
    <div
      className="absolute inset-0 z-[10001] flex items-start justify-center pt-[12vh] bg-black/45 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[min(520px,94vw)] rounded-xl border border-border bg-[#12151c] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 border-b border-border">
          <span className="text-gray-600 text-xs">⌘K</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setIdx((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIdx((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                runIdx(idx);
              }
            }}
            placeholder="Profiles, windows, runtime…"
            className="flex-1 h-11 bg-transparent text-sm text-gray-100 outline-none placeholder:text-gray-600"
          />
        </div>
        <ul className="max-h-[min(360px,50vh)] overflow-y-auto py-1">
          {filtered.length === 0 && (
            <li className="px-4 py-3 text-xs text-gray-600">No matches</li>
          )}
          {filtered.map((a, i) => (
            <li key={a.id}>
              <button
                type="button"
                className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm ${
                  i === idx ? "bg-accent/15 text-accent" : "text-gray-300 hover:bg-white/5"
                }`}
                onMouseEnter={() => setIdx(i)}
                onClick={() => a.run()}
              >
                <span className="text-[10px] uppercase tracking-wide text-gray-600 w-16 shrink-0">
                  {a.group}
                </span>
                <span className="flex-1 truncate">{a.label}</span>
                {a.hint && (
                  <span className="text-[10px] text-gray-600 truncate max-w-[40%]">{a.hint}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <div className="px-3 py-1.5 border-t border-border text-[10px] text-gray-600 flex gap-3">
          <span>↑↓ navigate</span>
          <span>↵ run</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
