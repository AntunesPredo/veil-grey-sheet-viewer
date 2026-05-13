import { useState, useMemo } from "react";
import type { Item } from "../../../shared/types/veil-grey";
import { Modal } from "../../../shared/ui/Overlays";
import { Button, Checkbox } from "../../../shared/ui/Form";
import { useCharacterStore } from "../../character/store";

interface MergeStackModalProps {
  targetItem: Item | null;
  allInventory: Item[];
  isOpen: boolean;
  onClose: () => void;
}

export function MergeStackModal({
  targetItem,
  allInventory,
  isOpen,
  onClose,
}: MergeStackModalProps) {
  const mergeInventoryItems = useCharacterStore(
    (state) => state.mergeInventoryItems,
  );
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const compatibleItems = useMemo(() => {
    if (!targetItem) return [];
    return allInventory.filter(
      (i) =>
        i.id !== targetItem.id &&
        i.type === targetItem.type &&
        i.name === targetItem.name,
    );
  }, [targetItem, allInventory]);

  if (!targetItem || compatibleItems.length === 0) return null;

  const handleToggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleToggleAll = () => {
    if (selectedIds.length === compatibleItems.length) setSelectedIds([]);
    else setSelectedIds(compatibleItems.map((i) => i.id));
  };

  const handleConfirm = () => {
    if (selectedIds.length > 0) mergeInventoryItems(targetItem.id, selectedIds);
    onClose();
  };

  const selectedExtraQty = compatibleItems
    .filter((i) => selectedIds.includes(i.id))
    .reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="CONDENSAR STACKS">
      <div className="flex flex-col gap-4">
        <div className="bg-[var(--theme-success)]/10 border border-[var(--theme-success)] p-3 text-center">
          <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--theme-success)] block mb-1">
            MATÉRIA ALVO (RECEPTOR)
          </span>
          <span className="text-sm font-bold uppercase text-[var(--theme-accent)] block">
            {targetItem.name}
          </span>
          <span className="font-mono text-xs text-[var(--theme-text)]/70">
            QTD ATUAL: {targetItem.quantity}{" "}
            <span className="text-[var(--theme-success)] font-bold">
              +{selectedExtraQty}
            </span>
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center border-b border-[var(--theme-border)] pb-1">
            <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--theme-text)]/60">
              MATÉRIAS COMPATÍVEIS
            </span>
            <Button
              size="sm"
              className="px-2 py-0.5 text-[9px]"
              onClick={handleToggleAll}
            >
              {selectedIds.length === compatibleItems.length
                ? "DESMARCAR TUDO"
                : "SELECIONAR TUDO"}
            </Button>
          </div>

          <div className="max-h-[200px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
            {compatibleItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-2 border ${selectedIds.includes(item.id) ? "bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]" : "bg-[var(--theme-background)] border-[var(--theme-border)]"}`}
              >
                <Checkbox
                  label={`[QTD: ${item.quantity}] ${"maxUses" in item && "uses" in item && item.quantity === 1 ? `| [USES: ${item.uses}/${item.maxUses}]` : ""} | LOCATE: ${item.drawer ? `/GAVETA: /${item.drawer}` : "/GERAL"}`}
                  checked={selectedIds.includes(item.id)}
                  onChange={() => handleToggle(item.id)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="danger" onClick={onClose}>
            CANCELAR
          </Button>
          <Button
            variant="success"
            onClick={handleConfirm}
            disabled={selectedIds.length === 0}
          >
            INICIAR FUSÃO
          </Button>
        </div>
      </div>
    </Modal>
  );
}
