import { useEffect } from "react";
import { useProjectStore } from "../store/projectStore";
import { APP_DEFS, openAppById } from "./shortcuts";

export function useGlobalShortcuts(opts: {
  helpOpen: boolean;
  setHelpOpen: (v: boolean | ((p: boolean) => boolean)) => void;
}) {
  const { helpOpen, setHelpOpen } = opts;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable);

      if (e.key === "Escape") {
        if (helpOpen) {
          e.preventDefault();
          setHelpOpen(false);
        }
        return;
      }

      if (typing) return;

      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }

      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        useProjectStore.getState().saveLocal();
        return;
      }

      // digit keys without modifiers → app switcher
      if (!mod && !e.altKey && /^[1-5]$/.test(e.key)) {
        const def = APP_DEFS.find((a) => a.key === e.key);
        if (def) {
          e.preventDefault();
          openAppById(def.id);
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [helpOpen, setHelpOpen]);
}
