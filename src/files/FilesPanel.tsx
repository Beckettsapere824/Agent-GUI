import { useEffect, useMemo, useState } from "react";
import { useGraphStore } from "../store/graphStore";
import { useProjectStore } from "../store/projectStore";
import { useWorkspaceStore } from "../store/workspaceStore";
import { getPlatform, isTauriRuntime } from "../platform";

export function FilesPanel() {
  const [filter, setFilter] = useState("");
  const [preview, setPreview] = useState<{ path: string; text: string } | null>(null);

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

  const { root, host, entries, loading, error, init, setRoot, refresh, readFile } =
    useWorkspaceStore();

  useEffect(() => {
    void init();
  }, [init]);

  const items = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return entries.filter((t) => !q || t.path.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
  }, [entries, filter]);

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

  const onOpen = async (path: string, kind: "file" | "dir") => {
    if (kind === "dir") {
      await setRoot(path);
      setPreview(null);
      return;
    }
    try {
      const text = await readFile(path);
      setPreview({ path, text });
    } catch (e) {
      setPreview({ path, text: String(e) });
    }
  };

  const onUp = async () => {
    if (!root || root === "." || root === "/") return;
    const cleaned = root.replace(/\/+$/, "");
    const i = cleaned.lastIndexOf("/");
    const parent = i <= 0 ? (host?.kind === "web" ? "" : ".") : cleaned.slice(0, i);
    await setRoot(parent || ".");
  };

  const onSaveProject = async () => {
    const ok = saveLocal();
    try {
      const p = await getPlatform();
      await p.saveProjectBlob("project-v1", exportJson());
    } catch {
      /* localStorage path still used */
    }
    return ok;
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
        <span className="text-[10px] text-gray-600 shrink-0">
          {isTauriRuntime() ? "tauri" : "web"}
        </span>
      </div>

      <div className="px-2 py-1.5 border-b border-border flex flex-wrap gap-1 items-center">
        <button
          className="h-6 px-2 rounded bg-white/5 text-gray-300 hover:bg-white/10"
          onClick={() => void onSaveProject()}
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
        <button
          className="h-6 px-2 rounded bg-white/5 text-gray-300 hover:bg-white/10"
          onClick={() => void refresh()}
        >
          Refresh
        </button>
        {lastSavedAt && (
          <span className="text-[10px] text-gray-600 ml-auto">
            saved {new Date(lastSavedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="px-2 py-1 border-b border-border flex items-center gap-2 text-[11px]">
        <button className="text-gray-500 hover:text-gray-300" onClick={() => void onUp()} title="Up">
          ↑
        </button>
        <span className="font-mono text-gray-500 truncate" title={root}>
          {root || "/"}
        </span>
        {loading && <span className="text-gray-600 ml-auto">loading…</span>}
        {error && <span className="text-red-400 ml-auto truncate max-w-[40%]">{error}</span>}
      </div>

      <div className="px-2 py-1.5 border-b border-border">
        <input
          className="w-full bg-[#0f1115] border border-border rounded px-2 py-1 text-gray-200 outline-none focus:border-accent"
          placeholder="Filter…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="flex-1 min-h-0 flex">
        <ul className="flex-1 overflow-y-auto font-mono border-r border-border">
          {items.map((item) => {
            const onGraph = item.kind === "file" && graphFiles.includes(item.path);
            return (
              <li
                key={item.path}
                className="px-3 py-1 flex items-center gap-2 hover:bg-white/[0.03] border-b border-border/40"
              >
                <button
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  onClick={() => void onOpen(item.path, item.kind)}
                >
                  <span className={item.kind === "dir" ? "text-sky-500" : "text-gray-500"}>
                    {item.kind === "dir" ? "DIR" : "FILE"}
                  </span>
                  <span className="text-gray-300 truncate">{item.name}</span>
                </button>
                {item.kind === "file" && (
                  <button
                    className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                      onGraph
                        ? "text-amber-400/80 bg-amber-500/10"
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                    }`}
                    disabled={onGraph}
                    onClick={() => addFileToGraph(item.path)}
                  >
                    {onGraph ? "on graph" : "+ graph"}
                  </button>
                )}
              </li>
            );
          })}
          {items.length === 0 && !loading && (
            <li className="px-3 py-4 text-gray-600 text-center">Empty</li>
          )}
        </ul>

        {preview && (
          <div className="w-1/2 flex flex-col min-w-0">
            <div className="h-7 px-2 flex items-center border-b border-border text-[10px] text-gray-500 font-mono truncate">
              {preview.path}
              <button
                className="ml-auto text-gray-500 hover:text-gray-300"
                onClick={() => setPreview(null)}
              >
                ✕
              </button>
            </div>
            <pre className="flex-1 overflow-auto p-2 text-[11px] text-gray-300 whitespace-pre-wrap">
              {preview.text}
            </pre>
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-border text-[10px] text-gray-600">
        {host?.kind === "tauri"
          ? "Host FS via Tauri commands"
          : "Virtual workspace (web). Tauri unlocks real FS."}
      </div>
    </div>
  );
}
