/** Named session attach recipes (file tail / stdio / demo). */

export type AttachPresetKind = "demo" | "tail" | "stdio";

export type AttachPreset = {
  id: string;
  name: string;
  description: string;
  kind: AttachPresetKind;
  /** For kind=tail */
  path?: string;
  /** For kind=stdio */
  command?: string;
  cwd?: string;
  /** Soft hint for which agent profile fits this attach. */
  suggestedProfileId?: string;
};

export const ATTACH_PRESETS: AttachPreset[] = [
  {
    id: "demo",
    name: "Demo stream",
    description: "Built-in coding narrative (no external process)",
    kind: "demo",
    suggestedProfileId: "coding",
  },
  {
    id: "tail-session",
    name: "Tail session log",
    description: "Watch sessions/demo.jsonl",
    kind: "tail",
    path: "sessions/demo.jsonl",
    suggestedProfileId: "coding",
  },
  {
    id: "tail-claude",
    name: "Tail Claude JSONL",
    description: "Watch sessions/claude-code.jsonl",
    kind: "tail",
    path: "sessions/claude-code.jsonl",
    suggestedProfileId: "coding",
  },
  {
    id: "stdio-cargo",
    name: "Stdio: cargo check",
    description: "Stream cargo check output",
    kind: "stdio",
    command: "cargo check",
    suggestedProfileId: "coding",
  },
  {
    id: "stdio-git-diff",
    name: "Stdio: git diff",
    description: "Stream git diff for review",
    kind: "stdio",
    command: "git diff --stat HEAD",
    suggestedProfileId: "review",
  },
  {
    id: "stdio-git-log",
    name: "Stdio: git log",
    description: "Recent commits",
    kind: "stdio",
    command: "git log -n 12 --oneline",
    suggestedProfileId: "research",
  },
];

export function getAttachPreset(id: string): AttachPreset | undefined {
  return ATTACH_PRESETS.find((p) => p.id === id);
}
