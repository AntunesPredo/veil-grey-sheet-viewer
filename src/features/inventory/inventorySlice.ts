import type { StateCreator } from "zustand";
import type { CharacterStore } from "../character/store";
import type {
  ActiveItem,
  ConsumableItem,
  ContainerItem,
  CustomEffect,
  EquipableItem,
  InstantAction,
  Item,
} from "../../shared/types/veil-grey";

export interface InventorySlice {
  inventory: Item[];

  addInventoryItem: (item: Item) => void;
  updateInventoryItem: (
    id: number,
    field: keyof EquipableItem | keyof Item,
    val: Item[keyof Item] | EquipableItem[keyof EquipableItem],
  ) => void;
  deleteInventoryItem: (id: number) => void;
  reorderInventoryItem: (activeId: number, overId: number) => void;
  moveInventoryItem: (
    itemId: number,
    targetContainerId: number | null,
    drawerName?: string | null,
  ) => { success: boolean; message: string };
  toggleEquipItem: (id: number) => void;
  splitInventoryItem: (
    id: number,
    mode: "SINGLE" | "TOTAL",
    divisor: number,
  ) => void;
  mergeInventoryItems: (targetId: number, sourceIds: number[]) => void;
  manageDrawer: (
    containerId: number,
    action: "CREATE" | "RENAME" | "DELETE",
    oldName?: string,
    newName?: string,
  ) => void;

  consumeItem: (id: number) => {
    success: boolean;
    message: string;
    rollData?: { skillId: string | null; loss: number; bonusDamage?: number };
  };
  consumeRechargeable: (id: number) => void;
  repairActiveItem: (id: number, multiplier: number) => { recovered: number };
}

export const createInventorySlice: StateCreator<
  CharacterStore,
  [],
  [],
  InventorySlice
