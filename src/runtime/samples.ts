/** Preset session transcripts for import UX. */

export const SAMPLE_CLAUDE_CODE = [
  '{"type":"assistant","content":"I will inspect the build failure and fix it."}',
  '{"type":"tool_use","name":"read_file","input":{"path":"src/main.rs"}}',
  '{"type":"tool_result","name":"read_file","content":"fn main() { ... }"}',
  '{"type":"tool_use","name":"bash","input":{"command":"cargo check"}}',
  '{"type":"tool_result","name":"bash","content":"error[E0425]: cannot find function init"}',
  '{"type":"assistant","content":"Missing init call - applying a minimal patch."}',
  '{"type":"tool_use","name":"write_file","input":{"path":"src/main.rs"}}',
  '{"type":"tool_use","name":"bash","input":{"command":"cargo test"}}',
  '{"type":"tool_result","name":"bash","content":"test result: ok. 3 passed"}',
  '{"type":"assistant","content":"All tests passed."}',
].join("\n");

export const SAMPLE_GENERIC = [
  '{"kind":"think","label":"Triage","detail":"CI red on main"}',
  '{"kind":"tool","label":"bash","detail":"git status"}',
  '{"kind":"tool","label":"read_file","detail":"Cargo.toml"}',
  '{"kind":"think","label":"Hypothesis","detail":"serde feature mismatch"}',
  '{"kind":"tool","label":"write_file","detail":"Cargo.toml"}',
  '{"kind":"tool","label":"bash","detail":"cargo test"}',
  '{"kind":"think","label":"Done","detail":"green"}',
].join("\n");
