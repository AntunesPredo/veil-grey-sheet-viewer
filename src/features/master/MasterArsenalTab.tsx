import { useState, useRef } from "react";
import {
  DndContext,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDisclosure } from "../../shared/hooks/useDisclosure";
import { useNetworkStore } from "../../shared/store/useNetworkStore";
import type { Item, CustomEffect } from "../../shared/types/veil-grey";
import { Button, Input } from "../../shared/ui/Form";
import { RetroToast } from "../../shared/ui/RetroToast";
import { TargetSelectionModal } from "../../shared/ui/TargetSelectionModal";
import { ConfirmModal } from "../../shared/ui/Overlays";
import { useCharacterStore } from "../character/store";
import { ItemModal } from "../item-modal/ItemModal";
import { CustomEffectModal } from "../stats/CustomEffectModal";
import { useMasterStore } from "./masterStore";
import { ArsenalFolder } from "./components/ArsenalFolder";
import { ArsenalRow } from "./components/ArsenalRow";
import { ArsenalSearchModal } from "./components/ArsenalSearchModal";
import { PreSendConfigModal } from "./components/PreSendConfigModal";

interface SelectedPayload {
  id: string | number;
  type: "ITEM" | "EFFECT";
  data: Item | CustomEffect;
}

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY || "fallback_veil_grey_key";
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";

