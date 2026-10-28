import type { NormalizedEvent } from "./transcript";
import { AGENT_PROFILES, getProfile } from "../domain/profiles";

export type ProfileHint = {
  profileId: string;
  profileName: string;
  score: number;
  confidence: "low" | "medium" | "high";
  reasons: string[];
};

function scoreEvents(events: NormalizedEvent[]): Map<string, { score: number; reasons: string[] }> {
  const scores = new Map<string, { score: number; reasons: string[] }>();
  const bump = (id: string, n: number, reason: string) => {
    const cur = scores.get(id) ?? { score: 0, reasons: [] };
    cur.score += n;
    if (reason && !cur.reasons.includes(reason)) cur.reasons.push(reason);
    scores.set(id, cur);
  };

  let reads = 0;
  let writes = 0;
  let shell = 0;
  let review = 0;
  let research = 0;
  let web = 0;
  let sdd = 0;

  for (const e of events) {
    const hay = `${e.label} ${e.detail ?? ""} ${e.kind}`.toLowerCase();
    if (e.kind === "read" || hay.includes("read_file") || hay.includes("read file")) reads++;
    if (e.kind === "write" || hay.includes("write_file") || hay.includes("edited")) writes++;
    if (hay.includes("bash") || hay.includes("cargo") || hay.includes("shell") || hay.includes("git "))
      shell++;
    if (hay.includes("code-review") || hay.includes("review") || hay.includes("diff")) review++;
    if (hay.includes("web_search") || hay.includes("search")) web++;
    if (hay.includes("harness-sdd") || hay.includes("sdd") || hay.includes("design doc")) sdd++;
    if (hay.includes("readme") || hay.includes("architecture") || hay.includes("research")) research++;
  }

  if (writes > 0 || (shell > 0 && reads > 0)) {
    bump("coding", writes * 3 + shell * 2 + reads, "write/shell activity");
  }
  if (review > 0 || (reads > 0 && writes === 0 && shell > 0)) {
    bump("review", review * 4 + reads * 2 + shell, "review / read+shell pattern");
  }
  if (web > 0 || sdd > 0 || research > 0) {
    bump("research", web * 4 + sdd * 4 + research * 2 + reads, "search / SDD / docs");
  }
  if (events.length === 0) {
    bump("blank", 1, "empty transcript");
  } else if (events.length <= 2 && writes === 0 && shell === 0) {
    bump("blank", 2, "minimal activity");
  }

  // soft prior so ties resolve toward coding for tool-heavy streams
  if (events.length >= 4 && !scores.has("coding")) {
    bump("coding", 1, "general tool stream");
  }

  return scores;
}

export function hintProfileFromEvents(events: NormalizedEvent[]): ProfileHint | null {
  if (!events.length) return null;
  const scores = scoreEvents(events);
  let bestId = "";
  let best = -1;
  for (const [id, v] of scores) {
    if (v.score > best) {
      best = v.score;
      bestId = id;
    }
  }
  if (!bestId || best <= 0) return null;
  const p = getProfile(bestId) ?? AGENT_PROFILES[0];
  const confidence: ProfileHint["confidence"] =
    best >= 12 ? "high" : best >= 5 ? "medium" : "low";
  return {
    profileId: p.id,
    profileName: p.name,
    score: best,
    confidence,
    reasons: scores.get(bestId)?.reasons ?? [],
  };
}

export function hintProfileFromText(
  text: string,
  parse: (t: string) => { events: NormalizedEvent[] }
): ProfileHint | null {
  try {
    return hintProfileFromEvents(parse(text).events);
  } catch {
    return null;
  }
}
