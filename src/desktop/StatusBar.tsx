import { useEffect, useState } from "react";
import { getPlatform, isTauriRuntime } from "../platform";
import { useActivityStore } from "../store/activityStore";
import { useProjectStore } from "../store/projectStore";
import { useGraphStore } from "../store/graphStore";

export function StatusBar() {
  const [host, setHost] = useState(isTauriRuntime() ? "tauri" : "web");
  const running = useActivityStore((s) => s.running);
  const mode = useActivityStore((s) => s.mode);
  const name = useProjectStore((s) => s.name);
  const nodes = useGraphStore((s) => s.graph.nodes.length);
  const edges = useGraphStore((s) => s.graph.edges.length);

  useEffect(() => {
    void getPlatform().then((p) => setHost(p.kind));
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 h-6 z-[9998] pointer-events-none flex items-center px-3 text-[10px] text-gray-500 bg-gradient-to-b from-black/40 to-transparent">
      <span className="text-gray-400">{name}</span>
      <span className="mx-2 text-gray-700">·</span>
      <span>
        {nodes}n / {edges}e
      </span>
      <span className="mx-2 text-gray-700">·</span>
      <span className="uppercase tracking-wide">{host}</span>
      {running && (
        <>
          <span className="mx-2 text-gray-700">·</span>
          <span className="text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {mode === "replay" ? "replay" : "live"}
          </span>
        </>
      )}
      <span className="ml-auto text-gray-600">? help</span>
    </div>
  );
}
