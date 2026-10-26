import { APP_DEFS, openAppById } from "./shortcuts";
import { useOSStore } from "../store/osStore";

export function Taskbar() {
  const { windows, activeWindowId } = useOSStore();

  return (
    <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#0c0e14]/95 backdrop-blur-md border-t border-border flex items-center px-2 gap-1 z-[9999]">
      <div className="flex items-center gap-2 mr-3 pl-1">
        <div className="w-6 h-6 rounded bg-accent/25 flex items-center justify-center text-accent text-[11px] font-bold tracking-tight">
          A
        </div>
        <span className="text-[11px] text-gray-400 font-medium tracking-wide hidden sm:inline">
          Agent OS
        </span>
      </div>

      <div className="h-5 w-px bg-border mx-1" />

      <div className="flex items-center gap-0.5">
        {APP_DEFS.map((app) => {
          const existing = windows.find((w) => w.id === app.id);
          const isOpen = !!existing;
          const isActive = activeWindowId === app.id && !existing?.minimized;

          return (
            <button
              key={app.id}
              className={`h-8 px-3 rounded text-xs flex items-center gap-1.5 transition-colors ${
                isActive
                  ? "bg-accent/20 text-white"
                  : isOpen
                  ? "bg-white/5 text-gray-300 hover:bg-white/10"
                  : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
              }`}
              title={`${app.title} (${app.key})`}
              onClick={() => openAppById(app.id)}
            >
              <span className="text-[9px] text-gray-600 font-mono hidden md:inline">{app.key}</span>
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

      <div className="ml-auto text-[10px] text-gray-600 pr-2 tracking-wide">
        Agent · Harness · Graph
      </div>
    </div>
  );
}
