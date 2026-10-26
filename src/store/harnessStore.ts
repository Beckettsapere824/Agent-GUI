import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { HarnessModel } from "../domain/types";
import { sampleHarness } from "../domain/sampleHarness";

interface HarnessState {
  model: HarnessModel;
  selectedId: string | null;
  select: (id: string | null) => void;
  replace: (m: HarnessModel) => void;
}

export const useHarnessStore = create<HarnessState>()(
  immer((set) => ({
    model: structuredClone(sampleHarness),
    selectedId: "root",
    select: (id) =>
      set((s) => {
        s.selectedId = id;
      }),
    replace: (m) =>
      set((s) => {
        s.model = structuredClone(m);
        s.selectedId = m.rootId;
      }),
  }))
);
