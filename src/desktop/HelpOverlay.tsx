import { SHORTCUT_HELP } from "./shortcuts";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function HelpOverlay({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[min(440px,92vw)] rounded-lg border border-border bg-[#12151c] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-10 flex items-center justify-between px-4 border-b border-border">
          <span className="text-sm text-gray-200 font-medium">Keyboard</span>
          <button className="text-gray-500 hover:text-gray-300 text-sm" onClick={onClose}>
            Esc
          </button>
        </div>
        <ul className="p-3 space-y-1.5 text-xs">
          {SHORTCUT_HELP.map((row) => (
            <li key={row.keys} className="flex gap-3 items-start py-1">
              <kbd className="shrink-0 min-w-[7.5rem] px-1.5 py-0.5 rounded bg-[#0f1115] border border-border font-mono text-[11px] text-accent text-center">
                {row.keys}
              </kbd>
              <span className="text-gray-400 pt-0.5">{row.action}</span>
            </li>
          ))}
        </ul>
        <div className="px-4 py-2 border-t border-border text-[10px] text-gray-600">
          Agent OS · graph-first coding agent shell
        </div>
      </div>
    </div>
  );
}
