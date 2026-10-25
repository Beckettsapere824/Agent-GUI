import { useOSStore } from "../store/osStore";
import { Window } from "./Window";
import { Taskbar } from "./Taskbar";
import { GraphWorkspace } from "../graph/GraphWorkspace";

export function Desktop() {
  const windows = useOSStore((s) => s.windows);

  return (
    <div className="relative w-full h-full bg-desktop overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {windows
        .filter((w) => !w.minimized)
        .map((win) => (
          <Window key={win.id} window={win}>
            {win.type === "graph" && <GraphWorkspace />}
            {win.type !== "graph" && (
              <div className="flex items-center justify-center h-full text-muted text-sm">
                {win.title} panel (coming next)
              </div>
            )}
          </Window>
        ))}

      <Taskbar />
    </div>
  );
}