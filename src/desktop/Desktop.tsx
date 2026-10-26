import { useOSStore } from "../store/osStore";
import { Window } from "./Window";
import { Taskbar } from "./Taskbar";
import { GraphWorkspace } from "../graph/GraphWorkspace";
import { HarnessPanel } from "../harness/HarnessPanel";
import { RuntimePanel } from "../runtime/RuntimePanel";
import { FilesPanel } from "../files/FilesPanel";

export function Desktop() {
  const windows = useOSStore((s) => s.windows);

  return (
    <div className="relative w-full h-full bg-desktop overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {windows
        .filter((w) => !w.minimized)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((w) => (
          <Window key={w.id} win={w}>
            {w.type === "graph" && <GraphWorkspace />}
            {w.type === "harness" && <HarnessPanel />}
            {w.type === "runtime" && <RuntimePanel />}
            {w.type === "files" && <FilesPanel />}
            {w.type === "logs" && (
              <div className="flex flex-col items-center justify-center h-full text-muted text-sm gap-2">
                <div className="text-gray-500 text-xs uppercase tracking-widest">logs</div>
                <div className="text-gray-600 text-xs">merged into Runtime stream for now</div>
              </div>
            )}
          </Window>
        ))}

      <Taskbar />
    </div>
  );
}
