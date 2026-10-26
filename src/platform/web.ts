import type { DirEntry, HostInfo, Platform, RunCommandResult } from "./types";
import { checkCommand } from "./allowlist";

const VIRTUAL: Record<string, string | null> = {
  "src/": null,
  "src/main.rs":
    "fn main() {\n    println!(\"hello agent os\");\n}\n",
  "src/lib.rs": "// library crate\n",
  "src/domain/": null,
  "src/domain/types.ts": "export type NodeKind = 'agent' | 'tool' | 'skill' | 'file';\n",
  "Cargo.toml": '[package]\nname = "demo"\nversion = "0.1.0"\n',
  "README.md": "# Demo workspace\n",
  "HARNESS.md": "# coding-agent\n\nRole: senior coding agent.\n",
  "skills/": null,
  "skills/harness-sdd/": null,
  "skills/harness-sdd/SKILL.md":
    "---\nname: harness-sdd\ndescription: Structured design docs\n---\n\n# SDD\n",
  "skills/code-review/": null,
  "skills/code-review/SKILL.md":
    "---\nname: code-review\ndescription: Review patches\n---\n\n# Review\n",
};

function normalize(path: string): string {
  let p = path.replace(/\\/g, "/").replace(/^\.\//, "");
  if (p === "." || p === "") return "";
  return p.replace(/\/+$/, "") + (path.endsWith("/") ? "/" : "");
}

function parentDir(path: string): string {
  const p = path.replace(/\/+$/, "");
  const i = p.lastIndexOf("/");
  if (i < 0) return "";
  return p.slice(0, i + 1);
}

export const webPlatform: Platform = {
  kind: "web",

  async hostInfo(): Promise<HostInfo> {
    return { kind: "web", os: navigator.platform, cwd: "/virtual" };
  },

  async listDir(path: string): Promise<DirEntry[]> {
    const root = normalize(path);
    const prefix = root === "" || root === "/" ? "" : root.endsWith("/") ? root : root + "/";
    const seen = new Set<string>();
    const out: DirEntry[] = [];

    for (const key of Object.keys(VIRTUAL)) {
      if (prefix && !key.startsWith(prefix)) continue;
      const rest = prefix ? key.slice(prefix.length) : key;
      if (!rest) continue;
      const slash = rest.indexOf("/");
      const name = slash >= 0 ? rest.slice(0, slash) : rest;
      if (!name || seen.has(name)) continue;
      seen.add(name);
      const isDir = slash >= 0 || VIRTUAL[prefix + name + "/"] === null || key.endsWith("/");
      out.push({
        name,
        path: isDir ? prefix + name + "/" : prefix + name,
        kind: isDir ? "dir" : "file",
      });
    }

    out.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return out;
  },

  async readTextFile(path: string): Promise<string> {
    const p = path.replace(/\\/g, "/");
    if (VIRTUAL[p] != null) return VIRTUAL[p] as string;
    if (VIRTUAL[p + "/"] === null) throw new Error(`Is a directory: ${path}`);
    throw new Error(`File not found: ${path}`);
  },

  async writeTextFile(path: string, content: string): Promise<void> {
    const p = path.replace(/\\/g, "/");
    VIRTUAL[p] = content;
    let dir = parentDir(p);
    while (dir) {
      if (!(dir in VIRTUAL)) VIRTUAL[dir] = null;
      dir = parentDir(dir.replace(/\/$/, ""));
    }
  },

  async runCommand(cmd: string, _cwd?: string): Promise<RunCommandResult> {
    const start = performance.now();
    const gate = checkCommand(cmd);
    if (!gate.ok) {
      return {
        code: 126,
        stdout: "",
        stderr: `allowlist: ${gate.reason}\n`,
        durationMs: Math.round(performance.now() - start),
      };
    }
    let stdout = "";
    let stderr = "";
    let code = 0;
    const c = cmd.trim();
    if (c === "pwd") stdout = "/virtual\n";
    else if (c === "echo" || c.startsWith("echo ")) stdout = (c === "echo" ? "" : c.slice(5)) + "\n";
    else if (c === "ls" || c.startsWith("ls ")) {
      stdout =
        Object.keys(VIRTUAL)
          .filter((k) => !k.includes("/") || (k.match(/\//g) || []).length === 1)
          .map((k) => k.replace(/\/$/, ""))
          .filter((v, i, a) => a.indexOf(v) === i)
          .join("\n") + "\n";
    } else if (c.startsWith("git ") || c.startsWith("cargo ") || c.includes("--version")) {
      stdout = `web stub: would run: ${c}\n`;
    } else {
      stderr = `web stub: ${c}\n`;
      code = 0;
    }
    return {
      code,
      stdout,
      stderr,
      durationMs: Math.round(performance.now() - start),
    };
  },

  async saveProjectBlob(key: string, json: string): Promise<void> {
    localStorage.setItem(`agent-os:${key}`, json);
  },

  async loadProjectBlob(key: string): Promise<string | null> {
    return localStorage.getItem(`agent-os:${key}`);
  },
};
