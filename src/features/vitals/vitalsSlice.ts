import type { StateCreator } from "zustand";
import type { CharacterStore } from "../character/store";
import type { CrisisState, InstantAction } from "../../shared/types/veil-grey";
import { VG_CONFIG } from "../../shared/config/system.config";
import { buildSustenanceStages } from "../../shared/utils/mathUtils";
import { calculateInventoryLoad } from "../../shared/utils/inventoryUtils";

export interface VitalsSlice {
  hp: {
    current: number;
    baseMax: number;
    temp: number;
    maxBonus: number;
    isInjured: boolean;
    isVeryInjured: boolean;
    autoApplyInjury: boolean;
  };
  sustenance: { current: number };
  insanity: { current: number; volatile: boolean };
  energy: { current: number };
  evilness: number;
  crisis: { state: CrisisState; fails: number; ignore: boolean };

  applyHealing: (amount: number) => void;
  applyDamage: (
    amount: number,
    mitigateMode: "FULL" | "HALF" | "IGNORE",
    armorId: number | null,
  ) => void;

  updateHpTemp: (amount: number) => void;
  addMaxHpBonus: (amount: number) => void;
  updateInsanity: (current: number) => void;
  updateSustenance: (current: number) => void;
  updateEnergy: (current: number) => void;
  consumeEnergy: (amount: number) => void;
  updateEvilness: (val: number) => void;
  updateCrisis: (data: Partial<VitalsSlice["crisis"]>) => void;
  setManualInjury: (type: "isInjured" | "isVeryInjured", val: boolean) => void;
  toggleAutoInjury: () => void;
  toggleVolatilePsyche: () => void;
  processDirectAction: (action: InstantAction) => void;
}

const sanitizeNumber = (
  val: string | number | undefined | null,
  fallback: number,
): number => {
  const parsed = Number(val);
  return isNaN(parsed) ? fallback : parsed;
};

const getSafeEnergyCurrent = (state: CharacterStore): number => {
  let current = NaN;
  if (
    typeof state.energy === "object" &&
    state.energy !== null &&
    "current" in state.energy
  ) {
    current = Number(state.energy.current);
  }

  const agi = Math.floor(
    ((state.attributes?.dexterity || 0) + (state.attributes?.instinct || 0)) /
      2,
  );
  const ap = 1 + Math.floor(agi / 3);
  const slots = 4 + ap;
  const max = slots * 3;

  if (!isNaN(current)) return current;

  if (state.energy === ("exhausted" as unknown)) return slots;
  if (state.energy === ("tired" as unknown)) return slots * 2;
  return max;
};

const getEnergyCap = (
  state: CharacterStore,
  sustenanceValue: number,
): number => {
  const mass =
    (state.attributes.strength || 0) + (state.attributes.constitution || 0);
  const maxSustenance = VG_CONFIG.rules.baseSustenance + mass;
  const sustStages = buildSustenanceStages(maxSustenance);

  const agi = Math.floor(
    ((state.attributes?.dexterity || 0) + (state.attributes?.instinct || 0)) /
      2,
  );
  const ap = 1 + Math.floor(agi / 3);
  const slotsPerStage = 4 + ap;

  if (sustenanceValue <= sustStages[0] - 1) return slotsPerStage;
  if (sustenanceValue <= sustStages[0] - 1 + sustStages[1])
    return slotsPerStage * 2;
  return slotsPerStage * 3;
};

export const createVitalsSlice: StateCreator<
  CharacterStore,
  [],
  [],
  VitalsSlice
