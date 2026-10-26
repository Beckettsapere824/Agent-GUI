import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export type WindowId = string;

export interface WindowState {
  id: WindowId;
  title: string;
  type: "graph" | "harness" | "runtime" | "files" | "logs";
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
}

interface OSState {
  windows: WindowState[];
  activeWindowId: WindowId | null;
  nextZIndex: number;
  openWindow: (partial: Omit<WindowState, "zIndex" | "minimized" | "maximized">) => void;
  closeWindow: (id: WindowId) => void;
  focusWindow: (id: WindowId) => void;
  moveWindow: (id: WindowId, x: number, y: number) => void;
  resizeWindow: (id: WindowId, width: number, height: number) => void;
  toggleMinimize: (id: WindowId) => void;
  toggleMaximize: (id: WindowId) => void;
}

export const useOSStore = create<OSState>()(
  immer((set) => ({
    windows: [
      {
        id: "main-graph",
        title: "Agent Graph",
        type: "graph",
        x: 24,
        y: 24,
        width: 1100,
        height: 700,
        minimized: false,
        maximized: false,
        zIndex: 10,
      },
    ],
    activeWindowId: "main-graph",
    nextZIndex: 11,

    openWindow: (partial) =>
      set((state) => {
        const id = partial.id;
        const exists = state.windows.find((w) => w.id === id);
        if (exists) {
          exists.minimized = false;
          exists.zIndex = state.nextZIndex++;
          state.activeWindowId = id;
          return;
        }
        state.windows.push({
          ...partial,
          minimized: false,
          maximized: false,
          zIndex: state.nextZIndex++,
        });
        state.activeWindowId = id;
      }),

    closeWindow: (id) =>
      set((state) => {
        state.windows = state.windows.filter((w) => w.id !== id);
        if (state.activeWindowId === id) {
          const remaining = state.windows;
          state.activeWindowId = remaining.length
            ? remaining.reduce((a, b) => (a.zIndex > b.zIndex ? a : b)).id
            : null;
        }
      }),

    focusWindow: (id) =>
      set((state) => {
        const win = state.windows.find((w) => w.id === id);
        if (!win) return;
        win.zIndex = state.nextZIndex++;
        win.minimized = false;
        state.activeWindowId = id;
      }),

    moveWindow: (id, x, y) =>
      set((state) => {
        const win = state.windows.find((w) => w.id === id);
        if (win && !win.maximized) {
          win.x = Math.max(-win.width + 80, x);
          win.y = Math.max(0, y);
        }
      }),

    resizeWindow: (id, width, height) =>
      set((state) => {
        const win = state.windows.find((w) => w.id === id);
        if (win && !win.maximized) {
          win.width = Math.max(360, width);
          win.height = Math.max(240, height);
        }
      }),

    toggleMinimize: (id) =>
      set((state) => {
        const win = state.windows.find((w) => w.id === id);
        if (win) {
          win.minimized = !win.minimized;
          if (!win.minimized) {
            win.zIndex = state.nextZIndex++;
            state.activeWindowId = id;
          } else if (state.activeWindowId === id) {
            const visible = state.windows.filter((w) => !w.minimized && w.id !== id);
            state.activeWindowId = visible.length
              ? visible.reduce((a, b) => (a.zIndex > b.zIndex ? a : b)).id
              : null;
          }
        }
      }),

    toggleMaximize: (id) =>
      set((state) => {
        const win = state.windows.find((w) => w.id === id);
        if (win) {
          win.maximized = !win.maximized;
          win.zIndex = state.nextZIndex++;
          state.activeWindowId = id;
        }
      }),
  }))
);