import { useMemo } from "react";
import { useCharacterStore } from "../../features/character/store";
import { VG_CONFIG } from "../config/system.config";
import { buildInsanityStages, buildSustenanceStages } from "../utils/mathUtils";
import { calculateInventoryLoad } from "../utils/inventoryUtils";
import type {
  SustenanceState,
  InsanityState,
  EnergyState,
  CustomEffectTarget,
  CustomEffect,
} from "../types/veil-grey";

export function useCharacterStats() {
  const attributes = useCharacterStore((state) => state.attributes);
  const inventory = useCharacterStore((state) => state.inventory);
  const hp = useCharacterStore((state) => state.hp);
  const sustenance = useCharacterStore((state) => state.sustenance);
  const energy = useCharacterStore((state) => state.energy);
  const insanity = useCharacterStore((state) => state.insanity);
  const customEffects = useCharacterStore((state) => state.customEffects);

  return useMemo(() => {
    const rules = VG_CONFIG.rules;

    const secondaryAttributes = {
      agility: Math.floor((attributes.dexterity + attributes.instinct) / 2),
      mass: attributes.strength + attributes.constitution,
      mental_health: Math.floor(
        (attributes.intelligence + attributes.wisdom) / 2,
      ),
      perception: Math.floor(
        (attributes.intelligence + attributes.instinct) / 2,
      ),
    };

    const activeEffects = [
      ...customEffects,
      ...inventory
        .filter((i) => i.isEquipped)
        .flatMap((i) => i.effects?.filter((e) => e.mode === "FIXED") || []),
    ];

    const getTargetSum = (target: string) =>
      activeEffects
        .filter((e) => e.target === target && e.mode !== "OPTIONAL")
        .reduce((sum, e) => sum + e.val, 0);

    const apMod = getTargetSum("ACTION_POINTS");
    const rxMod = getTargetSum("REACTIONS");
    const movMod = getTargetSum("MOVEMENT");

    const baseAp = 1 + Math.floor(secondaryAttributes.agility / 3);
    const baseRx = 1 + Math.floor(secondaryAttributes.agility / 4);
    const baseMov = Math.max(1, Math.floor(secondaryAttributes.agility / 2));

    const actionPoints = Math.max(1, baseAp + apMod);
    const reactions = Math.max(0, baseRx + rxMod);
    const movement = Math.max(1, baseMov + movMod);

    const safeHpBaseMax = isNaN(Number(hp.baseMax)) ? 0 : Number(hp.baseMax);
    const safeHpCurrent = isNaN(Number(hp.current)) ? 0 : Number(hp.current);
    const safeHpMaxBonus = isNaN(Number(hp.maxBonus)) ? 0 : Number(hp.maxBonus);
    const safeSustenance = isNaN(Number(sustenance.current))
      ? 0
      : Number(sustenance.current);
    const safeInsanity = isNaN(Number(insanity.current))
      ? 0
      : Number(insanity.current);

    const isInitialCreation = safeHpBaseMax === 0;
    const resolvedBaseHp = isInitialCreation
      ? rules.baseHp + attributes.constitution * 4
      : safeHpBaseMax;

    const maxHp: number = resolvedBaseHp + safeHpMaxBonus;

    const maxInsanity = rules.baseInsanity + secondaryAttributes.mental_health;
    const maxSustenance = rules.baseSustenance + secondaryAttributes.mass;

    const { currentLoad, maxLoad, isOverweight } = calculateInventoryLoad(
      inventory,
      attributes.strength,
      attributes.constitution,
    );

    const actualHp = Math.min(safeHpCurrent, maxHp);
    const hpPorc = maxHp === 0 ? 0 : (actualHp / maxHp) * 100;

    const isInjured = hp.autoApplyInjury
      ? hpPorc <= rules.thresholdInjured
      : hp.isInjured;
    const isVeryInjured = hp.autoApplyInjury
      ? hpPorc <= rules.thresholdCrit
      : hp.isVeryInjured;

    let sustenanceState: SustenanceState = "FULL";
    const sustanceStages = buildSustenanceStages(maxSustenance);
    if (safeSustenance <= sustanceStages[0] - 1) sustenanceState = "STARVING";
    else if (safeSustenance <= sustanceStages[0] - 1 + sustanceStages[1])
      sustenanceState = "HUNGRY";
    else if (
      safeSustenance <=
      sustanceStages[0] - 1 + sustanceStages[1] + sustanceStages[2]
    )
      sustenanceState = "SATIATED";

    let insanityState: InsanityState = "STABLE";
    const insStages = buildInsanityStages(maxInsanity, insanity.volatile);

    if (safeInsanity >= insStages[0] + insStages[1]) {
      insanityState = "INSANE";
    } else if (safeInsanity >= insStages[0]) {
      insanityState = "UNSTABLE";
    }

    const slotsPerStage = 4 + actionPoints;
    const maxEnergy = slotsPerStage * 3;

    const rawEnergyCurrent =
      typeof energy === "object" &&
      energy !== null &&
      "current" in energy &&
      !isNaN(Number(energy.current))
        ? Number(energy.current)
        : maxEnergy;

    let energyCap = maxEnergy;
    if (sustenanceState === "STARVING") energyCap = slotsPerStage;
    else if (sustenanceState === "HUNGRY") energyCap = slotsPerStage * 2;

    const actualEnergy = Math.min(rawEnergyCurrent, energyCap);

    let energyState: EnergyState = "RESTED";
    if (actualEnergy <= slotsPerStage) energyState = "EXHAUSTED";
    else if (actualEnergy <= slotsPerStage * 2) energyState = "TIRED";

    const systemEffects: CustomEffect[] = [];
    let effectIdCounter = 9000;

    const addSysEffect = (
      target: CustomEffectTarget,
      val: number,
      desc: string,
    ) => {
      systemEffects.push({
        id: effectIdCounter++,
        link: "SYS",
        mode: "FIXED",
        target,
        description: desc,
        val,
      });
    };

    if (isVeryInjured) {
      const desc = "[LESÃO: MUITO MACHUCADO]";
      addSysEffect("ATT_PHYSICAL", -4, desc);
      addSysEffect("SKILL_PHYSICAL", -4, desc);
      addSysEffect("ATT_MENTAL", -4, desc);
      addSysEffect("SKILL_MENTAL", -4, desc);
      addSysEffect("ATT_SOCIAL", -4, desc);
      addSysEffect("SKILL_SOCIAL", -4, desc);
    } else if (isInjured) {
      const desc = "[LESÃO: MACHUCADO]";
      addSysEffect("ATT_PHYSICAL", -2, desc);
      addSysEffect("SKILL_PHYSICAL", -2, desc);
      addSysEffect("ATT_MENTAL", -2, desc);
      addSysEffect("SKILL_MENTAL", -2, desc);
      addSysEffect("ATT_SOCIAL", -2, desc);
      addSysEffect("SKILL_SOCIAL", -2, desc);
    }

    if (insanityState === "UNSTABLE") {
      const desc = "[MENTE INSTÁVEL]";
      addSysEffect("instinct", -1, desc);
      addSysEffect("intelligence", -1, desc);
      addSysEffect("perception", -2, desc);
    } else if (insanityState === "INSANE") {
      const descObj = "[MENTE INSANA]";
      addSysEffect("instinct", -2, descObj);
      addSysEffect("intelligence", -2, descObj);
      addSysEffect("wisdom", -2, descObj);
      const descGeral = "[MENTE COLAPSANDO]";
      addSysEffect("ATT_PHYSICAL", -2, descGeral);
      addSysEffect("SKILL_PHYSICAL", -2, descGeral);
      addSysEffect("ATT_MENTAL", -2, descGeral);
      addSysEffect("SKILL_MENTAL", -2, descGeral);
      addSysEffect("ATT_SOCIAL", -2, descGeral);
      addSysEffect("SKILL_SOCIAL", -2, descGeral);
    }

    if (sustenanceState === "FULL") {
      const desc = "[METABOLISMO PERFEITO]";
      addSysEffect("ATT_PHYSICAL", 1, desc);
      addSysEffect("ATT_MENTAL", 1, desc);
    } else if (sustenanceState === "HUNGRY") {
      const desc = "[DEFICIÊNCIA CALÓRICA]";
      addSysEffect("ATT_PHYSICAL", -1, desc);
      addSysEffect("ATT_MENTAL", -1, desc);
    } else if (sustenanceState === "STARVING") {
      const desc = "[INANIÇÃO]";
      addSysEffect("ATT_PHYSICAL", -2, desc);
      addSysEffect("ATT_MENTAL", -2, desc);
    }

    if (energyState === "TIRED") {
      const desc = "[SISTEMA: CANSADO]";
      addSysEffect("ATT_PHYSICAL", -2, desc);
      addSysEffect("SKILL_PHYSICAL", -2, desc);
      addSysEffect("ATT_SOCIAL", -1, desc);
      addSysEffect("SKILL_SOCIAL", -1, desc);
    } else if (energyState === "EXHAUSTED") {
      const desc = "[SISTEMA: EXAUSTO]";
      addSysEffect("ATT_PHYSICAL", -3, desc);
      addSysEffect("SKILL_PHYSICAL", -3, desc);
      addSysEffect("ATT_SOCIAL", -2, desc);
      addSysEffect("SKILL_SOCIAL", -2, desc);
      addSysEffect("ATT_MENTAL", -2, desc);
      addSysEffect("SKILL_MENTAL", -2, desc);
    }

    const thresholdStarving = sustanceStages[0] - 1;
    const thresholdHungry = thresholdStarving + sustanceStages[1];
    let minSustenanceAllowed = 0;

    if (safeSustenance > thresholdHungry) {
      minSustenanceAllowed = thresholdHungry + 1;
    } else if (safeSustenance > thresholdStarving) {
      minSustenanceAllowed = thresholdStarving + 1;
    }

    const availableSustenanceToSpend = Math.max(
      0,
      safeSustenance - minSustenanceAllowed,
    );

    return {
      secondaryAttributes,
      maxHp,
      actualHp,
      maxInsanity,
      maxSustenance,
      maxLoad,
      currentLoad,
      isOverweight,
      isInjured,
      isVeryInjured,
      sustenanceState,
      sustanceStages,
      insanityState,
      insStages,
      actionPoints,
      apMod,
      reactions,
      rxMod,
      movement,
      movMod,
      slotsPerStage,
      maxEnergy,
      energyState,
      energyCap,
      actualEnergy,
      availableSustenanceToSpend,
      systemEffects,
    };
  }, [attributes, inventory, hp, sustenance, energy, insanity, customEffects]);
}
