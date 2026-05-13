import type { Item } from "../../../shared/types/veil-grey";
import { Button } from "../../../shared/ui/Form";
import { useCustomSvgIcons } from "../../../shared/hooks/useCustomSvgIcons";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useSystemData } from "../../../shared/hooks/useSystemData";
import { generateInjectionHash } from "../../../shared/utils/hashIntegration";

const isDev =
  import.meta.env.VITE_IN_DEVELOPMENT === "true" || import.meta.env.DEV;

interface ItemHeaderProps {
  item: Item;
  isEditMode: boolean;
  isEquippable: boolean;
  currentUses: number;
  onToggleEquip: (e: React.MouseEvent) => void;
  onWebhook: (e: React.MouseEvent) => void;
  onQuickUse: (e: React.MouseEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
  setDragRef: (element: HTMLElement | null) => void;
  listeners: SyntheticListenerMap | undefined;
  attributes: DraggableAttributes | undefined;
  isNestedAmmo?: boolean;
  disableUse?: boolean;
  sandboxMode?: boolean;
}

const renderUseBlocks = (uses: number, maxUses: number) => {
  const blocks = [];
  for (let i = 0; i < maxUses; i++) {
    blocks.push(i < uses ? "■" : "□");
  }
  return blocks.join(" ");
};

const renderIntegrityBlocks = (condition: number) => {
  let activeCount = 1;
  if (condition > 75) activeCount = 4;
  else if (condition > 50) activeCount = 3;
  else if (condition > 25) activeCount = 2;

  let colorClass = "text-[var(--theme-accent)]";
  if (condition <= 25) colorClass = "text-[var(--theme-danger)] animate-pulse";
  else if (condition <= 50) colorClass = "text-[var(--theme-warning)]";

  const blocks = [];
  for (let i = 0; i < 4; i++) {
    blocks.push(i < activeCount ? "■" : "□");
  }
  return <span className={`font-mono ${colorClass}`}>{blocks.join(" ")}</span>;
};

export function ItemHeader({
  item,
  isEditMode,
  isEquippable,
  currentUses,
  onToggleEquip,
  onWebhook,
  onQuickUse,
  onEdit,
  onDelete,
  setDragRef,
  listeners,
  attributes,
  isNestedAmmo = false,
  disableUse = false,
  sandboxMode = false,
}: ItemHeaderProps) {
  const { getSpecificIcon } = useCustomSvgIcons();
  const { getSkillById } = useSystemData();
  const icon = getSpecificIcon(item.svgId);
  const hasUses = "maxUses" in item;
  const maxUses = hasUses ? item.maxUses : 1;
  const isActive = item.type === "ACTIVE";
  const itemSkill =
    (item.type === "ACTIVE" || item.type === "KIT") && item.skillId
      ? getSkillById(item.skillId)
      : null;

  const pct = hasUses ? Math.min((currentUses / maxUses) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-2 items-center justify-between p-2 cursor-pointer group hover:bg-[var(--theme-accent)]/5 transition-colors">
      <div className="flex w-full items-center gap-3 min-w-0 flex-1">
        <div className="flex items-center shrink-0">
          {isEditMode ? (
            <div
              ref={setDragRef}
              {...listeners}
              {...attributes}
              className="cursor-grab active:cursor-grabbing hover:text-[var(--theme-accent)] text-[var(--theme-text)]/40 px-1 touch-none"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z" />
              </svg>
            </div>
          ) : (
            <div
              ref={setDragRef}
              {...listeners}
              {...attributes}
              className={`p-1.5 border bg-[var(--theme-background)] cursor-grab active:cursor-grabbing shadow-[0_0_8px_rgba(0,0,0,0.5)_inset] touch-none ${item.isEquipped ? "text-[var(--theme-success)] border-[var(--theme-success)]/30 hover:border-[var(--theme-success)]" : "text-[var(--theme-accent)] border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50"}`}
            >
              <svg className="w-7 h-7 fill-current" viewBox={icon.viewBox}>
                {icon.svg}
              </svg>
            </div>
          )}
        </div>
        <div className="flex w-full justify-between items-center">
          <div className="flex flex-col min-w-0 flex-1 pr-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`font-bold uppercase truncate text-xs tracking-wider ${item.isEquipped ? "text-[var(--theme-success)]" : "text-[var(--theme-accent)]"}`}
              >
                {item.name}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[9px] font-mono text-[var(--theme-text)]/60 bg-[var(--theme-background)]/60 px-1 border border-[var(--theme-border)] shrink-0">
                SLOTS: {item.slots * item.quantity}{" "}
                {item.quantity > 1 && `(${item.slots}/UN)`}
              </span>
              {item.quantity > 1 && (
                <span className="text-[9px] font-mono text-[var(--theme-accent)] bg-[var(--theme-accent)]/10 px-1 border border-[var(--theme-accent)]/30 shrink-0">
                  QTD: {item.quantity}
                </span>
              )}

              {hasUses && maxUses > 1 && !isActive && (
                <span className="text-[9px] font-mono text-[var(--theme-warning)] bg-[var(--theme-warning)]/10 px-1 border border-[var(--theme-warning)]/30 whitespace-nowrap">
                  {renderUseBlocks(currentUses, maxUses)}
                </span>
              )}

              {hasUses && isActive && (
                <span className="text-[9px] px-1 bg-[var(--theme-background)]/40 border border-[var(--theme-border)] whitespace-nowrap">
                  {renderIntegrityBlocks(pct)}
                </span>
              )}
            </div>
          </div>
          {isEditMode && isEquippable && (
            <Button
              size="sm"
              onClick={onToggleEquip}
              variant="success"
              className={`w-35 text-[10px] ${item.isEquipped ? "" : "border-dashed"}`}
            >
              {item.isEquipped ? "[EQUIPADO]" : "[DESEQUIPADO]"}
            </Button>
          )}
        </div>
      </div>

      <div
        className="flex w-full justify-between items-center gap-2 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {isEditMode ? (
          <div className="flex gap-1">
            {sandboxMode || isDev ? (
              <Button
                variant="primary"
                onClick={onEdit}
                className="px-2 border-dashed text-[9px]"
              >
                MOD
              </Button>
            ) : null}
            <Button
              variant="danger"
              onClick={onDelete}
              className="px-2 border-dashed text-[9px]"
            >
              DEL
            </Button>
          </div>
        ) : (
          <>
            {hasUses && !isNestedAmmo && (
              <Button
                size="sm"
                variant="warning"
                onClick={onQuickUse}
                disabled={disableUse}
                className="border-dashed text-[10px] mr-1 shadow-[0_0_8px_rgba(204,122,0,0.2)]"
              >
                {itemSkill ? `USAR - ${itemSkill.label}` : "USAR"}
              </Button>
            )}
            <div className="flex gap-2 items-center">
              {isDev && (
                <Button
                  size="sm"
                  variant="warning"
                  onClick={(e) => {
                    e.stopPropagation();
                    generateInjectionHash({
                      type: "ITEM",
                      singleUse: true,
                      data: {
                        ...item,
                        parentId: null,
                        isCarried: true,
                        isEquipped: false,
                      },
                    });
                  }}
                >
                  [C]
                </Button>
              )}
              <Button
                size="sm"
                onClick={onWebhook}
                className="text-[var(--theme-accent)] hover:text-[var(--theme-accent)]"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
