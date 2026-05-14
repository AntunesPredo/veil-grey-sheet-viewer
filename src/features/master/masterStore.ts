import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CustomEffect, Item } from "../../shared/types/veil-grey";

export type MasterFolder = {
  id: string;
  name: string;
  type: "ITEM" | "EFFECT";
};

export type MasterItem = Item & {
  folderId: string | null;
};

export type MasterEffect = CustomEffect & {
  folderId: string | null;
};

interface MasterStore {
  folders: MasterFolder[];
  globalItems: MasterItem[];
  globalEffects: MasterEffect[];

  addFolder: (folder: MasterFolder) => void;
  removeFolder: (id: string) => void;
  addGlobalItem: (item: MasterItem) => void;
  removeGlobalItem: (id: number) => void;
  addGlobalEffect: (effect: MasterEffect) => void;
  removeGlobalEffect: (id: number) => void;
  moveItemToFolder: (itemId: number, folderId: string | null) => void;
  moveEffectToFolder: (effectId: number, folderId: string | null) => void;
  importArsenal: (data: Partial<MasterStore>) => void;
}

export const useMasterStore = create<MasterStore>()(
  persist(
    (set) => ({
      folders: [],
      globalItems: [],
      globalEffects: [],

      addFolder: (folder) => set((s) => ({ folders: [...s.folders, folder] })),
      removeFolder: (id) =>
        set((s) => ({ folders: s.folders.filter((f) => f.id !== id) })),
      addGlobalItem: (item) =>
        set((s) => ({ globalItems: [...s.globalItems, item] })),
      removeGlobalItem: (id) =>
        set((s) => ({ globalItems: s.globalItems.filter((i) => i.id !== id) })),
      addGlobalEffect: (effect) =>
        set((s) => ({ globalEffects: [...s.globalEffects, effect] })),
      removeGlobalEffect: (id) =>
        set((s) => ({
          globalEffects: s.globalEffects.filter((e) => e.id !== id),
        })),
      moveItemToFolder: (itemId, folderId) =>
        set((s) => ({
          globalItems: s.globalItems.map((i) =>
            i.id === itemId ? { ...i, folderId } : i,
          ),
        })),
      moveEffectToFolder: (effectId, folderId) =>
        set((s) => ({
          globalEffects: s.globalEffects.map((e) =>
            e.id === effectId ? { ...e, folderId } : e,
          ),
        })),
      importArsenal: (data) => set((s) => ({ ...s, ...data })),
    }),
    { name: "vg_master_arsenal" },
  ),
);
