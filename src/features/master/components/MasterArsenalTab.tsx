import { useState, useRef } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import CryptoJS from "crypto-js";
import { useMasterStore } from "../masterStore";
import { Button, Input } from "../../../shared/ui/Form";
import { Accordion } from "../../../shared/ui/Accordion";
import { useNetworkStore } from "../../../shared/store/useNetworkStore";
import { useDisclosure } from "../../../shared/hooks/useDisclosure";
import type { Item, CustomEffect } from "../../../shared/types/veil-grey";
import { RetroToast } from "../../../shared/ui/RetroToast";
import { ItemModal } from "../../item-modal/ItemModal";
import { CustomEffectModal } from "../../stats/CustomEffectModal";
import { TargetSelectionModal } from "../../../shared/ui/TargetSelectionModal";

interface TransmissionPayload {
  type: "ITEM" | "EFFECT";
  data: Item | CustomEffect;
}

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY || "fallback_veil_grey_key";
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";

function DraggableRow({
  id,
  data,
  children,
}: {
  id: string;
  data: { type: "ITEM" | "EFFECT" };
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`border border-[var(--theme-border)] bg-[var(--theme-background)] p-2 cursor-grab active:cursor-grabbing hover:border-[var(--theme-accent)]/50 transition-colors ${
        isDragging ? "opacity-50 border-dashed" : ""
      }`}
    >
      {children}
    </div>
  );
}

function DroppableFolder({
  id,
  children,
  isActive,
}: {
  id: string;
  children: React.ReactNode;
  isActive: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`transition-colors border-2 ${
        isOver
          ? "border-[var(--theme-accent)] bg-[var(--theme-accent)]/10"
          : "border-transparent"
      } ${isActive ? "" : "min-h-[40px]"}`}
    >
      {children}
    </div>
  );
}

