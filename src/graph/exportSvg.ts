import type { DomainGraph } from "../domain/types";

const kindFill: Record<string, string> = {
  agent: "#1a2332",
  tool: "#15201a",
  skill: "#1c1828",
  file: "#1f1c14",
};

const kindStroke: Record<string, string> = {
  agent: "#3b82f6",
  tool: "#10b981",
  skill: "#8b5cf6",
  file: "#f59e0b",
};

/** Build a standalone SVG string from the domain graph (no DOM dependency). */
export function graphToSvg(graph: DomainGraph, title = "Agent Graph"): string {
  const pad = 40;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const n of graph.nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + 160);
    maxY = Math.max(maxY, n.y + 64);
  }
  if (!Number.isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = 400;
    maxY = 300;
  }
  const w = maxX - minX + pad * 2;
  const h = maxY - minY + pad * 2;
  const ox = -minX + pad;
  const oy = -minY + pad;

  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  const edges = graph.edges
    .map((e) => {
      const a = nodeMap.get(e.source);
      const b = nodeMap.get(e.target);
      if (!a || !b) return "";
      const x1 = a.x + ox + 150;
      const y1 = a.y + oy + 28;
      const x2 = b.x + ox + 10;
      const y2 = b.y + oy + 28;
      return `<path d="M${x1} ${y1} C${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}" fill="none" stroke="#3b82f6" stroke-width="1.5" marker-end="url(#arrow)"/>`;
    })
    .join("\n");

  const nodes = graph.nodes
    .map((n) => {
      const x = n.x + ox;
      const y = n.y + oy;
      const fill = kindFill[n.kind] ?? "#1a1f2a";
      const stroke = kindStroke[n.kind] ?? "#666";
      const label = escapeXml(n.data.label);
      const sub =
        n.kind === "agent"
          ? n.data.model
          : n.kind === "tool"
          ? n.data.category
          : n.kind === "skill"
          ? n.data.description
          : n.data.path;
      const subLine = sub ? escapeXml(String(sub).slice(0, 28)) : "";
      return `
      <g transform="translate(${x},${y})">
        <rect width="160" height="56" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
        <text x="10" y="18" fill="${stroke}" font-size="9" font-family="system-ui,sans-serif" font-weight="600">${n.kind.toUpperCase()}</text>
        <text x="10" y="36" fill="#e5e7eb" font-size="12" font-family="system-ui,sans-serif">${label}</text>
        ${subLine ? `<text x="10" y="50" fill="#9ca3af" font-size="9" font-family="ui-monospace,monospace">${subLine}</text>` : ""}
      </g>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="#3b82f6"/>
    </marker>
  </defs>
  <rect width="100%" height="100%" fill="#0f1115"/>
  <text x="${pad}" y="24" fill="#9ca3af" font-size="12" font-family="system-ui,sans-serif">${escapeXml(title)}</text>
  ${edges}
  ${nodes}
</svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function downloadSvg(svg: string, filename = "agent-graph.svg") {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
