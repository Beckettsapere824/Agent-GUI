/** Extensible command-palette action registry. */

export type PaletteAction = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  keywords?: string[];
  run: () => void;
};

export type PalettePlugin = {
  id: string;
  /** Called each time the palette opens (or rebuilds). */
  contribute: (ctx: { close: () => void }) => PaletteAction[];
};

const plugins: PalettePlugin[] = [];

export function registerPalettePlugin(plugin: PalettePlugin) {
  const i = plugins.findIndex((p) => p.id === plugin.id);
  if (i >= 0) plugins[i] = plugin;
  else plugins.push(plugin);
}

export function unregisterPalettePlugin(id: string) {
  const i = plugins.findIndex((p) => p.id === id);
  if (i >= 0) plugins.splice(i, 1);
}

export function collectPluginActions(close: () => void): PaletteAction[] {
  const out: PaletteAction[] = [];
  for (const p of plugins) {
    try {
      out.push(...p.contribute({ close }));
    } catch (e) {
      console.warn("[palette plugin]", p.id, e);
    }
  }
  return out;
}
