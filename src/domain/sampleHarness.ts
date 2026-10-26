import type { HarnessModel } from "./types";

/** Canonical sample aligned with agent-harnesses progressive disclosure. */
export const sampleHarness: HarnessModel = {
  rootId: "root",
  nodes: {
    root: {
      id: "root",
      kind: "root",
      name: "coding-agent",
      path: "/",
      file: "HARNESS.md",
      summary:
        "Role: senior coding agent for this repository.\n\nYou operate under progressive disclosure: load only the route and leaf content required by the current task.\n\nTop-level routes: skills/, tools/, context/.",
      children: ["r-skills", "r-tools", "r-context"],
    },
    "r-skills": {
      id: "r-skills",
      kind: "route",
      name: "skills/",
      path: "skills/",
      file: "SKILLS.md",
      summary: "Routing index for skills. Prefer harness-sdd for design work, code-review after patches.",
      children: ["s-sdd", "s-review"],
    },
    "r-tools": {
      id: "r-tools",
      kind: "route",
      name: "tools/",
      path: "tools/",
      file: "TOOLS.md",
      summary: "Filesystem and shell capabilities. Activate a leaf before invoking related tools.",
      children: ["t-fs", "t-shell"],
    },
    "r-context": {
      id: "r-context",
      kind: "route",
      name: "context/",
      path: "context/",
      file: "CONTEXT.md",
      summary: "Static project context: architecture notes and API surface.",
      children: ["c-arch", "c-api"],
    },
    "s-sdd": {
      id: "s-sdd",
      kind: "skill",
      name: "harness-sdd",
      path: "skills/harness-sdd/",
      file: "SKILL.md",
      summary:
        "---\nname: harness-sdd\ndescription: Produce structured design docs before large changes\n---\n\n# Structured Design Doc\n\n1. State goal and non-goals\n2. List affected modules\n3. Propose interface changes\n4. Risk and rollback",
    },
    "s-review": {
      id: "s-review",
      kind: "skill",
      name: "code-review",
      path: "skills/code-review/",
      file: "SKILL.md",
      summary:
        "---\nname: code-review\ndescription: Review patches for correctness and style\n---\n\n# Code Review\n\n- Prefer smallest correct diff\n- Flag missing tests\n- Call out API breaks",
    },
    "t-fs": {
      id: "t-fs",
      kind: "leaf",
      name: "filesystem",
      path: "tools/filesystem/",
      file: "HARNESS.md",
      summary: "read_file / write_file / list_dir boundaries and path allowlist.",
    },
    "t-shell": {
      id: "t-shell",
      kind: "leaf",
      name: "shell",
      path: "tools/shell/",
      file: "HARNESS.md",
      summary: "bash with working directory pinned to project root; no network by default.",
    },
    "c-arch": {
      id: "c-arch",
      kind: "leaf",
      name: "architecture",
      path: "context/architecture/",
      file: "ARCH.md",
      summary: "Layering: domain → store → graph UI → platform host.",
    },
    "c-api": {
      id: "c-api",
      kind: "leaf",
      name: "api-surface",
      path: "context/api/",
      file: "API.md",
      summary: "Public Tauri commands and activity bus events.",
    },
  },
};
