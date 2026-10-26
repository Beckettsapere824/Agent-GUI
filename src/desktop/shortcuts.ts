import { useOSStore } from "../store/osStore";

export const APP_DEFS = [
  { id: "main-graph", title: "Agent Graph", type: "graph" as const, key: "1", x: 24, y: 28, w: 1100, h: 700 },
  { id: "harness", title: "Harness", type: "harness" as const, key: "2", x: 80, y: 56, w: 900, h: 560 },
  { id: "runtime", title: "Runtime", type: "runtime" as const, key: "3", x: 420, y: 72, w: 640, h: 520 },
  { id: "files", title: "Files", type: "files" as const, key: "4", x: 160, y: 100, w: 560, h: 480 },
  { id: "logs", title: "Shell", type: "logs" as const, key: "5", x: 520, y: 120, w: 520, h: 400 },
] as const;

export function openAppById(id: string) {
  const def = APP_DEFS.find((a) => a.id === id);
  if (!def) return;
  const { openWindow, focusWindow, windows, toggleMinimize } = useOSStore.getState();
  const existing = windows.find((w) => w.id === def.id);
  if (!existing) {
    openWindow({
      id: def.id,
      title: def.title,
      type: def.type,
      x: def.x,
      y: def.y,
      width: def.w,
      height: def.h,
    });
  } else if (existing.minimized) {
    toggleMinimize(def.id);
  } else {
    focusWindow(def.id);
  }
}

export const SHORTCUT_HELP: { keys: string; action: string }[] = [
  { keys: "1 – 5", action: "Open / focus Graph, Harness, Runtime, Files, Shell" },
  { keys: "Ctrl/⌘ Z", action: "Undo graph edit" },
  { keys: "Ctrl/⌘ Shift Z", action: "Redo graph edit" },
  { keys: "Ctrl/⌘ S", action: "Save project (local)" },
  { keys: "?", action: "Toggle this help" },
  { keys: "Esc", action: "Close help / clear selection contexts" },
  { keys: "Delete", action: "Remove selected graph node (when graph focused)" },
];
