import { useMemo, useState } from "react";
import { useGraphStore } from "../store/graphStore";
import { useProjectStore } from "../store/projectStore";

const VIRTUAL_TREE: { path: string; kind: "dir" | "file" }[] = [
  { path: "src/", kind: "dir" },
  { path: "src/main.rs", kind: "file" },
  { path: "src/lib.rs", kind: "file" },
  { path: "src/domain/", kind: "dir" },
  { path: "src/domain/types.ts", kind: "file" },
  { path: "Cargo.toml", kind: "file" },
  { path: "README.md", kind: "file" },
  { path: "HARNESS.md", kind: "file" },
  { path: "skills/", kind: "dir" },
  { path: "skills/harness-sdd/SKILL.md", kind: "file" },
  { path: "skills/code-review/SKILL.md", kind: "file" },
];

export function FilesPanel() {
  const [filter, setFilter] = useState("");
  const addNode = useGraphStore((s) => s.addNode);
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const graph = useGraphStore((s) => s.graph);
  const graphFiles = graph.nodes
    .filter((n) => n.kind === "file")
    .map((n) => n.data.path ?? n.data.label);

  const name = useProjectStore((s) => s.name);
  const setName = useProjectStore((s) => s.setName);
  const saveLocal = useProjectStore((s) => s.saveLocal);
  const loadLocal = useProjectStore((s) => s.loadLocal);
  const lastSavedAt = useProjectStore((s) => s.lastSavedAt);
  const exportJson = useProjectStore((s) => s.exportJson);

  const items = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return VIRTUAL_TREE.filter((t) => !q || t.path.toLowerCase().includes(q));
  }, [filter]);

  const addFileToGraph = (path: string) => {
    if (graphFiles.includes(path)) return;
    const id = addNode("file", 100 + Math.random() * 80, 360 + Math.random() * 40);
    updateNodeData(id, { label: path, path });
  };

  const onExport = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "project"}.agent-os.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full flex flex-col text-xs">
      <div className="h-8 shrink-0 flex items-center gap-2 px-3 border-b border-border bg-[#12151c]">
        <span className="text-amber-400/90 font-medium text-[11px]">Files</span>
        <span className="text-gray-600">|</span>
        <input
          className="bg-transparent border-none outline-none text-gray-300 text-[11px] flex-1 min-w-0"
          value={name}
          onChange={(e) => setName(e.target.value)}
          title="Project name"
        />
      </div>

      <div className="px-2 py-1.5 border-b border-border flex flex-wrap gap-1">
        <button
          className="h-6 px-2 rounded bg-white/5 text-gray-300 hover:bg-white/10"
          onClick={() => saveLocal()}
        >
          Save
        </button>
        <button
          className="h-6 px-2 rounded bg-white/5 text-gray-300 hover:bg-white/10"
          onClick={() => loadLocal()}
        >
          Load
        </button>
        <button
          className="h-6 px-2 rounded bg-white/5 text-gray-300 hover:bg-white/10"
          onClick={onExport}
        >
          Export JSON
        </button>
        {lastSavedAt && (
          <span className="text-[10px] text-gray-600 self-center ml-auto">
            saved {new Date(lastSavedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="px-2 py-1.5 border-b border-border">
        <input
          className="w-full bg-[#0f1115] border border-border rounded px-2 py-1 text-gray-200 outline-none focus:border-accent"
          placeholder="Filter paths…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <ul className="flex-1 overflow-y-auto font-mono">
        {items.map((item) => {
          const onGraph = graphFiles.includes(item.path);
          return (
            <li
              key={item.path}
              className="px-3 py-1 flex items-center gap-2 hover:bg-white/[0.03] border-b border-border/40"
            >
              <span className={item.kind === "dir" ? "text-sky-500" : "text-gray-500"}>
                {item.kind === "dir" ? "DIR" : "FILE"}
              </span>
              <span className="text-gray-300 truncate flex-1">{item.path}</span>
              {item.kind === "file" && (
                <button
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    onGraph
                      ? "text-amber-400/80 bg-amber-500/10"
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
                  disabled={onGraph}
                  onClick={() => addFileToGraph(item.path)}
                  title={onGraph ? "Already on graph" : "Add FILE node to graph"}
                >
                  {onGraph ? "on graph" : "+ graph"}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="px-3 py-2 border-t border-border text-[10px] text-gray-600">
        Virtual tree for demo. Host FS comes with Tauri platform layer.
      </div>
    </div>
  );
}
