import { useOSStore } from "../store/osStore";

export function Taskbar() {
  const { windows, openWindow, focusWindow, toggleMinimize, activeWindowId } = useOSStore();

  const apps = [
    { id: "main-graph", title: "Agent Graph", type: "graph" as const },
    { id: "harness", title: "Harness", type: "harness" as const },
    { id: "runtime", title: "Runtime", type: "runtime" as const },
    { id: "files", title: "Files", type: "files" as const },
    { id: "logs", title: "Logs", type: "logs" as const },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#12151c]/95 backdrop-blur border-t border-border flex items-center px-2 gap-1 z-[9999]">
      <div className="flex items-center gap-1 mr-4">
        <div className="w-7 h-7 rounded bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
          A
        </div>
        <span className="text-xs text-gray-400 font-medium tracking-wide">Agent OS</span>
      </div>

      <div className="flex items-center gap-1">
        {apps.map((app) => {
          const win = windows.find((w) => w.id === app.id);
          const isOpen = !!win;
          const isActive = activeWindowId === app.id && !win?.minimized;

          return (
            <button
              key={app.id}
              className={`h-8 px-3 rounded text-xs flex items-center gap-1.5 transition-colors ${
                isActive
                  ? "bg-accent/25 text-white"
                  : isOpen
                  ? "bg-white/5 text-gray-300 hover:bg-white/10"
                  : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
              }`}
              onClick={() => {
                if (!win) {
                  openWindow({
                    id: app.id,
                    title: app.title,
                    type: app.type,
                    x: 80 + Math.random() * 120,
                    y: 60 + Math.random() * 80,
                    width: 720,
                    height: 480,
                  });
                } else if (win.minimized) {
                  toggleMinimize(app.id);
                } else {
                  focusWindow(app.id);
                }
              }}
            >
              {app.title}
              {isOpen && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? "bg-accent" : "bg-gray-500"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="ml-auto text-[11px] text-gray-500 pr-2">
        Agent-driven · Harness · Graph
      </div>
    </div>
  );
}