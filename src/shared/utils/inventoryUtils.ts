import { VG_CONFIG } from "../config/system.config";
import type { Item } from "../types/veil-grey";

export const calculateInventoryLoad = (
  inventory: Item[],
  strength: number = 0,
  constitution: number = 0,
) => {
  const mass = strength + constitution;
  const maxLoad = VG_CONFIG.rules.baseLoad + mass;

  const currentLoad = inventory.reduce((total, item) => {
    if (!item.isCarried || item.parentId !== null) return total;

    const itemTotalSlots = item.slots * item.quantity;
    const hasProps =
      (item.type === "CONTAINER" || item.type === "EQUIPABLE") &&
      item.containerProps;

    if (hasProps && item.containerProps) {
      const inside = inventory
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

  return {
    currentLoad,
    maxLoad,
    isOverweight: currentLoad > maxLoad,
  };
};
