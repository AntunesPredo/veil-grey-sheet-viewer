import { useCharacterStore } from "../../features/character/store";
import { useCharacterStats } from "./useCharacterStats";
import type { CustomEffect } from "../types/veil-grey";

export function useActiveModifiers() {
  const customEffects = useCharacterStore((state) => state.customEffects);
  const inventory = useCharacterStore((state) => state.inventory);

  const { systemEffects } = useCharacterStats();

  const equippedItemEffects: CustomEffect[] = inventory
    .filter((i) => i.isEquipped)
    .flatMap(
      (i) =>
        i.effects?.filter((e) => e.mode === "FIXED" || e.mode === "BONUS") ||
        [],
    );

  const activeEffects = [
    ...customEffects,
    ...equippedItemEffects,
    ...systemEffects,
  ];

  const getTargetSum = (target: string): number => {
    return activeEffects
      .filter(
        (e) =>
          e.target === target &&
          e.mode !== "OPTIONAL" &&
          e.mode !== "BONUS" &&
          !e.isAccounted,
      )
      .reduce((sum, e) => sum + e.val, 0);
  };

  const getBonusSum = (target: string): number => {
    return activeEffects
      .filter(
        (e) => e.target === target && e.mode === "BONUS" && !e.isAccounted,
      )
      .reduce((sum, e) => sum + e.val, 0);
  };

  const getAttrMod = (attrId: string, categoryId: string) => {
    return getTargetSum(attrId) + getTargetSum(categoryId);
  };

  const getSkillMod = (skillId: string, categoryId: string) => {
    return getTargetSum(skillId) + getTargetSum(categoryId);
  };

  return {
    activeEffects,
    getTargetSum,
    getBonusSum,
    getAttrMod,
    getSkillMod,
  };
}