export function MasterArsenalTab() {
  const store = useMasterStore();
  const sendPayload = useNetworkStore((store) => store.sendPayload);

  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>(
    {},
  );
  const [newFolderName, setNewFolderName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectModal = useDisclosure();
  const [isItemModalOpen, setItemModalOpen] = useState(false);
  const [transmissionTarget, setTransmissionTarget] =
    useState<TransmissionPayload | null>(null);

  const toggleAcc = (id: string) =>
    setOpenAccordions((p) => ({ ...p, [id]: !p[id] }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = Number(active.id);
    const overId = String(over.id);

    const isItem = active.data.current?.type === "ITEM";
    const isEffect = active.data.current?.type === "EFFECT";

    let folderId: string | null = null;
    if (overId.startsWith("folder_")) {
      folderId = overId.replace("folder_", "");
    } else if (overId === "root_ITEM" || overId === "root_EFFECT") {
      folderId = null;
    } else {
      return;
    }

    if (isItem) store.moveItemToFolder(activeId, folderId);
    if (isEffect) store.moveEffectToFolder(activeId, folderId);
  };

  const handleCreateFolder = (type: "ITEM" | "EFFECT") => {
    if (!newFolderName.trim()) return;
    store.addFolder({
      id: crypto.randomUUID(),
      name: newFolderName.toUpperCase(),
      type,
    });
    setNewFolderName("");
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

  const handleSendPayload = (targets: string[]) => {
    if (!transmissionTarget) return;
    targets.forEach((targetName) => {
      sendPayload(targetName, transmissionTarget.type, transmissionTarget.data);
    });
    RetroToast.success(`DADOS TRANSMITIDOS PARA: ${targets.join(", ")}`);
    setTransmissionTarget(null);
  };

  const renderItems = (folderId: string | null) => {
    const items = store.globalItems.filter((i) => i.folderId === folderId);
    return items.map((item) => (
      <DraggableRow key={item.id} id={String(item.id)} data={{ type: "ITEM" }}>
        <div className="flex justify-between items-center w-full">
          <span className="text-[10px] font-bold uppercase truncate">
            {item.name}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="warning"
              className="h-5 py-0 px-2 text-[8px]"
              onClick={(e) => {
                e.stopPropagation();
                setTransmissionTarget({ type: "ITEM", data: item });
              }}
            >
              SEND
            </Button>
            <Button
              size="sm"
              variant="danger"
              className="h-5 py-0 px-2 text-[8px]"
              onClick={(e) => {
                e.stopPropagation();
                store.removeGlobalItem(item.id);
              }}
            >
              X
            </Button>
          </div>
        </div>
      </DraggableRow>
    ));
  };

  const renderEffects = (folderId: string | null) => {
    const effects = store.globalEffects.filter((e) => e.folderId === folderId);
    return effects.map((eff) => (
      <DraggableRow key={eff.id} id={String(eff.id)} data={{ type: "EFFECT" }}>
        <div className="flex justify-between items-center w-full">
          <span className="text-[10px] font-bold uppercase truncate w-40">
            [{eff.mode}] {eff.description} (
            {eff.val > 0 ? `+${eff.val}` : eff.val})
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="warning"
              className="h-5 py-0 px-2 text-[8px]"
              onClick={(e) => {
                e.stopPropagation();
                setTransmissionTarget({ type: "EFFECT", data: eff });
              }}
            >
              SEND
            </Button>
            <Button
              size="sm"
              variant="danger"
              className="h-5 py-0 px-2 text-[8px]"
              onClick={(e) => {
                e.stopPropagation();
                store.removeGlobalEffect(eff.id);
              }}
            >
              X
            </Button>
          </div>
        </div>
      </DraggableRow>
    ));
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between items-center border-b border-[var(--theme-border)] pb-2 shrink-0">
        <span className="text-xs font-bold text-[var(--theme-accent)] tracking-widest uppercase">
          DIRETÓRIOS DE INJEÇÃO E ARQUIVOS
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="warning"
            className="border-dashed text-[10px]"
            onClick={handleExportJSON}
          >
            EXPORTAR .JSON
          </Button>
          <Button
            size="sm"
            variant="success"
            className="border-dashed text-[10px]"
            onClick={() => fileInputRef.current?.click()}
          >
            IMPORTAR .JSON
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

      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-2 gap-6 overflow-y-auto custom-scrollbar flex-1 pr-2">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center bg-[var(--theme-accent)]/10 p-2 border border-[var(--theme-accent)]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-accent)]">
                /ROOT/MATÉRIAS
              </span>
              <Button
                size="sm"
                variant="primary"
                className="h-5 px-2 py-0 text-[8px]"
                onClick={() => setItemModalOpen(true)}
              >
                + SINTETIZAR
              </Button>
            </div>

            <DroppableFolder id="root_ITEM" isActive={true}>
              <div className="flex flex-col gap-1 min-h-[30px] p-1 border-dashed border border-[var(--theme-border)]">
                {renderItems(null)}
              </div>
            </DroppableFolder>

            {store.folders
              .filter((f) => f.type === "ITEM")
              .map((folder) => (
                <div key={folder.id} className="relative group">
                  <Button
                    size="sm"
                    variant="danger"
                    className="absolute right-8 top-1 h-5 px-2 py-0 text-[8px] z-10"
                    onClick={() => store.removeFolder(folder.id)}
                  >
                    X
                  </Button>
                  <Accordion
                    title={`DIR: ${folder.name}`}
                    isOpen={!!openAccordions[folder.id]}
                    onToggle={() => toggleAcc(folder.id)}
                  >
                    <DroppableFolder
                      id={`folder_${folder.id}`}
                      isActive={!!openAccordions[folder.id]}
                    >
                      <div className="flex flex-col gap-1 min-h-[40px] p-1">
                        {renderItems(folder.id)}
                      </div>
                    </DroppableFolder>
                  </Accordion>
                </div>
              ))}

            <div className="flex gap-1 mt-2">
              <Input
                placeholder="NOME DA PASTA..."
                className="h-7 text-[10px] flex-1"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
              <Button
                size="sm"
                className="h-7 px-2 text-[10px]"
                onClick={() => handleCreateFolder("ITEM")}
              >
                + DIR
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center bg-[var(--theme-danger)]/10 p-2 border border-[var(--theme-danger)]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-danger)]">
                /ROOT/EFEITOS_RAPIDOS
              </span>
              <Button
                size="sm"
                variant="danger"
                className="h-5 px-2 py-0 text-[8px]"
                onClick={effectModal.onOpen}
              >
                + SINTETIZAR
              </Button>
            </div>

            <DroppableFolder id="root_EFFECT" isActive={true}>
              <div className="flex flex-col gap-1 min-h-[30px] p-1 border-dashed border border-[var(--theme-border)]">
                {renderEffects(null)}
              </div>
            </DroppableFolder>

            {store.folders
              .filter((f) => f.type === "EFFECT")
              .map((folder) => (
                <div key={folder.id} className="relative">
                  <Button
                    size="sm"
                    variant="danger"
                    className="absolute right-8 top-1 h-5 px-2 py-0 text-[8px] z-10"
                    onClick={() => store.removeFolder(folder.id)}
                  >
                    X
                  </Button>
                  <Accordion
                    title={`DIR: ${folder.name}`}
                    isOpen={!!openAccordions[folder.id]}
                    onToggle={() => toggleAcc(folder.id)}
                  >
                    <DroppableFolder
                      id={`folder_${folder.id}`}
                      isActive={!!openAccordions[folder.id]}
                    >
                      <div className="flex flex-col gap-1 min-h-[40px] p-1">
                        {renderEffects(folder.id)}
                      </div>
                    </DroppableFolder>
                  </Accordion>
                </div>
              ))}

            <div className="flex gap-1 mt-2">
              <Input
                placeholder="NOME DA PASTA..."
                className="h-7 text-[10px] flex-1"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
              <Button
                size="sm"
                className="h-7 px-2 text-[10px]"
                onClick={() => handleCreateFolder("EFFECT")}
              >
                + DIR
              </Button>
            </div>
          </div>
        </div>
      </DndContext>

      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setItemModalOpen(false)}
        itemToEdit={null}
        onSaveOverride={(newItem, nestedItems) => {
          store.addGlobalItem({ ...newItem, folderId: null });
          if (nestedItems) {
            nestedItems.forEach((n) =>
              store.addGlobalItem({ ...n, folderId: null }),
            );
          }
        }}
      />

      <CustomEffectModal
        isOpen={effectModal.isOpen}
        onClose={effectModal.onClose}
        onSave={(effect: CustomEffect) => {
          store.addGlobalEffect({ ...effect, folderId: null });
        }}
      />

      <TargetSelectionModal
        isOpen={!!transmissionTarget}
        onClose={() => setTransmissionTarget(null)}
        onSelect={handleSendPayload}
        allowAll={true}
        title="SELECIONE O RECEPTOR DOS DADOS"
      />
    </div>
  );
}
