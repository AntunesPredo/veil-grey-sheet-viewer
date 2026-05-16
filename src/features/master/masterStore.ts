import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CustomEffect, Item } from "../../shared/types/veil-grey";
import { arrayMove } from "@dnd-kit/sortable";

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
  reorderFolders: (oldIndex: number, newIndex: number) => void;
  removeFolder: (id: string) => void;
  addGlobalItem: (item: MasterItem) => void;
  reorderGlobalItems: (activeId: number, overId: number) => void;
  reorderGlobalEffects: (activeId: number, overId: number) => void;
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
      reorderFolders: (oldIndex, newIndex) =>
        set((s) => ({
          folders: arrayMove(s.folders, oldIndex, newIndex),
        })),
      removeFolder: (id) =>
        set((s) => ({
          folders: s.folders.filter((f) => f.id !== id),
          globalItems: s.globalItems.map((i) =>
            i.folderId === id ? { ...i, folderId: null } : i,
          ),
          globalEffects: s.globalEffects.map((e) =>
            e.folderId === id ? { ...e, folderId: null } : e,
          ),
        })),
      addGlobalItem: (item) =>
        set((s) => ({ globalItems: [...s.globalItems, item] })),
      reorderGlobalItems: (activeId, overId) =>
        set((s) => {
          const oldIndex = s.globalItems.findIndex((i) => i.id === activeId);
          const newIndex = s.globalItems.findIndex((i) => i.id === overId);
          if (oldIndex === -1 || newIndex === -1) return s;
          const newItems = [...s.globalItems];
          const [moved] = newItems.splice(oldIndex, 1);
          newItems.splice(newIndex, 0, moved);
          return { globalItems: newItems };
        }),

      reorderGlobalEffects: (activeId, overId) =>
        set((s) => {
          const oldIndex = s.globalEffects.findIndex((e) => e.id === activeId);
          const newIndex = s.globalEffects.findIndex((e) => e.id === overId);
          if (oldIndex === -1 || newIndex === -1) return s;
          const newEffects = [...s.globalEffects];
          const [moved] = newEffects.splice(oldIndex, 1);
          newEffects.splice(newIndex, 0, moved);
          return { globalEffects: newEffects };
        }),
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
