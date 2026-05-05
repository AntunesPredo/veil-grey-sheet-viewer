import { useMemo } from "react";
import { useCharacterStore } from "../../features/character/store";
import { VG_CONFIG } from "../config/system.config";
import { buildInsanityStages, buildSustenanceStages } from "../utils/mathUtils";
import type {
  SustenanceState,
  InsanityState,
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

    const isInitialCreation = hp.baseMax === 0;
    const resolvedBaseHp = isInitialCreation
      ? rules.baseHp + attributes.constitution * 4
      : hp.baseMax;

    const maxHp: number = resolvedBaseHp + (hp.maxBonus || 0);

    const maxInsanity = rules.baseInsanity + secondaryAttributes.mental_health;
    const maxSustenance = rules.baseSustenance + secondaryAttributes.mass;
    const maxLoad = rules.baseLoad + secondaryAttributes.mass;

    const currentLoad = inventory.reduce((total, item) => {
      if (!item.isCarried || item.parentId !== null) return total;
      const itemTotalSlots = item.slots * item.quantity;
      const hasProps =
        (item.type === "CONTAINER" || item.type === "EQUIPABLE") &&
        item.containerProps;

      if (hasProps && item.containerProps) {
        const props = item.containerProps;
        const inside = inventory
          .filter((i) => i.parentId === item.id && i.isCarried)
          .reduce((s, i) => s + i.slots * i.quantity, 0);

        let activeRed = 0;
        if (item.type === "CONTAINER") {
          activeRed = Math.min(props.slotReduction, inside);
        } else if (item.type === "EQUIPABLE") {
          activeRed = item.isEquipped
            ? Math.min(props.slotReduction, inside)
            : 0;
        }
        return total + itemTotalSlots + (inside - activeRed);
      }

      if (item.type === "RECHARGEABLE") {
        const reductionPerUnit = item.perItemSlotReduction || 0;
        const inside = inventory
          .filter((i) => i.parentId === item.id && i.isCarried)
          .reduce((s, i) => {
            const reducedSlotPerUnit = Math.max(0, i.slots - reductionPerUnit);
            return s + reducedSlotPerUnit * i.quantity;
          }, 0);
        return total + itemTotalSlots + inside;
      }

      return total + itemTotalSlots;
    }, 0);

    const isOverweight = currentLoad > maxLoad;

    const actualHp = Math.min(hp.current, maxHp);
    const hpPorc = maxHp === 0 ? 0 : (actualHp / maxHp) * 100;

    const isInjured = hp.autoApplyInjury
      ? hpPorc <= rules.thresholdInjured
      : hp.isInjured;
    const isVeryInjured = hp.autoApplyInjury
      ? hpPorc <= rules.thresholdCrit
      : hp.isVeryInjured;

    let sustenanceState: SustenanceState = "FULL";
    const sustanceStages = buildSustenanceStages(maxSustenance);
    if (sustenance.current <= sustanceStages[0] - 1)
      sustenanceState = "STARVING";
    else if (sustenance.current <= sustanceStages[0] - 1 + sustanceStages[1])
      sustenanceState = "HUNGRY";
    else if (
      sustenance.current <=
      sustanceStages[0] - 1 + sustanceStages[1] + sustanceStages[2]
    )
      sustenanceState = "SATIATED";

    let insanityState: InsanityState = "STABLE";
    const insStages = buildInsanityStages(maxInsanity, insanity.volatile);

    if (insanity.current >= insStages[0] + insStages[1]) {
      insanityState = "INSANE";
    } else if (insanity.current >= insStages[0]) {
      insanityState = "UNSTABLE";
    }

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

    // 1. HEALTH
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

    // 2. MADNESS
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
      const descGeral = "[INDIVÍDUO DESFUNCIONAL]";
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

    // // 4. ENERGY
    // if (energy === "tired") {
    //   const desc = "[SISTEMA: CANSADO]";
    //   addSysEffect("ATT_PHYSICAL", -2, desc);
    //   addSysEffect("SKILL_PHYSICAL", -2, desc);
    //   addSysEffect("ATT_SOCIAL", -1, desc);
    //   addSysEffect("SKILL_SOCIAL", -1, desc);
    // } else if (energy === "exhausted") {
    //   const desc = "[SISTEMA: EXAUSTO]";
    //   addSysEffect("ATT_PHYSICAL", -3, desc);
    //   addSysEffect("SKILL_PHYSICAL", -3, desc);
    //   addSysEffect("ATT_SOCIAL", -2, desc);
    //   addSysEffect("SKILL_SOCIAL", -2, desc);
    //   addSysEffect("ATT_MENTAL", -2, desc);
    //   addSysEffect("SKILL_MENTAL", -2, desc);
    // }

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
      systemEffects,
    };
  }, [attributes, inventory, hp, sustenance, energy, insanity]);
}
