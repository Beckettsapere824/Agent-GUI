import { useEffect, useMemo, useState } from "react";
import { useGraphStore } from "../store/graphStore";
import { useProjectStore } from "../store/projectStore";
import { useWorkspaceStore } from "../store/workspaceStore";

export function FilesPanel() {
  const [filter, setFilter] = useState("");
  const [preview, setPreview] = useState<{ path: string; text: string } | null>(null);
  const [showProjects, setShowProjects] = useState(false);

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
  const registry = useProjectStore((s) => s.registry);
  const refreshRegistry = useProjectStore((s) => s.refreshRegistry);
  const loadProject = useProjectStore((s) => s.loadProject);
  const newProject = useProjectStore((s) => s.newProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const currentId = useProjectStore((s) => s.id);

  const root = useWorkspaceStore((s) => s.root);
  const host = useWorkspaceStore((s) => s.host);
  const entries = useWorkspaceStore((s) => s.entries) ?? [];
  const loading = useWorkspaceStore((s) => s.loading);
  const error = useWorkspaceStore((s) => s.error);
  const init = useWorkspaceStore((s) => s.init);
  const setRoot = useWorkspaceStore((s) => s.setRoot);
  const refresh = useWorkspaceStore((s) => s.refresh);
  const readFile = useWorkspaceStore((s) => s.readFile);

  useEffect(() => {
    void init();
    refreshRegistry();
  }, [init, refreshRegistry]);

  const items = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = entries ?? [];
    return list.filter(
      (t) => !q || t.path.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
    );
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
    const parent = i <= 0 ? "." : cleaned.slice(0, i);
    await setRoot(parent || ".");
  };

  return (
    <div className="w-full h-full flex flex-col text-xs">
      <div className="h-9 shrink-0 flex items-center gap-2 px-3 border-b border-border bg-[#12151c]">
        <span className="text-[11px] text-amber-400 font-medium">Files</span>
        <span className="text-gray-600">|</span>
        <span className="text-gray-500 truncate max-w-[160px]" title={root}>
          {root}
        </span>
        <span className="text-gray-600 uppercase">{host}</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            className="h-6 px-2 rounded text-[10px] text-gray-400 hover:bg-white/5"
            onClick={() => void onUp()}
          >
            Up
          </button>
          <button
            className="h-6 px-2 rounded text-[10px] text-gray-400 hover:bg-white/5"
            onClick={() => void refresh()}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="px-3 py-2 border-b border-border flex flex-wrap gap-2 items-center bg-[#0f1115]">
        <input
          className="h-6 flex-1 min-w-[100px] bg-[#0c0e14] border border-border rounded px-2 text-[11px] text-gray-300 outline-none focus:border-accent"
          placeholder="Filter…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <input
          className="h-6 w-28 bg-[#0c0e14] border border-border rounded px-2 text-[11px] text-gray-300 outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
          title="Project name"
        />
        <button
          className="h-6 px-2 rounded text-[10px] bg-accent/20 text-accent hover:bg-accent/30"
          onClick={() => saveLocal()}
        >
          Save
        </button>
        <button
          className="h-6 px-2 rounded text-[10px] text-gray-400 hover:bg-white/5"
          onClick={() => loadLocal()}
        >
          Load
        </button>
        <button
          className="h-6 px-2 rounded text-[10px] text-gray-400 hover:bg-white/5"
          onClick={onExport}
        >
          Export
        </button>
        <button
          className="h-6 px-2 rounded text-[10px] text-gray-400 hover:bg-white/5"
          onClick={() => setShowProjects((v) => !v)}
        >
          Projects
        </button>
        {lastSavedAt && (
          <span className="text-[10px] text-gray-600">saved {new Date(lastSavedAt).toLocaleTimeString()}</span>
        )}
      </div>

      {showProjects && (
        <div className="border-b border-border px-3 py-2 space-y-1 bg-[#0c0e14]">
          <div className="flex gap-1">
            <button
              className="h-6 px-2 rounded text-[10px] bg-white/5 text-gray-300"
              onClick={() => newProject()}
            >
              New project
            </button>
          </div>
          <ul className="max-h-28 overflow-y-auto">
            {(registry ?? []).map((p) => (
              <li key={p.id} className="flex items-center gap-2 py-0.5">
                <button
                  className={`text-[11px] truncate flex-1 text-left ${
                    p.id === currentId ? "text-accent" : "text-gray-400 hover:text-gray-200"
                  }`}
                  onClick={() => loadProject(p.id)}
                >
                  {p.name}
                </button>
                <button
                  className="text-[10px] text-gray-600 hover:text-red-400"
                  onClick={() => deleteProject(p.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-1 min-h-0 flex">
        <div className="w-1/2 border-r border-border overflow-y-auto">
          {loading && <div className="p-3 text-gray-600">Loading…</div>}
          {error && <div className="p-3 text-red-400">{error}</div>}
          {!loading && items.length === 0 && (
            <div className="p-3 text-gray-600">Empty directory</div>
          )}
          <ul className="divide-y divide-border/50">
            {items.map((e) => (
              <li key={e.path}>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-white/[0.03]"
                  onClick={() => void onOpen(e.path, e.kind)}
                  onDoubleClick={() => e.kind === "file" && addFileToGraph(e.path)}
                >
                  <span className="text-[10px] text-gray-600 w-8">{e.kind === "dir" ? "DIR" : "FILE"}</span>
                  <span className="text-gray-300 truncate font-mono text-[11px]">{e.name}</span>
                  {e.kind === "file" && graphFiles.includes(e.path) && (
                    <span className="ml-auto text-[9px] text-accent">on graph</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-1/2 overflow-auto p-2 font-mono text-[11px] text-gray-400">
          {preview ? (
            <>
              <div className="text-gray-500 mb-2 flex justify-between gap-2">
                <span className="truncate">{preview.path}</span>
                <button
                  className="text-accent shrink-0"
                  onClick={() => addFileToGraph(preview.path)}
                >
                  + graph
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-gray-300">{preview.text}</pre>
            </>
          ) : (
            <div className="text-gray-600">Select a file to preview</div>
          )}
        </div>
      </div>
    </div>
  );
}
