import { useEffect, useState } from "react";
import { useOSStore } from "../store/osStore";
import { useProjectStore } from "../store/projectStore";
import { Window } from "./Window";
import { Taskbar } from "./Taskbar";
import { StatusBar } from "./StatusBar";
import { HelpOverlay } from "./HelpOverlay";
import { CommandPalette } from "./CommandPalette";
import { useGlobalShortcuts } from "./useGlobalShortcuts";
import { GraphWorkspace } from "../graph/GraphWorkspace";
import { HarnessPanel } from "../harness/HarnessPanel";
import { RuntimePanel } from "../runtime/RuntimePanel";
import { FilesPanel } from "../files/FilesPanel";
import { ShellPanel } from "../runtime/ShellPanel";

export function Desktop() {
  const windows = useOSStore((s) => s.windows);
  const [helpOpen, setHelpOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  useGlobalShortcuts({
    helpOpen,
    setHelpOpen,
    paletteOpen,
    setPaletteOpen,
  });

  // Restore last project (graph + harness + profile/layout) once on mount
  useEffect(() => {
    useProjectStore.getState().loadLocal();
  }, []);

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

      <StatusBar />

      {windows
        .filter((w) => !w.minimized)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((w) => (
          <Window key={w.id} win={w}>
            {w.type === "graph" && <GraphWorkspace />}
            {w.type === "harness" && <HarnessPanel />}
            {w.type === "runtime" && <RuntimePanel />}
            {w.type === "files" && <FilesPanel />}
            {w.type === "logs" && <ShellPanel />}
          </Window>
        ))}

      <Taskbar />
      <HelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
