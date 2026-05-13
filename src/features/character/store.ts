import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createProgressionSlice,
  type ProgressionSlice,
} from "../progression/progressionSlice";
import { createStatsSlice, type StatsSlice } from "../stats/statsSlice";
import { createVitalsSlice, type VitalsSlice } from "../vitals/vitalsSlice";
import {
  createInventorySlice,
  type InventorySlice,
} from "../inventory/inventorySlice";
import { createNotesSlice, type NotesSlice } from "../notes/notesSlice";

const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";

export type CharacterStore = ProgressionSlice &
  StatsSlice &
  VitalsSlice &
  InventorySlice &
  NotesSlice & {
    appVersion: string;
    isOutdatedSave: boolean;
    setOutdatedSave: (val: boolean) => void;
    resetCharacterData: () => void;
    importCharacterData: (data: Partial<CharacterStore>) => void;
  };

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (...a) => {
      const [set] = a;

      return {
        ...createProgressionSlice(...a),
        ...createStatsSlice(...a),
        ...createVitalsSlice(...a),
        ...createInventorySlice(...a),
        ...createNotesSlice(...a),

        appVersion: APP_VERSION,
        isOutdatedSave: false,

        setOutdatedSave: (val) => set({ isOutdatedSave: val }),

        importCharacterData: (data) => {
          set((state) => ({
            ...state,
            ...data,
            isOutdatedSave: false,
            appVersion: APP_VERSION,
          }));
        },

        resetCharacterData: () => {
          const emptyState = {
            ...createProgressionSlice(...a),
            ...createStatsSlice(...a),
            ...createVitalsSlice(...a),
            ...createInventorySlice(...a),
            ...createNotesSlice(...a),
            appVersion: APP_VERSION,
            isOutdatedSave: false,
          };
          set(emptyState);
        },
      };
    },
    {
      name: "vg_character_data",
      onRehydrateStorage: () => {
        return (state, error) => {
          if (!error && state) {
            if (state.appVersion !== APP_VERSION) {
              state.setOutdatedSave(true);
            } else {
              state.setOutdatedSave(false);
            }
          }
        };
      },
      partialize: (state) => ({
        ...state,
        crisis: { ...state.crisis, ignore: false },
        isOutdatedSave: undefined,
      }),
    },
  ),
);
