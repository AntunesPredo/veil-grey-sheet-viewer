import type { Item } from "../../../shared/types/veil-grey";
import { Button } from "../../../shared/ui/Form";
import { useDisclosure } from "../../../shared/hooks/useDisclosure";
import { SplitStackModal } from "./SplitStackModal";
import { MergeStackModal } from "./MergeStackModal";
import { RepairActiveModal } from "./RepairActiveModal";
import { useSystemData } from "../../../shared/hooks/useSystemData";

interface ItemActionsProps {
  item: Item;
  allInventory: Item[];
  currentUses: number;
  onUse: (e: React.MouseEvent) => void;
  isNestedAmmo?: boolean;
  disableUse?: boolean;
}

const renderBlocks = (uses: number, maxUses: number) => {
  const blocks = [];
  for (let i = 0; i < maxUses; i++) blocks.push(i < uses ? "■" : "□");
  return blocks.join(" ");
};

export function ItemActions({
  item,
  allInventory,
  currentUses,
  onUse,
  isNestedAmmo = false,
  disableUse = false,
}: ItemActionsProps) {
  const { getSkillById } = useSystemData();
  // const updateInventoryItem = useCharacterStore(
  //   (state) => state.updateInventoryItem,
  // );
  const hasUses = "maxUses" in item;
  const maxUses = hasUses ? item.maxUses : 1;
  const canStack = item.type === "MATERIAL" || item.type === "CONSUMABLE";

  const itemSkill =
    (item.type === "ACTIVE" || item.type === "KIT") && item.skillId
      ? getSkillById(item.skillId)
      : null;

  // const onUpdateQty = (val: number) =>
  //   updateInventoryItem(item.id, "quantity", Math.max(1, val));

  const splitModal = useDisclosure();
  const mergeModal = useDisclosure();
  const repairModal = useDisclosure();

  const compatibleMergeItems = canStack
    ? allInventory.filter(
        (i) => i.id !== item.id && i.type === item.type && i.name === item.name,
      )
    : [];

  return (
    <div className="flex flex-col gap-2 bg-[var(--theme-background)]/40">
      {canStack && (
        <div className="flex items-center gap-2">
          {item.quantity > 1 && (
            <Button
              size="sm"
              onClick={splitModal.onOpen}
              className="flex-1 border-dashed text-[10px] flex items-center justify-center gap-2"
              title="Dividir Stack"
            >
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M15 16h4v2h-4zm0-8h7v2h-7zm0 4h6v2h-6zM3 18c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V8H3v10zM14 5h-3l-1-1H6L5 5H2v2h12V5z" />
              </svg>
              DIVIDIR
            </Button>
          )}
          {compatibleMergeItems.length > 0 && (
            <Button
              size="sm"
              variant="success"
              onClick={mergeModal.onOpen}
              className="flex-1 border-dashed text-[10px] flex items-center justify-center gap-2"
              title="Condensar Matérias"
            >
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M17 20.41L18.41 19 15 15.59 13.59 17 17 20.41zM7.5 8H11v5.59L5.59 19 7 20.41l6-6V8h3.5L12 3.5 7.5 8z" />
              </svg>
              CONDENSAR
            </Button>
          )}
        </div>
      )}

      {/* {item.type === "MATERIAL" && (
        <div className="flex items-center gap-2 mt-1 border-t border-dashed border-[var(--theme-border)] pt-2">
          <span className="text-[9px] font-bold text-[var(--theme-text)]/50 uppercase tracking-widest">
            STACK:
          </span>
          <NumberStepper
            size="sm"
            value={item.quantity}
            onDecrement={() => onUpdateQty(item.quantity - 1)}
            onIncrement={() => onUpdateQty(item.quantity + 1)}
          />
        </div>
      )} */}

      {hasUses && item.type === "ACTIVE" && (
        <div className="flex flex-col w-full gap-1">
          <span className="text-[12px] font-bold border-b border-dashed mb-2 pb-2 text-[var(--theme-warning)] text-center uppercase tracking-widest">
            INTEGRIDADE
          </span>
          <div className="w-full h-2 bg-[var(--theme-background)] border border-[var(--theme-border)]">
            <div
              className="h-full bg-[var(--theme-warning)] shadow-[0_0_5px_var(--theme-warning)] transition-all"
              style={{
                width: `${Math.min((currentUses / maxUses) * 100, 100)}%`,
              }}
            />
          </div>
          {!isNestedAmmo && (
            <div className="flex gap-2 mt-1">
              <Button
                size="sm"
                variant="primary"
                onClick={repairModal.onOpen}
                className="border-dashed text-[10px] px-2"
              >
                CONSERTAR
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={onUse}
                disabled={disableUse}
                className="flex-1 border-dashed text-[10px]"
              >
                {itemSkill ? `RODAR [${itemSkill.label}]` : "EXECUTAR USO"}
              </Button>
            </div>
          )}
        </div>
      )}

      {hasUses &&
        item.type !== "ACTIVE" &&
        !(item.type === "CONSUMABLE" && item.quantity > 1) && (
          <div className="flex flex-col w-full gap-1 mt-1 pt-2">
            <div className="flex justify-between items-center w-full">
              <span className="text-[9px] font-bold text-[var(--theme-warning)] uppercase tracking-widest">
                CARGAS
              </span>
              <span className="text-[9px] font-mono text-[var(--theme-warning)]">
                {currentUses} / {maxUses}
              </span>
            </div>
            <div className="w-full h-1 bg-[var(--theme-background)] border border-[var(--theme-border)]">
              <div
                className="h-full bg-[var(--theme-warning)] shadow-[0_0_5px_var(--theme-warning)]"
                style={{
                  width: `${Math.min((currentUses / maxUses) * 100, 100)}%`,
                }}
              />
            </div>
            {!isNestedAmmo && (
              <Button
                size="sm"
                variant="warning"
                onClick={onUse}
                disabled={disableUse}
                className="w-full mt-1 border-dashed text-[10px]"
              >
                {itemSkill ? `RODAR [${itemSkill.label}]` : "[ EXECUTAR USO ]"}
              </Button>
            )}
          </div>
        )}

      {item.type === "CONSUMABLE" && item.quantity > 1 && (
        <div className="flex flex-col gap-1 mt-1 border-t border-dashed border-[var(--theme-border)] pt-2">
          <span className="text-[9px] font-bold text-[var(--theme-warning)] uppercase tracking-widest mb-1">
            UNIDADES NA STACK:
          </span>
          <div className="flex flex-row gap-1 flex-wrap">
            {Array.from({ length: item.quantity }).map((_, i) => (
              <div
                key={i}
                className="flex flex-1 justify-between items-center bg-[var(--theme-background)] p-1 border border-[var(--theme-border)] shadow-[0_0_5px_rgba(0,0,0,0.5)_inset]"
              >
                <span className="text-[9px] font-mono text-[var(--theme-text)] font-bold px-1">
                  UNID. {i + 1}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-[var(--theme-warning)] tracking-widest">
                    {renderBlocks(currentUses, maxUses)}
                  </span>
                  {!isNestedAmmo && (
                    <Button
                      size="sm"
                      variant="warning"
                      onClick={onUse}
                      className="h-5 px-2 text-[8px] border-dashed"
                    >
                      USAR
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <SplitStackModal
        isOpen={splitModal.isOpen}
        onClose={splitModal.onClose}
        item={item}
      />
      <MergeStackModal
        isOpen={mergeModal.isOpen}
        onClose={mergeModal.onClose}
        targetItem={item}
        allInventory={allInventory}
      />
      <RepairActiveModal
        isOpen={repairModal.isOpen}
        onClose={repairModal.onClose}
        item={item}
      />
    </div>
  );
}
