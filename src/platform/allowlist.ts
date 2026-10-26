/** Conservative shell allowlist for demo safety. */

const ALLOWED_PREFIXES = [
  "pwd",
  "echo ",
  "echo",
  "ls",
  "ls ",
  "dir",
  "dir ",
  "cat ",
  "type ",
  "head ",
  "wc ",
  "which ",
  "where ",
  "git status",
  "git log",
  "git diff",
  "git branch",
  "cargo check",
  "cargo test",
  "cargo build",
  "cargo --version",
  "node --version",
  "npm --version",
  "rustc --version",
];

const DENIED = [
  /rm\s+-rf/i,
  /sudo\b/i,
  /curl\s+.*\|\s*sh/i,
  /wget\s+.*\|\s*sh/i,
  /mkfs/i,
  /dd\s+if=/i,
  />\s*\/dev\//i,
  /chmod\s+777/i,
  /shutdown/i,
  /reboot/i,
];

export function checkCommand(cmd: string): { ok: true } | { ok: false; reason: string } {
  const c = cmd.trim();
  if (!c) return { ok: false, reason: "empty command" };
  for (const re of DENIED) {
    if (re.test(c)) return { ok: false, reason: `blocked pattern: ${re}` };
  }
  const allowed = ALLOWED_PREFIXES.some((p) => c === p.trim() || c.startsWith(p));
  if (!allowed) {
    return {
      ok: false,
      reason: `not on allowlist (pwd, ls, echo, git status/log/diff, cargo check/test/build, …)`,
    };
  }
  return { ok: true };
}