> = (set, get) => ({
  hp: {
    current: 65,
    baseMax: 0,
    temp: 0,
    maxBonus: 0,
    isInjured: false,
    isVeryInjured: false,
    autoApplyInjury: true,
  },
  sustenance: { current: 0 },
  insanity: { current: 0, volatile: false },
  energy: { current: 15 },
  evilness: 0,
  crisis: { state: null, fails: 0, ignore: false },

  applyHealing: (amount) =>
    set((state) => ({
      hp: {
        ...state.hp,
        current: Math.min(
          state.hp.baseMax + state.hp.maxBonus,
          sanitizeNumber(state.hp.current, 65) +
            +Math.abs(sanitizeNumber(amount, 0)),
        ),
      },
    })),

  addMaxHpBonus: (amount) =>
    set((state) => ({
      hp: {
        ...state.hp,
        maxBonus: state.hp.maxBonus + sanitizeNumber(amount, 0),
        current:
          sanitizeNumber(state.hp.current, 65) + sanitizeNumber(amount, 0),
      },
    })),

  applyDamage: (amount, mitigateMode, armorId) => {
    const state = get();
    let finalDamage = Math.abs(sanitizeNumber(amount, 0));

    if (mitigateMode !== "IGNORE" && armorId) {
      const armor = state.inventory.find((i) => i.id === armorId);
      if (armor && "armorProps" in armor && armor.armorProps) {
        let rd = armor.armorProps.rd;
        if (mitigateMode === "HALF") rd = Math.floor(rd / 2);

        const effectiveBlock = Math.min(finalDamage, rd, armor.armorProps.pe);
        finalDamage -= effectiveBlock;

        state.updateInventoryItem(armorId, "armorProps", {
          ...armor.armorProps,
          pe: armor.armorProps.pe - effectiveBlock,
        });
      }
    }

    set((s) => {
      let remainingDamage = finalDamage;
      let newTemp = sanitizeNumber(s.hp.temp, 0);
      const maxHp = s.hp.baseMax + s.hp.maxBonus;

      let newCurrent = Math.min(sanitizeNumber(s.hp.current, 65), maxHp);

      if (newTemp > 0) {
        if (newTemp >= remainingDamage) {
          newTemp -= remainingDamage;
          remainingDamage = 0;
        } else {
          remainingDamage -= newTemp;
          newTemp = 0;
        }
      }

      if (remainingDamage > 0) {
        newCurrent = Math.max(0, newCurrent - remainingDamage);
      }
      let crisis = s.crisis;
      if (newCurrent === 0) {
        crisis = { state: "DEATH", fails: 0, ignore: false };
      }

      return { hp: { ...s.hp, temp: newTemp, current: newCurrent }, crisis };
    });
  },

  updateHpTemp: (amount) =>
    set((state) => ({
      hp: { ...state.hp, temp: Math.max(0, sanitizeNumber(amount, 0)) },
    })),
  updateInsanity: (current) =>
    set((state) => ({
      insanity: { ...state.insanity, current: sanitizeNumber(current, 0) },
    })),

  updateSustenance: (current) =>
    set((state) => {
      const newSustenance = Math.max(0, sanitizeNumber(current, 0));
      const cap = getEnergyCap(state, newSustenance);
      return {
        sustenance: { ...state.sustenance, current: newSustenance },
        energy: { current: Math.min(getSafeEnergyCurrent(state), cap) },
      };
    }),

  updateEnergy: (current) =>
    set((state) => {
      const cap = getEnergyCap(state, state.sustenance.current);
      return {
        energy: {
          current: Math.min(cap, Math.max(0, sanitizeNumber(current, 0))),
        },
      };
    }),

  consumeEnergy: (amount) =>
    set((state) => {
      const cap = getEnergyCap(state, state.sustenance.current);
      const actualEnergy = Math.min(getSafeEnergyCurrent(state), cap);
      return {
        energy: {
          current: Math.max(0, actualEnergy - sanitizeNumber(amount, 0)),
        },
      };
    }),

  updateEvilness: (val) => set({ evilness: sanitizeNumber(val, 0) }),
  updateCrisis: (data) =>
    set((state) => ({ crisis: { ...state.crisis, ...data } })),
  setManualInjury: (type, val) =>
    set((state) => {
      const update =
        type === "isInjured"
          ? { ...state.hp, isInjured: val, isVeryInjured: false }
          : { ...state.hp, isVeryInjured: val, isInjured: false };

      return { hp: update };
    }),
  toggleAutoInjury: () =>
    set((state) => ({
      hp: { ...state.hp, autoApplyInjury: !state.hp.autoApplyInjury },
    })),
  toggleVolatilePsyche: () =>
    set((state) => ({
      insanity: { ...state.insanity, volatile: !state.insanity.volatile },
    })),

  processDirectAction: (act) => {
    const state = get();
    const safeActVal = Math.abs(sanitizeNumber(act.val, 0));

    const agi = Math.floor(
      ((state.attributes?.dexterity || 0) + (state.attributes?.instinct || 0)) /
        2,
    );
    const ap = 1 + Math.floor(agi / 3);
    const slotsPerStage = 4 + ap;

    switch (act.target) {
      case "HP_HEAL":
        state.applyHealing(safeActVal);
        break;

      case "HP_DRAIN":
        state.applyDamage(safeActVal, "IGNORE", null);
        break;

      case "HP_TEMP":
        state.updateHpTemp(state.hp.temp + safeActVal);
        break;

      case "ENERGY_STAGE_RESTORE":
        state.updateEnergy(state.energy.current + slotsPerStage);
        break;

      case "ENERGY_STAGE_DRAIN":
        state.consumeEnergy(slotsPerStage);
        break;

      case "ENERGY_USES_DRAIN":
        state.consumeEnergy(safeActVal);
        break;

      case "ENERGY_USES_RESTORE": {
        let remainingVal = safeActVal;
        let currentEnergy = state.energy.current;

        const mass =
          (state.attributes.strength || 0) +
          (state.attributes.constitution || 0);
        const maxSustenance = VG_CONFIG.rules.baseSustenance + mass;
        const sustStages = buildSustenanceStages(maxSustenance);

        let energyCap = slotsPerStage * 3;
        if (state.sustenance.current <= sustStages[0] - 1)
          energyCap = slotsPerStage;
        else if (state.sustenance.current <= sustStages[0] - 1 + sustStages[1])
          energyCap = slotsPerStage * 2;

        while (remainingVal > 0 && currentEnergy < energyCap) {
          if (
            currentEnergy === slotsPerStage ||
            currentEnergy === slotsPerStage * 2
          ) {
            remainingVal = Math.floor(remainingVal / 2);
            if (remainingVal <= 0) break;
          }
          let nextBoundary = energyCap;
          if (currentEnergy < slotsPerStage) nextBoundary = slotsPerStage;
          else if (currentEnergy < slotsPerStage * 2)
            nextBoundary = slotsPerStage * 2;

          const spaceInStage = nextBoundary - currentEnergy;
          const pointsToTake = Math.min(spaceInStage, remainingVal);

          currentEnergy += pointsToTake;
          remainingVal -= pointsToTake;
        }
        state.updateEnergy(currentEnergy);
        break;
      }

      case "SUSTENANCE_ADD":
      case "SUSTENANCE_DRAIN": {
        const { isOverweight } = calculateInventoryLoad(
          state.inventory,
          state.attributes.strength || 0,
          state.attributes.constitution || 0,
        );

        let effectiveVal = safeActVal;
        if (isOverweight) {
          if (act.target === "SUSTENANCE_ADD")
            effectiveVal = Math.max(1, Math.floor(effectiveVal / 2));
          if (act.target === "SUSTENANCE_DRAIN") effectiveVal *= 2;
        }

        let newSustenance = state.sustenance.current;
        if (act.target === "SUSTENANCE_ADD") newSustenance += effectiveVal;
        if (act.target === "SUSTENANCE_DRAIN") newSustenance -= effectiveVal;

        const mass =
          (state.attributes.strength || 0) +
          (state.attributes.constitution || 0);
        const maxSustenance = VG_CONFIG.rules.baseSustenance + mass;

        if (newSustenance < 0) {
          const deficit = Math.abs(newSustenance);
          const hpDamage = deficit * VG_CONFIG.rules.starvationHpDamagePerPoint;
          state.updateSustenance(0);
          state.applyDamage(hpDamage, "IGNORE", null);
        } else if (newSustenance > maxSustenance) {
          const excess = newSustenance - maxSustenance;
          const tempPerPoint = Math.max(
            1,
            Math.floor((state.attributes.constitution || 0) / 2),
          );
          const tempHpAdded = Math.min(
            excess * tempPerPoint,
            (state.attributes.constitution || 0) * 2,
          );
          state.updateSustenance(maxSustenance);
          state.updateHpTemp(state.hp.temp + tempHpAdded);
        } else {
          state.updateSustenance(newSustenance);
        }
        break;
      }

      case "EVILNESS_ADD":
        state.updateEvilness(state.evilness + safeActVal);
        break;

      case "EVILNESS_SUB":
        state.updateEvilness(Math.max(0, state.evilness - safeActVal));
        break;

      case "INSANITY_ADD": {
        const mentalHealth = Math.floor(
          ((state.attributes.intelligence || 0) +
            (state.attributes.wisdom || 0)) /
            2,
        );
        const maxInsanity = VG_CONFIG.rules.baseInsanity + mentalHealth;
        const newTotal = state.insanity.current + safeActVal;

        if (newTotal >= maxInsanity) {
          state.updateInsanity(maxInsanity);
          state.updateCrisis({ state: "COLLAPSE", fails: 0, ignore: false });
        } else {
          state.updateInsanity(newTotal);
        }
        break;
      }

      case "INSANITY_DRAIN":
        state.updateInsanity(Math.max(0, state.insanity.current - safeActVal));
        break;
    }
  },
});
