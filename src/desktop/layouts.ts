import { useOSStore, type WindowState } from "../store/osStore";
import { useWorkspaceStore } from "../store/workspaceStore";

export type LayoutWindowSpec = {
  id: string;
  title: string;
  type: WindowState["type"];
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LayoutPreset = {
  id: string;
  name: string;
  description: string;
  windows: LayoutWindowSpec[];
};

/** Relative to a ~1440×900 content area; clamped by applyLayout. */
export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: "focus-graph",
    name: "Focus Graph",
    description: "Graph only, maximized workspace",
    windows: [
      {
        id: "main-graph",
        title: "Agent Graph",
        type: "graph",
        x: 16,
        y: 28,
        width: 1400,
        height: 780,
      },
    ],
  },
  {
    id: "coding",
    name: "Coding",
    description: "Graph + Runtime + Files",
    windows: [
      {
        id: "main-graph",
        title: "Agent Graph",
        type: "graph",
        x: 12,
        y: 28,
        width: 920,
        height: 720,
      },
      {
        id: "runtime",
        title: "Runtime",
        type: "runtime",
        x: 940,
        y: 28,
        width: 480,
        height: 360,
      },
      {
        id: "files",
        title: "Files",
        type: "files",
        x: 940,
        y: 400,
        width: 480,
        height: 360,
      },
    ],
  },
  {
    id: "harness-design",
    name: "Harness design",
    description: "Graph + Harness side by side",
    windows: [
      {
        id: "main-graph",
        title: "Agent Graph",
        type: "graph",
        x: 12,
        y: 28,
        width: 720,
        height: 760,
      },
      {
        id: "harness",
        title: "Harness",
        type: "harness",
        x: 740,
        y: 28,
        width: 680,
        height: 760,
      },
    ],
  },
  {
    id: "debug",
    name: "Debug",
    description: "Graph + Runtime + Shell",
    windows: [
      {
        id: "main-graph",
        title: "Agent Graph",
        type: "graph",
        x: 12,
        y: 28,
        width: 880,
        height: 520,
      },
      {
        id: "runtime",
        title: "Runtime",
        type: "runtime",
        x: 900,
        y: 28,
        width: 520,
        height: 400,
      },
      {
        id: "logs",
        title: "Shell",
        type: "logs",
        x: 900,
        y: 440,
        width: 520,
        height: 340,
      },
      {
        id: "files",
        title: "Files",
        type: "files",
        x: 12,
        y: 560,
        width: 880,
        height: 220,
      },
    ],
  },
];

export function getLayout(id: string): LayoutPreset | undefined {
  return LAYOUT_PRESETS.find((l) => l.id === id);
}

/** Open/position preset windows; minimize anything not in the preset. */
export function applyLayout(id: string): boolean {
  const preset = getLayout(id);
  if (!preset) return false;

  const os = useOSStore.getState();
  const keep = new Set(preset.windows.map((w) => w.id));

  for (const spec of preset.windows) {
    const existing = os.windows.find((w) => w.id === spec.id);
    if (!existing) {
      os.openWindow({
        id: spec.id,
        title: spec.title,
        type: spec.type,
        x: spec.x,
        y: spec.y,
        width: spec.width,
        height: spec.height,
      });
    }
    // re-read after possible open
    useOSStore.getState().placeWindow(spec.id, {
      x: spec.x,
      y: spec.y,
      width: spec.width,
      height: spec.height,
      minimized: false,
      maximized: false,
    });
  }

  for (const w of useOSStore.getState().windows) {
    if (!keep.has(w.id) && !w.minimized) {
      useOSStore.getState().toggleMinimize(w.id);
    }
  }

  // focus primary (first) window
  const primary = preset.windows[0];
  if (primary) useOSStore.getState().focusWindow(primary.id);

  useWorkspaceStore.getState().setLayout(id);
  return true;
}
