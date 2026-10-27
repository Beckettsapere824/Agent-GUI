import { AGENT_PROFILES, applyProfile } from "../domain/profiles";
import {
  downloadText,
  exportProfilePair,
  importProfilePair,
  pickTextFile,
} from "../domain/profilePair";
import { useProjectStore } from "../store/projectStore";
import { useSessionStore } from "../store/sessionStore";
import { LAYOUT_PRESETS, applyLayout } from "./layouts";
import { registerPalettePlugin } from "./palettePlugins";
import { APP_DEFS, openAppById } from "./shortcuts";

let registered = false;

/** Core actions always present in the command palette. */
export function ensureBuiltinPalettePlugins() {
  if (registered) return;
  registered = true;

  registerPalettePlugin({
    id: "windows",
    contribute: ({ close }) =>
      APP_DEFS.map((a) => ({
        id: `app-${a.id}`,
        group: "Windows",
        label: `Open ${a.title}`,
        hint: a.key,
        keywords: [a.title, a.type, a.id],
        run: () => {
          openAppById(a.id);
          close();
        },
      })),
  });

  registerPalettePlugin({
    id: "layouts",
    contribute: ({ close }) =>
      LAYOUT_PRESETS.map((l) => ({
        id: `layout-${l.id}`,
        group: "Layouts",
        label: `Layout: ${l.name}`,
        hint: l.description,
        keywords: ["layout", "workspace", l.id, l.name],
        run: () => {
          applyLayout(l.id);
          close();
        },
      })),
  });

  registerPalettePlugin({
    id: "profiles",
    contribute: ({ close }) =>
      AGENT_PROFILES.map((p) => ({
        id: `profile-${p.id}`,
        group: "Profiles",
        label: `Profile: ${p.name}`,
        hint: p.description,
        keywords: [p.id, p.name, "harness", "graph"],
        run: () => {
          applyProfile(p.id);
          openAppById("main-graph");
          close();
        },
      })),
  });

  registerPalettePlugin({
    id: "runtime",
    contribute: ({ close }) => [
      {
        id: "runtime-demo",
        group: "Runtime",
        label: "Run session demo",
        keywords: ["demo", "session", "live"],
        run: () => {
          openAppById("runtime");
          useSessionStore.getState().startDemo();
          close();
        },
      },
      {
        id: "runtime-stop",
        group: "Runtime",
        label: "Stop active session",
        keywords: ["stop", "session"],
        run: () => {
          useSessionStore.getState().stopActive();
          close();
        },
      },
    ],
  });

  registerPalettePlugin({
    id: "project",
    contribute: ({ close }) => [
      {
        id: "project-save",
        group: "Project",
        label: "Save project (local)",
        keywords: ["save", "local"],
        run: () => {
          useProjectStore.getState().saveLocal();
          close();
        },
      },
      {
        id: "project-export",
        group: "Project",
        label: "Export project JSON",
        keywords: ["export", "download", "json"],
        run: () => {
          const json = useProjectStore.getState().exportJson();
          const name = useProjectStore.getState().name || "project";
          downloadText(`${name}.agent-os.json`, json);
          close();
        },
      },
      {
        id: "project-import",
        group: "Project",
        label: "Import project JSON…",
        keywords: ["import", "open", "json"],
        run: () => {
          void pickTextFile().then((text) => {
            if (text) useProjectStore.getState().importJson(text);
            close();
          });
        },
      },
      {
        id: "profile-export",
        group: "Project",
        label: "Export profile pair (graph + harness)",
        keywords: ["profile", "pair", "export", "harness"],
        run: () => {
          const name = useProjectStore.getState().name || "profile";
          downloadText(`${name}.profile.json`, exportProfilePair());
          close();
        },
      },
      {
        id: "profile-import",
        group: "Project",
        label: "Import profile pair…",
        keywords: ["profile", "pair", "import"],
        run: () => {
          void pickTextFile().then((text) => {
            if (text) importProfilePair(text);
            close();
          });
        },
      },
    ],
  });
}