export function MasterArsenalTab() {
  const store = useMasterStore();
  const { setNodeRef: rootItemRef } = useDroppable({ id: "root_ITEM" });
  const { setNodeRef: rootEffectRef } = useDroppable({ id: "root_EFFECT" });
  const inventory = useCharacterStore((state) => state.inventory);
  const sendPayload = useNetworkStore((state) => state.sendPayload);

  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>(
    {},
  );
  const [newFolderNameItem, setNewFolderNameItem] = useState("");
  const [newFolderNameEff, setNewFolderNameEff] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectModal = useDisclosure();
  const searchModal = useDisclosure();
  const preSendModal = useDisclosure();
  const [isItemModalOpen, setItemModalOpen] = useState(false);
  const [isTargetModalOpen, setTargetModalOpen] = useState(false);

  const deleteItemModal = useDisclosure();
  const deleteEffectModal = useDisclosure();
  const deleteFolderModal = useDisclosure();

  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [effectToDelete, setEffectToDelete] = useState<CustomEffect | null>(
    null,
  );
  const [folderToDelete, setFolderToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [activeDragItem, setActiveDragItem] = useState<{
    type: string;
    payload: Item | CustomEffect;
  } | null>(null);

  const [selectedPayloads, setSelectedPayloads] = useState<SelectedPayload[]>(
    [],
  );
  const [configuredPayloads, setConfiguredPayloads] = useState<
    SelectedPayload[]
  >([]);

  const toggleAcc = (id: string) =>
    setOpenAccordions((p) => ({ ...p, [id]: !p[id] }));

  const toggleSelection = (
    id: string | number,
    type: "ITEM" | "EFFECT",
    data: Item | CustomEffect,
  ) => {
    setSelectedPayloads((prev) => {
      const exists = prev.find((p) => p.id === id);
      if (exists) return prev.filter((p) => p.id !== id);
      return [...prev, { id, type, data }];
    });
  };

  const handleDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current;
    if (!data || data.type === "FOLDER") return;
    setActiveDragItem({
      type: data.type,
      payload: data.payload,
    });
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;

    const activeId = Number(active.id);
    const overId = String(over.id);
    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === "ITEM" || activeType === "EFFECT") {
      let folderId: string | null | undefined = undefined;

      if (overId.startsWith("folder_")) {
        folderId = overId.replace("folder_", "");
      } else if (overId.startsWith("sortable_")) {
        folderId = overId.replace("sortable_", "");
      } else if (overId === "root_ITEM" || overId === "root_EFFECT") {
        folderId = null;
      } else if (overType === activeType) {
        folderId = over.data.current?.payload?.folderId || null;
      }

      if (folderId !== undefined) {
        if (activeType === "ITEM") {
          const item = store.globalItems.find((i) => i.id === activeId);
          if (item && item.folderId !== folderId) {
            store.moveItemToFolder(activeId, folderId);
          }
        }
        if (activeType === "EFFECT") {
          const effect = store.globalEffects.find((e) => e.id === activeId);
          if (effect && effect.folderId !== folderId) {
            store.moveEffectToFolder(activeId, folderId);
          }
        }
      }
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = e;
    if (!over) return;

    if (
      String(active.id).startsWith("sortable_") &&
      String(over.id).startsWith("sortable_")
    ) {
      const oldIndex = store.folders.findIndex(
        (f) => f.id === String(active.id).replace("sortable_", ""),
      );
      const newIndex = store.folders.findIndex(
        (f) => f.id === String(over.id).replace("sortable_", ""),
      );
      if (oldIndex !== -1 && newIndex !== -1) {
        store.reorderFolders(oldIndex, newIndex);
      }
      return;
    }

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === "ITEM" && overType === "ITEM" && active.id !== over.id) {
      store.reorderGlobalItems(Number(active.id), Number(over.id));
    }
    if (
      activeType === "EFFECT" &&
      overType === "EFFECT" &&
      active.id !== over.id
    ) {
      store.reorderGlobalEffects(Number(active.id), Number(over.id));
    }
  };

  const handleCreateFolder = (type: "ITEM" | "EFFECT") => {
    const val = type === "ITEM" ? newFolderNameItem : newFolderNameEff;
    if (!val.trim()) return;
    store.addFolder({ id: crypto.randomUUID(), name: val.toUpperCase(), type });
    if (type === "ITEM") setNewFolderNameItem("");
    else setNewFolderNameEff("");
  };

  const handleImportInventory = () => {
    let count = 0;
    inventory.forEach((i) => {
      if (!store.globalItems.find((gi) => gi.id === i.id)) {
        store.addGlobalItem({ ...i, folderId: null });
        count++;
      }
    });
    RetroToast.success(`${count} MATÉRIAS SINCRONIZADAS DO INVENTÁRIO.`);
  };

  const handleExportJSON = () => {
    const data = {
      folders: store.folders,
      globalItems: store.globalItems,
      globalEffects: store.globalEffects,
    };
    const payload = { vg_version: APP_VERSION, data };
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(payload),
      SECRET_KEY,
    ).toString();
    const dataStr =
      "data:text/plain;charset=utf-8," + encodeURIComponent(encrypted);
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `VG_MASTER_ARSENAL.json`;
    a.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawContent = event.target?.result as string;
        const bytes = CryptoJS.AES.decrypt(rawContent, SECRET_KEY);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedStr) throw new Error("Assinatura inválida.");
        const parsed = JSON.parse(decryptedStr);
        store.importArsenal(parsed.data);
        RetroToast.success("ARSENAL IMPORTADO COM SUCESSO.");
      } catch (error) {
        RetroToast.error(
          "FALHA NA IMPORTAÇÃO DO JSON." + (error as Error).message,
        );
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendBulkPayload = (targets: string[]) => {
    configuredPayloads.forEach((payload) => {
      targets.forEach((targetName) => {
        sendPayload(targetName, payload.type, payload.data);
      });
    });
    RetroToast.success(
      `${configuredPayloads.length} PACOTES TRANSMITIDOS PARA: ${targets.join(", ")}`,
    );
    setSelectedPayloads([]);
    setConfiguredPayloads([]);
    setTargetModalOpen(false);
  };

  const renderList = (folderId: string | null, type: "ITEM" | "EFFECT") => {
    const items =
      type === "ITEM"
        ? store.globalItems.filter((i) => i.folderId === folderId)
        : [];
    const effects =
      type === "EFFECT"
        ? store.globalEffects.filter((e) => e.folderId === folderId)
        : [];

    return (
      <SortableContext
        items={
          type === "ITEM"
            ? items.map((i) => String(i.id))
            : effects.map((e) => String(e.id))
        }
        strategy={verticalListSortingStrategy}
      >
        {items.map((i) => (
          <ArsenalRow
            key={i.id}
            id={String(i.id)}
            type="ITEM"
            data={i}
            isSelected={!!selectedPayloads.find((p) => p.id === i.id)}
            onToggle={() => toggleSelection(i.id, "ITEM", i)}
            onDelete={() => {
              setItemToDelete(i);
              deleteItemModal.onOpen();
            }}
          />
        ))}
        {effects.map((e) => (
          <ArsenalRow
            key={e.id}
            id={String(e.id)}
            type="EFFECT"
            data={e}
            isSelected={!!selectedPayloads.find((p) => p.id === e.id)}
            onToggle={() => toggleSelection(e.id, "EFFECT", e)}
            onDelete={() => {
              setEffectToDelete(e);
              deleteEffectModal.onOpen();
            }}
          />
        ))}
      </SortableContext>
    );
  };

  const itemFolders = store.folders.filter((f) => f.type === "ITEM");
  const effectFolders = store.folders.filter((f) => f.type === "EFFECT");

  const itemsInFolder = folderToDelete
    ? store.globalItems.filter((i) => i.folderId === folderToDelete.id).length
    : 0;
  const effectsInFolder = folderToDelete
    ? store.globalEffects.filter((e) => e.folderId === folderToDelete.id).length
    : 0;
  const totalInFolder = itemsInFolder + effectsInFolder;

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between items-center border-b border-[var(--theme-border)] pb-2 shrink-0">
        <span className="text-xs font-bold text-[var(--theme-accent)] tracking-widest uppercase">
          ARSENAL E DIRETRIZES ({store.globalItems.length} MATS |{" "}
          {store.globalEffects.length} EFFS)
        </span>
        <div className="flex gap-2 items-center">
          {selectedPayloads.length > 0 && (
            <Button
              size="sm"
              variant="warning"
              className="h-7 animate-pulse border-dashed"
              onClick={preSendModal.onOpen}
            >
              REVISAR REMESSA ({selectedPayloads.length})
            </Button>
          )}
          <Button
            size="sm"
            variant="primary"
            className="border-dashed text-[10px] h-7"
            onClick={searchModal.onOpen}
          >
            PESQUISAR
          </Button>
          <Button
            size="sm"
            variant="warning"
            className="border-dashed text-[10px] h-7"
            onClick={handleExportJSON}
          >
            EXPORTAR
          </Button>
          <Button
            size="sm"
            variant="success"
            className="border-dashed text-[10px] h-7"
            onClick={() => fileInputRef.current?.click()}
          >
            IMPORTAR
          </Button>
          <input
            type="file"
            accept=".json"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImportJSON}
          />
        </div>
      </div>

      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCenter}
      >
        <div className="grid grid-cols-2 gap-6 overflow-y-auto custom-scrollbar flex-1 pr-2">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center bg-[var(--theme-accent)]/10 p-2 border border-[var(--theme-accent)]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-accent)]">
                ITENS: /ROOT
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="success"
                  className=" px-2 py-0 text-[8px] border-dashed"
                  onClick={handleImportInventory}
                >
                  SYNC INV
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  className="px-2 py-0 text-[8px]"
                  onClick={() => setItemModalOpen(true)}
                >
                  + SINTETIZAR
                </Button>
              </div>
            </div>

            <div className="flex gap-1 mt-1">
              <Input
                placeholder="NOVA PASTA..."
                className="h-7 text-[10px] flex-1 bg-[var(--theme-background)]"
                value={newFolderNameItem}
                onChange={(e) => setNewFolderNameItem(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleCreateFolder("ITEM")
                }
              />
              <Button
                size="sm"
                className="h-7 px-2 text-[10px]"
                onClick={() => handleCreateFolder("ITEM")}
              >
                + DIR
              </Button>
            </div>

            <div
              ref={rootItemRef}
              className="border-dashed border border-[var(--theme-border)] mt-2"
            >
              <div className="flex flex-col gap-1 min-h-[30px] p-1">
                {renderList(null, "ITEM")}
              </div>
            </div>

            <SortableContext
              items={itemFolders.map((f) => `sortable_${f.id}`)}
              strategy={verticalListSortingStrategy}
            >
              {itemFolders.map((folder) => (
                <ArsenalFolder
                  key={folder.id}
                  id={folder.id}
                  name={folder.name}
                  isOpen={!!openAccordions[folder.id]}
                  onToggle={() => toggleAcc(folder.id)}
                  onDelete={() => {
                    setFolderToDelete(folder);
                    deleteFolderModal.onOpen();
                  }}
                >
                  {renderList(folder.id, "ITEM")}
                </ArsenalFolder>
              ))}
            </SortableContext>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center bg-[var(--theme-danger)]/10 p-2 border border-[var(--theme-danger)]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-danger)]">
                EFEITOS: /ROOT
              </span>
              <Button
                size="sm"
                variant="danger"
                className="px-2 py-0 text-[8px]"
                onClick={effectModal.onOpen}
              >
                + SINTETIZAR
              </Button>
            </div>

            <div className="flex gap-1 mt-1">
              <Input
                placeholder="NOVA PASTA..."
                className="h-7 text-[10px] flex-1 bg-[var(--theme-background)]"
                value={newFolderNameEff}
                onChange={(e) => setNewFolderNameEff(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleCreateFolder("EFFECT")
                }
              />
              <Button
                size="sm"
                variant="danger"
                className="h-7 px-2 text-[10px]"
                onClick={() => handleCreateFolder("EFFECT")}
              >
                + DIR
              </Button>
            </div>

            <div
              ref={rootEffectRef}
              className="border-dashed border border-[var(--theme-border)] mt-2"
            >
              <div className="flex flex-col gap-1 min-h-[30px] p-1">
                {renderList(null, "EFFECT")}
              </div>
            </div>

            <SortableContext
              items={effectFolders.map((f) => `sortable_${f.id}`)}
              strategy={verticalListSortingStrategy}
            >
              {effectFolders.map((folder) => (
                <ArsenalFolder
                  key={folder.id}
                  id={folder.id}
                  name={folder.name}
                  isOpen={!!openAccordions[folder.id]}
                  onToggle={() => toggleAcc(folder.id)}
                  onDelete={() => {
                    setFolderToDelete(folder);
                    deleteFolderModal.onOpen();
                  }}
                >
                  {renderList(folder.id, "EFFECT")}
                </ArsenalFolder>
              ))}
            </SortableContext>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDragItem ? (
            <div className="flex items-center gap-2 border border-[var(--theme-accent)] bg-[var(--theme-background)] p-1.5 opacity-95 scale-105 shadow-2xl max-w-[300px]">
              <span className="text-[10px] font-bold uppercase truncate flex-1 leading-tight text-[var(--theme-accent)]">
                {activeDragItem.type === "EFFECT" &&
                "mode" in activeDragItem.payload
                  ? `[${activeDragItem.payload.mode}] ${activeDragItem.payload.description}`
                  : activeDragItem.type === "EFFECT"
                    ? (activeDragItem.payload as CustomEffect).description
                    : (activeDragItem.payload as Item).name}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setItemModalOpen(false)}
        itemToEdit={null}
        onSaveOverride={(newItem, nestedItems) => {
          store.addGlobalItem({ ...newItem, folderId: null });
          if (nestedItems)
            nestedItems.forEach((n) =>
              store.addGlobalItem({ ...n, folderId: null }),
            );
        }}
      />
      <CustomEffectModal
        isOpen={effectModal.isOpen}
        onClose={effectModal.onClose}
        onSave={(effect: CustomEffect) =>
          store.addGlobalEffect({ ...effect, folderId: null })
        }
      />
      <ArsenalSearchModal
        isOpen={searchModal.isOpen}
        onClose={searchModal.onClose}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        globalItems={store.globalItems}
        globalEffects={store.globalEffects}
        selectedPayloads={selectedPayloads}
        toggleSelection={toggleSelection}
      />
      <PreSendConfigModal
        isOpen={preSendModal.isOpen}
        onClose={preSendModal.onClose}
        payloads={selectedPayloads}
        onConfirmTargeting={(finalPayloads: SelectedPayload[]) => {
          setConfiguredPayloads(finalPayloads);
          preSendModal.onClose();
          setTargetModalOpen(true);
        }}
      />
      <TargetSelectionModal
        isOpen={isTargetModalOpen}
        onClose={() => setTargetModalOpen(false)}
        onSelect={handleSendBulkPayload}
        allowAll={true}
        title="TRANSMISSÃO EM MASSA"
      />

      <ConfirmModal
        isOpen={deleteItemModal.isOpen}
        onClose={deleteItemModal.onClose}
        title="EXCLUIR MATÉRIA"
        isDanger
        message={
          <div className="text-left bg-[var(--theme-background)] p-3 border border-[var(--theme-border)] mt-2">
            <span className="font-bold text-[var(--theme-danger)] block mb-1">
              [{itemToDelete?.name}]
            </span>
            <p className="text-[var(--theme-accent)] text-xs truncate whitespace-nowrap">
              {itemToDelete?.description || "Sem conteúdo ou descrição."}
            </p>
          </div>
        }
        onConfirm={() => {
          if (itemToDelete) store.removeGlobalItem(itemToDelete.id);
          deleteItemModal.onClose();
        }}
      />

      <ConfirmModal
        isOpen={deleteEffectModal.isOpen}
        onClose={deleteEffectModal.onClose}
        title="EXCLUIR EFEITO"
        isDanger
        message={
          <div className="text-left bg-[var(--theme-background)] p-3 border border-[var(--theme-border)] mt-2">
            <span className="font-bold text-[var(--theme-danger)] block mb-1">
              [{effectToDelete?.mode}] {effectToDelete?.description}
            </span>
            <p className="text-[var(--theme-accent)] text-xs font-mono">
              ALVO: {effectToDelete?.target} <br />
              VALOR:{" "}
              {effectToDelete?.val && effectToDelete.val > 0
                ? `+${effectToDelete.val}`
                : effectToDelete?.val}
            </p>
          </div>
        }
        onConfirm={() => {
          if (effectToDelete) store.removeGlobalEffect(effectToDelete.id);
          deleteEffectModal.onClose();
        }}
      />

      <ConfirmModal
        isOpen={deleteFolderModal.isOpen}
        onClose={deleteFolderModal.onClose}
        title="DESESTRUTURAR DIRETÓRIO"
        isDanger
        message={
          <div className="text-left bg-[var(--theme-background)] p-3 border border-[var(--theme-border)] mt-2 flex flex-col gap-2">
            <span className="font-bold text-[var(--theme-danger)] block">
              DIR: {folderToDelete?.name}
            </span>
            <span className="text-[var(--theme-accent)] text-xs font-mono">
              A exclusão desta pasta retornará{" "}
              <span className="font-bold text-[var(--theme-warning)]">
                {totalInFolder}
              </span>{" "}
              iten(s)/efeito(s) para o diretório /ROOT.
            </span>
            <span className="text-[var(--theme-text)]/50 text-[10px] font-mono italic mt-1">
              Deseja prosseguir com a desestruturação do diretório?
            </span>
          </div>
        }
        onConfirm={() => {
          if (folderToDelete) store.removeFolder(folderToDelete.id);
          deleteFolderModal.onClose();
        }}
      />
    </div>
  );
}
