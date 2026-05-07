import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UIState {
  drawerLeft: { isOpen: boolean; isPinned: boolean; widthVW: number };
  drawerRight: { isOpen: boolean; isPinned: boolean; widthVW: number };
  accordions: Record<string, boolean>;
  isSettingsModalOpen: boolean;
  pendingInjection: string | null;
}

export interface UIActions {
  setDrawerState: (
    side: "left" | "right",
    data: Partial<UIState["drawerLeft"]>,
  ) => void;
  toggleAccordion: (id: string) => void;
  toggleSettingsModal: () => void;
  enforceLayoutConstraints: (screenWidth: number) => void;
  setPendingInjection: (hash: string | null) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      drawerLeft: {
        isOpen: false,
        isPinned: window.innerWidth > 1024,
        widthVW: 20,
      },
      drawerRight: {
        isOpen: false,
        isPinned: window.innerWidth > 1024,
        widthVW: 20,
      },
      accordions: {},
      isSettingsModalOpen: false,
      pendingInjection: null,

      setDrawerState: (side, data) =>
        set((state) => ({
          [side === "left" ? "drawerLeft" : "drawerRight"]: {
            ...state[side === "left" ? "drawerLeft" : "drawerRight"],
            ...data,
          },
        })),
      toggleAccordion: (id) =>
        set((state) => ({
          accordions: {
            ...state.accordions,
            [id]:
              state.accordions[id] !== undefined ? !state.accordions[id] : true,
          },
        })),
      toggleSettingsModal: () =>
        set((state) => ({ isSettingsModalOpen: !state.isSettingsModalOpen })),
      enforceLayoutConstraints: (screenWidth) =>
        set((state) => {
          const updates = { ...state };
          if (screenWidth < 768) {
            updates.drawerLeft.isPinned = false;
            updates.drawerRight.isPinned = false;
          } else if (
            screenWidth < 1100 &&
            updates.drawerLeft.isPinned &&
            updates.drawerRight.isPinned
          ) {
            updates.drawerRight.isPinned = false;
          }
          if (
            updates.drawerLeft.isPinned &&
            updates.drawerRight.isPinned &&
            updates.drawerLeft.widthVW + updates.drawerRight.widthVW > 60
          ) {
            updates.drawerLeft.widthVW = 25;
            updates.drawerRight.widthVW = 25;
          }
          return updates;
        }),
      setPendingInjection: (hash) => set({ pendingInjection: hash }),
    }),
    { name: "vg_ui_data" },
  ),
);
