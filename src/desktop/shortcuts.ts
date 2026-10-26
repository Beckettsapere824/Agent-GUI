import { useOSStore } from "../store/osStore";

export const APP_DEFS = [
  { id: "main-graph", title: "Agent Graph", type: "graph" as const, key: "1" },
  { id: "harness", title: "Harness", type: "harness" as const, key: "2" },
  { id: "runtime", title: "Runtime", type: "runtime" as const, key: "3" },
  { id: "files", title: "Files", type: "files" as const, key: "4" },
  { id: "logs", title: "Shell", type: "logs" as const, key: "5" },
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
      x: 48 + Math.random() * 80,
      y: 36 + Math.random() * 48,
      width: def.type === "graph" ? 1000 : 720,
      height: def.type === "graph" ? 640 : 480,
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
