import { useState } from "react";
import { getPlatform, type RunCommandResult } from "../platform";
import { useWorkspaceStore } from "../store/workspaceStore";

export function ShellPanel() {
  const root = useWorkspaceStore((s) => s.root);
  const [cmd, setCmd] = useState("pwd");
  const [log, setLog] = useState<Array<{ cmd: string; result: RunCommandResult }>>([]);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!cmd.trim() || busy) return;
    setBusy(true);
    try {
      const p = await getPlatform();
      const result = await p.runCommand(cmd.trim(), root || undefined);
      setLog((prev) => [{ cmd: cmd.trim(), result }, ...prev].slice(0, 40));
    } catch (e) {
      setLog((prev) => [
        {
          cmd: cmd.trim(),
          result: { code: -1, stdout: "", stderr: String(e), durationMs: 0 },
        },
        ...prev,
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col text-xs">
      <div className="h-8 shrink-0 flex items-center gap-2 px-3 border-b border-border bg-[#12151c]">
        <span className="text-emerald-400/90 font-medium text-[11px]">Shell</span>
        <span className="text-gray-600">|</span>
        <span className="text-[10px] text-gray-500 font-mono truncate">{root || "/"}</span>
        <span className="ml-auto text-[10px] text-gray-600">allowlisted</span>
      </div>
      <div className="p-2 border-b border-border flex gap-1">
        <input
          className="flex-1 bg-[#0f1115] border border-border rounded px-2 py-1.5 font-mono text-gray-200 outline-none focus:border-accent"
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void run();
          }}
          placeholder="pwd | ls | git status | cargo check …"
        />
        <button
          className="h-8 px-3 rounded bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-40"
          onClick={() => void run()}
          disabled={busy}
        >
          Run
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto font-mono text-[11px]">
        {log.map((row, i) => (
          <li key={i} className="px-3 py-2 border-b border-border/50">
            <div className="text-emerald-400/80">$ {row.cmd}</div>
            {row.result.stdout && (
              <pre className="text-gray-300 whitespace-pre-wrap mt-1">{row.result.stdout}</pre>
            )}
            {row.result.stderr && (
              <pre className="text-red-400/80 whitespace-pre-wrap mt-1">{row.result.stderr}</pre>
            )}
            <div className="text-gray-600 mt-1">
              exit {row.result.code} · {row.result.durationMs}ms
            </div>
          </li>
        ))}
        {log.length === 0 && (
          <li className="px-3 py-6 text-center text-gray-600">
            Allowlist: pwd, ls, echo, git status/log/diff, cargo check/test/build, *--version
          </li>
        )}
      </ul>
    </div>
  );
}
