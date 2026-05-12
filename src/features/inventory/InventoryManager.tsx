import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { useCharacterStore } from "../character/store";
import { useDisclosure } from "../../shared/hooks/useDisclosure";
import type { Item } from "../../shared/types/veil-grey";
import {
  dispatchDiscordLog,
  type DiscordEmbed,
} from "../../shared/utils/discordWebhook";
import { RetroToast } from "../../shared/ui/RetroToast";
import { ConfirmModal, FocusOverlay } from "../../shared/ui/Overlays";
import { Button } from "../../shared/ui/Form";
import { InventoryDropColumn } from "./InventoryDropColumn";
import { ItemNodeWrapper } from "./components/ItemNodeWrapper";
import { ItemModal } from "../item-modal/ItemModal";
import { useCharacterStats } from "../../shared/hooks/useCharacterStats";

const isDev =
  import.meta.env.VITE_IN_DEVELOPMENT === "true" || import.meta.env.DEV;

const dropAnimationConfig = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.4" } },
  }),
};

export function InventoryManager({
  currentLoad,
  maxLoad,
}: {
  currentLoad?: number;
  maxLoad?: number;
}) {
  const inventory = useCharacterStore((state) => state.inventory);
  const name = useCharacterStore((state) => state.name);
  const sandboxMode = useCharacterStore((state) => state.sandboxMode);
  const moveInventoryItem = useCharacterStore(
    (state) => state.moveInventoryItem,
  );
  const deleteInventoryItem = useCharacterStore(
    (state) => state.deleteInventoryItem,
  );
  const reorderInventoryItem = useCharacterStore(
    (state) => state.reorderInventoryItem,
  );
  const updateInventoryItem = useCharacterStore(
    (state) => state.updateInventoryItem,
  );

  const { isOverweight } = useCharacterStats();

  const itemModal = useDisclosure();
  const deleteModal = useDisclosure();

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [invSnapshot, setInvSnapshot] = useState<Item[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const toggleEditMode = () => {
    if (isEditMode) {
      const stored = inventory.filter(
        (i) =>
          !i.isCarried &&
          invSnapshot.find((snap) => snap.id === i.id && snap.isCarried),
      );
      const taken = inventory.filter(
        (i) =>
          i.isCarried &&
          invSnapshot.find((snap) => snap.id === i.id && !snap.isCarried),
      );

      if (stored.length > 0 || taken.length > 0) {
        const embed: DiscordEmbed = {
          title: "[>] ATUALIZACAO LOGISTICA DE INVENTARIO",
          color: 10181046,
          description: `**UNIDADE OPERACIONAL:** ${name}`,
          fields: [],
          footer: { text: "SYS.MNLT // LOGISTIC_TRACKER" },
          timestamp: new Date().toISOString(),
        };

        if (stored.length > 0) {
          embed.fields!.push({
            name: "ITENS ARMAZENADOS NA BASE",
            value: stored
              .map(
                (i) =>
                  `\`[${i.slots * i.quantity} SLOTS]\` **${i.name}** (Qtd: ${i.quantity})`,
              )
              .join("\n"),
            inline: false,
          });
        }

        if (taken.length > 0) {
          embed.fields!.push({
            name: "ITENS RETIRADOS PARA OPERACAO",
            value: taken
              .map(
                (i) =>
                  `\`[${i.slots * i.quantity} SLOTS]\` **${i.name}** (Qtd: ${i.quantity})`,
              )
              .join("\n"),
            inline: false,
          });
        }

        dispatchDiscordLog("INVENTORY", name, "", [embed]);
      }
    } else {
      setInvSnapshot([...inventory]);
    }
    setIsEditMode(!isEditMode);
  };

  const handleWebhookAll = () => {
    const cLoad = currentLoad ?? 0;
    const mLoad = maxLoad ?? 0;
    let msg = `**MANIFESTO DE CARGA GERAL**\n**UNIDADE:** ${name}\n**CARGA:** ${cLoad} / ${mLoad} SLOTS ${isOverweight ? "⚠️ [SOBRECARREGADO]" : ""}\n\n`;
    inventory
      .filter((i) => !i.parentId)
      .forEach((item) => {
        msg += `🔹 **${item.name}** (${item.type}) [SLOTS: ${item.slots}] ${item.isEquipped ? "🛡️" : ""}\n`;
        const children = inventory.filter((i) => i.parentId === item.id);
        if (children.length > 0) {
          children.forEach((child) => {
            msg += `   > 🔸 ${child.name} [SLOTS: ${child.slots}]\n`;
          });
        }
      });
    dispatchDiscordLog("INVENTORY", name, msg);
    RetroToast.info("LOGÍSTICA TOTAL TRANSMITIDA.");
  };

  const handleDragStart = (e: DragStartEvent) =>
    setActiveDragId(e.active.id as number);

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = e;
    if (!over) return;

    const itemId = active.id as number;
    let targetId = over.id;
    let targetDrawer: string | null = null;

    if (typeof targetId === "string" && targetId.startsWith("drawer::")) {
      const parts = targetId.split("::");
      targetId = parseInt(parts[1], 10);
      targetDrawer = parts[2] === "GERAL" ? null : parts[2];
    }

    if (targetId === "zone-base" && !isEditMode) {
      RetroToast.warning("ACESSO AO ARMAZÉM REQUER MODO DE EDIÇÃO.");
      return;
    }

    if (targetId === "zone-carried" || targetId === "zone-base") {
      updateInventoryItem(itemId, "isCarried", targetId === "zone-carried");
      moveInventoryItem(itemId, null);
      return;
    }

    const overItem = inventory.find((i) => i.id === targetId);
    if (overItem) {
      const isContainerTarget =
        overItem.type === "CONTAINER" ||
        overItem.type === "EQUIPABLE" ||
        overItem.type === "ACTIVE" ||
        overItem.type === "RECHARGEABLE" ||
        overItem.type === "KIT";

      if (isContainerTarget) {
        const res = moveInventoryItem(itemId, overItem.id, targetDrawer);
        if (!res.success) RetroToast.error(res.message);
      } else {
        const draggedItem = inventory.find((i) => i.id === itemId);
        reorderInventoryItem(itemId, overItem.id);
        if (draggedItem && draggedItem.isCarried !== overItem.isCarried) {
          updateInventoryItem(itemId, "isCarried", overItem.isCarried);
        }
      }
    }
  };

  const activeDragItem = inventory.find((i) => i.id === activeDragId);

  const rootItems = useMemo(
    () => inventory.filter((i) => i.parentId === null),
    [inventory],
  );
  const carriedItems = useMemo(
    () => rootItems.filter((i) => i.isCarried),
    [rootItems],
  );
  const baseItems = useMemo(
    () => rootItems.filter((i) => !i.isCarried),
    [rootItems],
  );
  const baseWeight = useMemo(
    () =>
      inventory
        .filter((i) => !i.isCarried)
        .reduce((acc, curr) => acc + curr.slots, 0),
    [inventory],
  );

  return (
    <>
      <FocusOverlay isActive={activeDragId !== null} />
      <div
        className={`flex flex-col h-full relative transition-all duration-300 ${activeDragId ? "z-50" : "z-10"}`}
      >
        <div className="flex gap-2 mb-4 shrink-0 bg-[var(--theme-background)]/80 p-2 border border-[var(--theme-border)]">
          <Button
            className={`flex-1 transition-colors ${isEditMode ? "bg-[var(--theme-accent)] text-[var(--theme-background)] border-[var(--theme-accent)] shadow-[0_0_10px_var(--theme-accent)]" : "border-dashed text-[var(--theme-text)] border-[var(--theme-border)] hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)]"}`}
            onClick={toggleEditMode}
          >
            {isEditMode
              ? "[ SALVAR RECONFIGURAÇÃO ]"
              : "[ ENTRAR EM MODO DE EDIÇÃO ]"}
          </Button>

          {!isEditMode && (
            <Button
              className="border-dashed text-[var(--theme-accent)] px-4 bg-[var(--theme-accent)]/5 hover:bg-[var(--theme-accent)] hover:text-[var(--theme-background)]"
              onClick={handleWebhookAll}
              title="Transmitir Manifesto Geral"
            >
              SEND ALL &gt;&gt;
            </Button>
          )}

          <AnimatePresence>
            {(sandboxMode || isDev) && isEditMode && (
              <motion.button
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap px-4 border border-[var(--theme-success)] text-[var(--theme-success)] font-bold text-xs hover:bg-[var(--theme-success)] hover:text-[var(--theme-background)] transition-colors"
                onClick={() => {
                  setSelectedItem(null);
                  itemModal.onOpen();
                }}
              >
                + SINTETIZAR NOVO ITEM
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden pb-4">
            <InventoryDropColumn
              id="zone-carried"
              title="LEVANDO CONSIGO"
              headerExtra={
                <span className="text-[8px] font-mono text-[var(--theme-text)]/60">
                  [{carriedItems.length} MÓDULOS RAIZ]
                </span>
              }
              items={carriedItems}
              allInventory={inventory}
              onEdit={(i: Item) => {
                setSelectedItem(i);
                itemModal.onOpen();
              }}
              onDelete={(i: Item) => {
                setSelectedItem(i);
                deleteModal.onOpen();
              }}
              activeDragId={activeDragId}
              isEditMode={isEditMode}
            />

            <div className="relative md:flex-1 flex flex-col">
              <InventoryDropColumn
                id="zone-base"
                title="BASE / ARMAZÉM"
                headerExtra={
                  <span className="text-[8px] font-mono text-[var(--theme-text)]/60 border border-[var(--theme-border)] px-1 bg-[var(--theme-background)]">
                    PESO ESTÁTICO: {baseWeight}
                  </span>
                }
                items={baseItems}
                allInventory={inventory}
                onEdit={(i: Item) => {
                  setSelectedItem(i);
                  itemModal.onOpen();
                }}
                onDelete={(i: Item) => {
                  setSelectedItem(i);
                  deleteModal.onOpen();
                }}
                activeDragId={activeDragId}
                isEditMode={isEditMode}
              />

              {!isEditMode && (
                <div className="absolute inset-0 z-20 bg-[var(--theme-background)]/20 backdrop-blur-[1px] flex flex-col items-center justify-center border border-[var(--theme-warning)]/50 transition-all duration-300">
                  <svg
                    className="w-10 h-10 text-[var(--theme-warning)] mb-3 opacity-80"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
                  </svg>
                  <span className="text-[10px] font-bold tracking-widest text-[var(--theme-warning)] uppercase bg-[var(--theme-background)] px-3 py-1.5 border border-[var(--theme-warning)]/50 shadow-[0_0_10px_var(--theme-warning)_inset]">
                    ACESSO RESTRITO
                  </span>
                </div>
              )}
            </div>
          </div>

          <DragOverlay dropAnimation={dropAnimationConfig}>
            {activeDragItem ? (
              <div className="relative shadow-[0_0_30px_var(--theme-accent)] opacity-100 scale-105 rotate-2 cursor-grabbing pointer-events-none w-[340px]">
                <ItemNodeWrapper
                  item={activeDragItem}
                  allInventory={inventory}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  activeDragId={activeDragId}
                  isEditMode={isEditMode}
                  isOverlay
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <ItemModal
          isOpen={itemModal.isOpen}
          onClose={itemModal.onClose}
          itemToEdit={selectedItem}
        />

        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={deleteModal.onClose}
          title="CONFIRMAR DESTRUIÇÃO"
          message={
            <div className="bg-[var(--theme-background)] p-3 border border-[var(--theme-danger)]/50 mt-2 text-left">
              <span className="font-bold text-[var(--theme-danger)] block mb-1">
                [{selectedItem?.name}]
              </span>
              <p className="text-[var(--theme-text)]/60 text-xs font-mono">
                O item será apagado permanentemente. Caso possua itens internos,
                eles retornarão à raiz.
              </p>
            </div>
          }
          onConfirm={() => {
            if (selectedItem) {
              const deleteEmbed: DiscordEmbed = {
                title: `[>>>] ITEM DELETADO [<<<]`,
                color: 10038562,
                description: `**NOME:** ${selectedItem.name}\n**QUANTIDADE:** ${selectedItem.quantity}\n**TYPE.:** ${selectedItem.type}\n**DESC:** ${selectedItem.description}`,
              };
              dispatchDiscordLog("PLAYER", name, "", [deleteEmbed]);
              deleteInventoryItem(selectedItem.id);
            }
            deleteModal.onClose();
          }}
        />
      </div>
    </>
  );
}
