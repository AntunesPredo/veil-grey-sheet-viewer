import type { StateCreator } from "zustand";
import type { CharacterStore } from "../character/store";
import type { CrisisState, InstantAction } from "../../shared/types/veil-grey";
import { VG_CONFIG } from "../../shared/config/system.config";
import { buildSustenanceStages } from "../../shared/utils/mathUtils";

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

const calculateOverweight = (state: CharacterStore) => {
  const mass =
    (state.attributes.strength || 0) + (state.attributes.constitution || 0);
  const maxLoad = VG_CONFIG.rules.baseLoad + mass;

  const currentLoad = state.inventory.reduce((total, item) => {
    if (!item.isCarried || item.parentId !== null) return total;
    const itemTotalSlots = item.slots * item.quantity;
    const hasProps =
      (item.type === "CONTAINER" || item.type === "EQUIPABLE") &&
      item.containerProps;

    if (hasProps && item.containerProps) {
      const inside = state.inventory
        .filter((i) => i.parentId === item.id && i.isCarried)
        .reduce((s, i) => s + i.slots * i.quantity, 0);

      let activeRed = 0;
      if (item.type === "CONTAINER") {
        activeRed = Math.min(item.containerProps.slotReduction, inside);
      } else if (item.type === "EQUIPABLE") {
        activeRed = item.isEquipped
          ? Math.min(item.containerProps.slotReduction, inside)
          : 0;
      }
      return total + itemTotalSlots + (inside - activeRed);
    }

    if (item.type === "RECHARGEABLE") {
      const reductionPerUnit = item.perItemSlotReduction || 0;
      const inside = state.inventory
        .filter((i) => i.parentId === item.id && i.isCarried)
        .reduce((s, i) => {
          const reducedSlotPerUnit = Math.max(0, i.slots - reductionPerUnit);
          return s + reducedSlotPerUnit * i.quantity;
        }, 0);
      return total + itemTotalSlots + inside;
    }

    return total + itemTotalSlots;
  }, 0);

  return currentLoad > maxLoad;
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
          sanitizeNumber(state.hp.current, 65) + sanitizeNumber(amount, 0),
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
    let finalDamage = sanitizeNumber(amount, 0);

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
    set((state) => {
      const updatedHp = {
        ...state.hp,
        current: sanitizeNumber(state.hp.current, 65),
        temp: sanitizeNumber(state.hp.temp, 0),
      };
      const updatedSustenance = {
        ...state.sustenance,
        current: sanitizeNumber(state.sustenance.current, 0),
      };
      let updatedEnergyVal = getSafeEnergyCurrent(state);
      let updatedEvilness = sanitizeNumber(state.evilness, 0);

      const safeActVal = sanitizeNumber(act.val, 0);

      if (act.target === "HP_HEAL")
        updatedHp.current = Math.min(
          updatedHp.baseMax + updatedHp.maxBonus,
          updatedHp.current + safeActVal,
        );
      if (act.target === "HP_DRAIN")
        updatedHp.current = Math.max(0, updatedHp.current - safeActVal);
      if (act.target === "HP_TEMP") updatedHp.temp += safeActVal;

      const agi = Math.floor(
        ((state.attributes?.dexterity || 0) +
          (state.attributes?.instinct || 0)) /
          2,
      );
      const ap = 1 + Math.floor(agi / 3);
      const slotsPerStage = 4 + ap;

      const mass =
        (state.attributes.strength || 0) + (state.attributes.constitution || 0);
      const maxSustenance = VG_CONFIG.rules.baseSustenance + mass;

      const energyCap = getEnergyCap(state, updatedSustenance.current);

      if (act.target === "ENERGY_STAGE_RESTORE") {
        updatedEnergyVal = Math.min(
          energyCap,
          updatedEnergyVal + slotsPerStage,
        );
      } else if (act.target === "ENERGY_STAGE_DRAIN") {
        updatedEnergyVal = Math.max(0, updatedEnergyVal - slotsPerStage);
      } else if (act.target === "ENERGY_USES_DRAIN") {
        updatedEnergyVal = Math.max(0, updatedEnergyVal - safeActVal);
      } else if (act.target === "ENERGY_USES_RESTORE") {
        let remainingVal = safeActVal;

        while (remainingVal > 0 && updatedEnergyVal < energyCap) {
          if (
            updatedEnergyVal === slotsPerStage ||
            updatedEnergyVal === slotsPerStage * 2
          ) {
            remainingVal = Math.floor(remainingVal / 2);
            if (remainingVal <= 0) break;
          }

          let nextBoundary = energyCap;
          if (updatedEnergyVal < slotsPerStage) {
            nextBoundary = slotsPerStage;
          } else if (updatedEnergyVal < slotsPerStage * 2) {
            nextBoundary = slotsPerStage * 2;
          }

          const spaceInStage = nextBoundary - updatedEnergyVal;
          const pointsToTake = Math.min(spaceInStage, remainingVal);

          updatedEnergyVal += pointsToTake;
          remainingVal -= pointsToTake;
        }
      }

      if (
        act.target === "SUSTENANCE_ADD" ||
        act.target === "SUSTENANCE_DRAIN"
      ) {
        const isOverweight = calculateOverweight(state);
        let effectiveVal = safeActVal;

        if (isOverweight) {
          if (act.target === "SUSTENANCE_ADD")
            effectiveVal = Math.max(1, Math.floor(effectiveVal / 2));
          if (act.target === "SUSTENANCE_DRAIN")
            effectiveVal = effectiveVal * 2;
        }

        let newSustenance = updatedSustenance.current;

        if (act.target === "SUSTENANCE_ADD") newSustenance += effectiveVal;
        if (act.target === "SUSTENANCE_DRAIN") newSustenance -= effectiveVal;

        if (newSustenance < 0) {
          const deficit = Math.abs(newSustenance);
          const hpDamage = deficit * VG_CONFIG.rules.starvationHpDamagePerPoint;
          updatedHp.current = Math.max(0, updatedHp.current - hpDamage);
          newSustenance = 0;
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
          updatedHp.temp += tempHpAdded;
          newSustenance = maxSustenance;
        }
        updatedSustenance.current = newSustenance;
      }

      if (act.target === "EVILNESS_ADD")
        updatedEvilness = Math.min(10, updatedEvilness + safeActVal);
      if (act.target === "EVILNESS_SUB")
        updatedEvilness = Math.max(0, updatedEvilness - safeActVal);

      const finalEnergyCap = getEnergyCap(state, updatedSustenance.current);
      updatedEnergyVal = Math.min(updatedEnergyVal, finalEnergyCap);

      return {
        hp: updatedHp,
        sustenance: updatedSustenance,
        energy: { current: updatedEnergyVal },
        evilness: updatedEvilness,
      };
    });
  },
});