> = (set, get) => ({
  inventory: [],

  addInventoryItem: (item) => {
    set((state) => ({ inventory: [...state.inventory, item] }));
  },

  updateInventoryItem: (id, field, val) => {
    set((state) => {
      let shouldDelete = false;
      const newInventory = state.inventory.map((i) => {
        if (i.id === id) {
          const updatedItem = { ...i, [field]: val };
          if (updatedItem.type === "CONSUMABLE" && updatedItem.uses <= 0)
            shouldDelete = true;
          if (updatedItem.type === "MATERIAL" && updatedItem.quantity <= 0)
            shouldDelete = true;
          return updatedItem;
        }
        return i;
      });

      if (shouldDelete) {
        return {
          inventory: newInventory
            .map((i) => (i.parentId === id ? { ...i, parentId: null } : i))
            .filter((i) => i.id !== id),
        };
      }
      return { inventory: newInventory };
    });
  },

  deleteInventoryItem: (id) => {
    set((state) => ({
      inventory: state.inventory
        .map((i) => (i.parentId === id ? { ...i, parentId: null } : i))
        .filter((i) => i.id !== id),
    }));
  },

  reorderInventoryItem: (activeId, overId) => {
    set((state) => {
      const oldIdx = state.inventory.findIndex((i) => i.id === activeId);
      const newIdx = state.inventory.findIndex((i) => i.id === overId);
      if (oldIdx === -1 || newIdx === -1) return state;
      const newInv = [...state.inventory];
      const [moved] = newInv.splice(oldIdx, 1);
      moved.parentId = state.inventory[newIdx].parentId;
      newInv.splice(newIdx, 0, moved);
      return { inventory: newInv };
    });
  },

  toggleEquipItem: (id) => {
    set((state) => {
      const itemToEquip = state.inventory.find((i) => i.id === id);
      if (!itemToEquip) return state;

      const isEquipping = !itemToEquip.isEquipped;
      const isArmor = "armorProps" in itemToEquip && !!itemToEquip.armorProps;

      return {
        inventory: state.inventory.map((i) => {
          if (i.id === id && i.type === "EQUIPABLE")
            return { ...i, isEquipped: isEquipping };

          if (itemToEquip.type === "ACTIVE" && i.type === "ACTIVE") {
            if (i.id === id) return { ...i, isEquipped: isEquipping };
            if (isEquipping) {
              return { ...i, isEquipped: false };
            }
          }

          if (
            isEquipping &&
            isArmor &&
            i.id !== id &&
            "armorProps" in i &&
            !!i.armorProps
          ) {
            return { ...i, isEquipped: false };
          }

          return i;
        }),
      };
    });
  },

  moveInventoryItem: (itemId, targetId, drawerName = null) => {
    const state = get();
    const item = state.inventory.find((i) => i.id === itemId);
    if (!item) return { success: false, message: "ITEM NÃO ENCONTRADO." };

    if (targetId !== null) {
      const container = state.inventory.find((i) => i.id === targetId);

      if (container?.type === "ACTIVE" && container.requiresAmmo) {
        if (item.type !== "CONSUMABLE" && item.type !== "RECHARGEABLE") {
          return {
            success: false,
            message: "APENAS MUNIÇÃO OU CARREGADORES SÃO ACEITOS.",
          };
        }
        if (item.commsType !== container.commsType) {
          return {
            success: false,
            message: "TIPO DE MUNIÇÃO INCOMPATÍVEL COM O EQUIPAMENTO.",
          };
        }
        set((state) => ({
          inventory: state.inventory.map((i) =>
            i.id === itemId
              ? { ...i, parentId: targetId, drawer: drawerName }
              : i,
          ),
        }));

        return { success: true, message: "ARMAZENADO NO EQUIPAMENTO." };
      }

      if (container?.type === "RECHARGEABLE" || container?.type === "KIT") {
        if (item.type !== "CONSUMABLE")
          return {
            success: false,
            message: "APENAS CONSUMÍVEIS/MUNIÇÃO SÃO ACEITOS.",
          };
        if (item.commsType !== container.commsType)
          return {
            success: false,
            message: "TIPO DE COMUNICAÇÃO/MUNIÇÃO INCOMPATÍVEL.",
          };

        const children = state.inventory.filter(
          (i) => i.parentId === container.id,
        );
        const currentUses = children.reduce((sum, i) => {
          const uses = "uses" in i ? i.uses : 1;
          return sum + uses * i.quantity;
        }, 0);
        const available = container.maxUses - currentUses;

        if (available <= 0)
          return { success: false, message: "COMPARTIMENTO CHEIO." };

        const incomingUsesPerUnit = item.uses;
        const incomingTotalUses = incomingUsesPerUnit * item.quantity;

        if (incomingTotalUses <= available) {
          set((state) => ({
            inventory: state.inventory.map((i) =>
              i.id === itemId
                ? { ...i, parentId: targetId, drawer: drawerName }
                : i,
            ),
          }));
        } else {
          const unitsToMove = Math.floor(available / incomingUsesPerUnit);
          if (unitsToMove <= 0)
            return {
              success: false,
              message: "ESPAÇO INSUFICIENTE PARA UMA UNIDADE COMPLETA.",
            };

          const newItem = {
            ...item,
            id: Date.now() + Math.random(),
            quantity: unitsToMove,
            parentId: targetId,
            drawer: drawerName,
          };
          set((state) => ({
            inventory: state.inventory
              .map((i) =>
                i.id === itemId
                  ? { ...i, quantity: i.quantity - unitsToMove }
                  : i,
              )
              .concat(newItem as Item),
          }));
        }

        return { success: true, message: "RECARGA CONCLUÍDA." };
      }

      const isAbleToContain =
        (container?.type === "CONTAINER" || container?.type === "EQUIPABLE") &&
        !!container.containerProps;

      if (!container || !isAbleToContain)
        return { success: false, message: "ALVO INCOMPATÍVEL." };

      let depth = 1;
      let curr = container;
      const visitedIds = new Set<number>();

      while (curr.parentId !== null) {
        if (visitedIds.has(curr.id)) {
          return {
            success: false,
            message: "FALHA CRÍTICA: REFERÊNCIA CIRCULAR DETECTADA.",
          };
        }
        visitedIds.add(curr.id);

        depth++;
        const parent = state.inventory.find((i) => i.id === curr.parentId);
        if (!parent) break;
        curr = parent as typeof container;
      }

      if (
        item.type !== "RECHARGEABLE" &&
        (item.type === "CONTAINER" ||
          state.inventory.some((i) => i.parentId === itemId)) &&
        depth >= 2
      ) {
        return {
          success: false,
          message: "LIMITE ESTRUTURAL ALCANÇADO (MÁX 2 NÍVEIS).",
        };
      }

      if (isAbleToContain && (container as ContainerItem).containerProps) {
        const used = state.inventory
          .filter((i) => i.parentId === targetId && i.id !== itemId)
          .reduce((sum, i) => sum + i.slots * i.quantity, 0);
        if (
          (container as ContainerItem).containerProps.slotCapacity - used <
          item.slots * item.quantity
        )
          return { success: false, message: "CAPACIDADE EXCEDIDA." };
      }
    }

    set((state) => ({
      inventory: state.inventory.map((i) =>
        i.id === itemId ? { ...i, parentId: targetId, drawer: drawerName } : i,
      ),
    }));

    return { success: true, message: "TRANSFERÊNCIA CONCLUÍDA." };
  },

  splitInventoryItem: (id, mode, divisor) => {
    set((state) => {
      const item = state.inventory.find((i) => i.id === id);
      if (!item || item.quantity <= 1 || divisor <= 0) return state;
      const newItems: Item[] = [];
      let remainingQty = item.quantity;
      if (mode === "SINGLE") {
        if (divisor >= remainingQty) return state;
        remainingQty -= divisor;
        newItems.push({
          ...item,
          id: Date.now() + Math.random(),
          quantity: divisor,
        });
      } else if (mode === "TOTAL") {
        const sizePerStack = Math.floor(remainingQty / divisor);
        if (sizePerStack <= 0) return state;
        const remainder = remainingQty % divisor;
        remainingQty = sizePerStack + remainder;
        for (let i = 1; i < divisor; i++) {
          newItems.push({
            ...item,
            id: Date.now() + i,
            quantity: sizePerStack,
          });
        }
      }
      return {
        inventory: state.inventory
          .map((i) => (i.id === id ? { ...i, quantity: remainingQty } : i))
          .concat(newItems),
      };
    });
  },

  mergeInventoryItems: (targetId, sourceIds) => {
    set((state) => {
      const target = state.inventory.find((i) => i.id === targetId);
      if (!target) return state;
      let extraQty = 0;
      let newDesc = target.description;
      const itemsToRemove = new Set(sourceIds);
      state.inventory.forEach((src) => {
        if (itemsToRemove.has(src.id)) {
          extraQty += src.quantity;
          if (
            src.description &&
            src.description !== target.description &&
            !newDesc.includes(src.description)
          ) {
            newDesc += newDesc
              ? `\n[M. FUSÃO]: ${src.description}`
              : src.description;
          }
        }
      });
      return {
        inventory: state.inventory
          .filter((i) => !itemsToRemove.has(i.id))
          .map((i) =>
            i.id === targetId
              ? {
                  ...i,
                  quantity: i.quantity + extraQty,
                  description: newDesc.trim(),
                }
              : i,
          ),
      };
    });
  },

  manageDrawer: (containerId, action, oldName, newName) => {
    set((state) => {
      const inventory = [...state.inventory];
      const containerIdx = inventory.findIndex((i) => i.id === containerId);
      if (containerIdx === -1) return state;
      const container = inventory[containerIdx] as ContainerItem;
      if (!container.containerProps) return state;
      const drawers = container.containerProps.drawers || [];
      if (action === "CREATE" && newName && !drawers.includes(newName)) {
        container.containerProps = {
          ...container.containerProps,
          drawers: [...drawers, newName],
        };
      } else if (action === "RENAME" && oldName && newName) {
        container.containerProps = {
          ...container.containerProps,
          drawers: drawers.map((d: string) => (d === oldName ? newName : d)),
        };
        inventory.forEach((i) => {
          if (i.parentId === containerId && i.drawer === oldName)
            i.drawer = newName;
        });
      } else if (action === "DELETE" && oldName) {
        container.containerProps = {
          ...container.containerProps,
          drawers: drawers.filter((d: string) => d !== oldName),
        };
        inventory.forEach((i) => {
          if (i.parentId === containerId && i.drawer === oldName)
            i.drawer = null;
        });
      }
      inventory[containerIdx] = container;
      return { inventory };
    });
  },

  consumeItem: (id) => {
    let result: {
      success: boolean;
      message: string;
      rollData?: { skillId: string | null; loss: number; bonusDamage?: number };
    } = { success: false, message: "" };

    const consumedTempEffects: CustomEffect[] = [];
    const consumedActions: InstantAction[] = [];

    set((state) => {
      const item = state.inventory.find((i) => i.id === id);
      if (!item || !("uses" in item)) {
        result = { success: false, message: "ITEM INVÁLIDO." };
        return state;
      }

      let newInventory = [...state.inventory];
      let ammoBonusDamage = 0;

      if (item.effects) {
        consumedTempEffects.push(
          ...item.effects
            .filter((e) => e.mode === "TEMP" || e.mode === "OPTIONAL")
            .map((e) => ({
              ...e,
              id: Date.now() + Math.random(),
              link: `temp_${item.id}`,
            })),
        );
      }

      if ("instantActions" in item && Array.isArray(item.instantActions)) {
        consumedActions.push(...item.instantActions);
      }

      if (item.type === "ACTIVE") {
        const activeItem = item as ActiveItem;

        if (activeItem.uses <= 0) {
          result = {
            success: false,
            message: "EQUIPAMENTO DESTRUÍDO OU SEM CONDIÇÃO.",
          };
          return state;
        }

        if (activeItem.requiresAmmo) {
          const directChildren = state.inventory.filter(
            (i) => i.parentId === activeItem.id,
          );

          let validAmmos = directChildren.filter(
            (i) => i.type === "CONSUMABLE" && i.uses > 0,
          );

          const rechargeables = directChildren.filter(
            (i) => i.type === "RECHARGEABLE",
          );
          rechargeables.forEach((mag) => {
            const magAmmo = state.inventory.filter(
              (i) =>
                i.parentId === mag.id && i.type === "CONSUMABLE" && i.uses > 0,
            );
            validAmmos = validAmmos.concat(magAmmo);
          });

          if (validAmmos.length === 0) {
            result = {
              success: false,
              message: "MUNIÇÃO INSUFICIENTE.",
            };
            return state;
          }

          const ammo = validAmmos.sort((a, b) => {
            if ("uses" in a && "uses" in b) {
              const au = a.uses;
              const bu = b.uses;
              if (au !== bu) return au - bu;
              return a.quantity - b.quantity;
            }
            return 0;
          })[0] as ConsumableItem;

          ammoBonusDamage = ammo.bonusDamage || 0;

          if (ammo.effects) {
            consumedTempEffects.push(
              ...ammo.effects
                .filter((e) => e.mode === "TEMP" || e.mode === "OPTIONAL")
                .map((e) => ({
                  ...e,
                  id: Date.now() + Math.random(),
                  link: `temp_${ammo.id}`,
                })),
            );
          }

          if (ammo.instantActions) {
            consumedActions.push(...ammo.instantActions);
          }

          if (ammo.quantity > 1) {
            if (ammo.uses > 1) {
              const newAmmo = {
                ...ammo,
                id: Date.now() + Math.random(),
                quantity: 1,
                uses: ammo.uses - 1,
              };
              newInventory = newInventory
                .map((i) =>
                  i.id === ammo.id ? { ...i, quantity: i.quantity - 1 } : i,
                )
                .concat(newAmmo as Item);
            } else {
              newInventory = newInventory.map((i) =>
                i.id === ammo.id ? { ...i, quantity: i.quantity - 1 } : i,
              );
            }
          } else {
            if (ammo.uses > 1) {
              newInventory = newInventory.map((i) =>
                i.id === ammo.id ? { ...i, uses: ammo.uses - 1 } : i,
              );
            } else {
              newInventory = newInventory.filter((i) => i.id !== ammo.id);
            }
          }
        }

        const loss = Math.floor(Math.random() * (85 - 15 + 1)) + 15;
        const newUses = Math.max(0, activeItem.uses - loss);

        result = {
          success: true,
          message: "OK",
          rollData: {
            skillId: activeItem.skillId,
            loss,
            bonusDamage: ammoBonusDamage,
          },
        };
        newInventory = newInventory.map((i) =>
          i.id === activeItem.id ? { ...i, uses: newUses } : i,
        );
      } else {
        const currentUses = item.uses;
        if (item.quantity > 1) {
          if (currentUses > 1) {
            const newItem = {
              ...item,
              id: Date.now() + Math.random(),
              quantity: 1,
              uses: currentUses - 1,
            };
            newInventory = state.inventory
              .map((i) =>
                i.id === id ? { ...i, quantity: i.quantity - 1 } : i,
              )
              .concat(newItem as Item);
          } else {
            newInventory = state.inventory.map((i) =>
              i.id === id ? { ...i, quantity: i.quantity - 1 } : i,
            );
          }
        } else {
          if (currentUses > 1) {
            newInventory = state.inventory.map((i) =>
              i.id === id ? { ...i, uses: currentUses - 1 } : i,
            );
          } else {
            if (item.type === "KIT") {
              newInventory = state.inventory.map((i) =>
                i.id === id ? { ...i, uses: 0 } : i,
              );
            } else {
              newInventory = state.inventory.filter((i) => i.id !== id);
            }
          }
        }
        result = { success: true, message: "OK" };
      }

      return {
        inventory: newInventory,
        customEffects: [...state.customEffects, ...consumedTempEffects],
      };
    });

    consumedActions.forEach((act) => {
      get().processDirectAction(act);
    });

    return result;
  },

  consumeRechargeable: (id) => {
    const state = get();
    const children = state.inventory.filter(
      (i) => i.parentId === id && i.type === "CONSUMABLE",
    );

    if (children.length === 0) return;

    const sortedChildren = children.sort((a, b) => {
      if ("uses" in a && "uses" in b) {
        const aUses = a.uses || 1;
        const bUses = b.uses || 1;

        if (aUses !== bUses) return aUses - bUses;
        return a.quantity - b.quantity;
      }
      return 0;
    });

    get().consumeItem(sortedChildren[0].id);
  },

  repairActiveItem: (id, multiplier) => {
    let recovered = 0;
    set((state) => {
      const item = state.inventory.find((i) => i.id === id);
      if (item && item.type === "ACTIVE") {
        const base = Math.floor(Math.random() * (100 - 60 + 1)) + 60;
        recovered = Math.floor(base * multiplier);
        const newUses = Math.min(
          (item as ActiveItem).maxUses,
          (item as ActiveItem).uses + recovered,
        );
        return {
          inventory: state.inventory.map((i) =>
            i.id === id ? { ...i, uses: newUses } : i,
          ),
        };
      }
      return state;
    });

    return { recovered };
  },
});
