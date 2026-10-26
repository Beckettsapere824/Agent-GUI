/**
 * Transcript adapter layer.
 *
 * Goal: normalize heterogeneous agent session logs into ActivityEvent-shaped
 * records so Runtime can replay or live-ingest without caring about the source.
 *
 * Supported sources (initial):
 * - agent-os-demo: our built-in demo script format
 * - generic-jsonl: one JSON object per line with flexible field names
 * - claude-code-ish: common tool_use / tool_result style records
 */

import type { ActivityKind } from "../store/activityStore";

export interface NormalizedEvent {
  kind: ActivityKind;
  label: string;
  detail?: string;
  nodeId?: string;
  /** Original timestamp if present (ms). Replay uses ordering, not wall clock. */
  ts?: number;
}

export type TranscriptSource = "agent-os-demo" | "generic-jsonl" | "claude-code-ish";

export interface ParseResult {
  source: TranscriptSource;
  events: NormalizedEvent[];
  warnings: string[];
}

function asKind(v: unknown): ActivityKind {
  const s = String(v ?? "think").toLowerCase();
  if (s === "read" || s === "write" || s === "tool" || s === "think" || s === "error") return s;
  if (s.includes("read")) return "read";
  if (s.includes("write") || s.includes("edit")) return "write";
  if (s.includes("tool") || s.includes("bash") || s.includes("command")) return "tool";
  if (s.includes("error") || s.includes("fail")) return "error";
  return "think";
}

/** Map free-form labels to graph node ids in the sample domain graph. */
export function inferNodeId(label: string, detail?: string): string | undefined {
  const hay = `${label} ${detail ?? ""}`.toLowerCase();
  if (hay.includes("read_file") || hay.includes("read file")) return "tool-1";
  if (hay.includes("write_file") || hay.includes("write file") || hay.includes("edited")) return "tool-2";
  if (hay.includes("bash") || hay.includes("cargo") || hay.includes("shell")) return "tool-3";
  if (hay.includes("harness-sdd") || hay.includes("sdd")) return "skill-1";
  if (hay.includes("code-review") || hay.includes("review")) return "skill-2";
  if (hay.includes("main.rs")) return "file-1";
  if (hay.includes("cargo.toml")) return "file-2";
  if (hay.includes("agent") || hay.includes("planning") || hay.includes("analyz") || hay.includes("done"))
    return "agent-1";
  return undefined;
}

function parseGenericJsonl(text: string): ParseResult {
  const events: NormalizedEvent[] = [];
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    try {
      const o = JSON.parse(lines[i]) as Record<string, unknown>;
      const label = String(o.label ?? o.name ?? o.tool ?? o.type ?? o.message ?? `event-${i}`);
      const detail =
        o.detail != null
          ? String(o.detail)
          : o.path != null
          ? String(o.path)
          : o.input != null
          ? String(o.input)
          : undefined;
      const kind = asKind(o.kind ?? o.type ?? o.role);
      const nodeId =
        typeof o.nodeId === "string"
          ? o.nodeId
          : inferNodeId(label, detail);
      const ts =
        typeof o.ts === "number"
          ? o.ts
          : typeof o.timestamp === "number"
          ? o.timestamp
          : typeof o.time === "number"
          ? o.time
          : undefined;
      events.push({ kind, label, detail, nodeId, ts });
    } catch {
      warnings.push(`line ${i + 1}: not valid JSON`);
    }
  }

  return { source: "generic-jsonl", events, warnings };
}

function parseClaudeCodeIsh(text: string): ParseResult {
  const events: NormalizedEvent[] = [];
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    try {
      const o = JSON.parse(lines[i]) as Record<string, unknown>;
      const type = String(o.type ?? o.event ?? "");

      if (type === "tool_use" || type === "tool_call" || o.name) {
        const name = String(o.name ?? o.tool_name ?? "tool");
        const input = o.input ?? o.arguments ?? o.args;
        const detail =
          typeof input === "string"
            ? input
            : input && typeof input === "object"
            ? JSON.stringify(input).slice(0, 120)
            : undefined;
        events.push({
          kind: "tool",
          label: name,
          detail,
          nodeId: inferNodeId(name, detail),
        });
        continue;
      }

      if (type === "tool_result" || type === "result") {
        const name = String(o.name ?? o.tool_name ?? "result");
        events.push({
          kind: asKind(o.is_error ? "error" : "tool"),
          label: name,
          detail: o.content != null ? String(o.content).slice(0, 120) : undefined,
          nodeId: inferNodeId(name),
        });
        continue;
      }

      if (type === "assistant" || type === "thinking" || type === "text") {
        const content = String(o.content ?? o.text ?? o.message ?? "think");
        events.push({
          kind: "think",
          label: content.slice(0, 80),
          nodeId: "agent-1",
        });
        continue;
      }

      const label = String(o.label ?? o.message ?? (type || `event-${i}`));
      events.push({
        kind: asKind(type),
        label,
        detail: o.detail != null ? String(o.detail) : undefined,
        nodeId: inferNodeId(label),
      });
    } catch {
      warnings.push(`line ${i + 1}: not valid JSON`);
    }
  }

  return { source: "claude-code-ish", events, warnings };
}

/** Auto-detect and parse transcript text. */
export function parseTranscript(text: string): ParseResult {
  const trimmed = text.trim();
  if (!trimmed) return { source: "generic-jsonl", events: [], warnings: ["empty input"] };

  const sample = trimmed.split(/\r?\n/).find((l) => l.trim()) ?? "";
  try {
    const o = JSON.parse(sample) as Record<string, unknown>;
    if (o.type === "tool_use" || o.type === "tool_result" || o.type === "assistant" || o.name) {
      return parseClaudeCodeIsh(trimmed);
    }
  } catch {
    /* fall through */
  }
  return parseGenericJsonl(trimmed);
}

/** Built-in demo transcript (same narrative as startDemoRun). */
export const DEMO_TRANSCRIPT = [
  '{"kind":"think","label":"Planning task","detail":"Fix build error in main.rs","nodeId":"agent-1"}',
  '{"kind":"tool","label":"read_file","detail":"src/main.rs","nodeId":"tool-1"}',
  '{"kind":"read","label":"Opened","detail":"src/main.rs","nodeId":"file-1"}',
  '{"kind":"tool","label":"read_file","detail":"Cargo.toml","nodeId":"tool-1"}',
  '{"kind":"read","label":"Opened","detail":"Cargo.toml","nodeId":"file-2"}',
  '{"kind":"think","label":"Analyzing","detail":"Missing dependency","nodeId":"agent-1"}',
  '{"kind":"tool","label":"bash","detail":"cargo check","nodeId":"tool-3"}',
  '{"kind":"tool","label":"write_file","detail":"src/main.rs","nodeId":"tool-2"}',
  '{"kind":"write","label":"Edited","detail":"src/main.rs (+12 -3)","nodeId":"file-1"}',
  '{"kind":"tool","label":"code-review","detail":"Reviewing patch","nodeId":"skill-2"}',
  '{"kind":"tool","label":"bash","detail":"cargo test","nodeId":"tool-3"}',
  '{"kind":"think","label":"Done","detail":"All tests passed","nodeId":"agent-1"}',
].join("\n");
