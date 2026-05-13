import type { Item, CustomEffect } from "../../../shared/types/veil-grey";
import { EffectsList } from "../../../shared/ui/EffectsList";

interface ItemDetailsProps {
  item: Item;
  inheritedEffects?: CustomEffect[];
}

export function ItemDetails({ item, inheritedEffects = [] }: ItemDetailsProps) {
  const hasOwnEffects = item.effects && item.effects.length > 0;
  const hasInheritedEffects = inheritedEffects && inheritedEffects.length > 0;
  const hasInstantActions =
    "instantActions" in item &&
    Array.isArray(item.instantActions) &&
    item.instantActions.length > 0;

  if (
    !item.description &&
    !hasOwnEffects &&
    !hasInheritedEffects &&
    !hasInstantActions &&
    item.type !== "ACTIVE"
  )
    return null;

  return (
    <div className="flex flex-col gap-2 pt-2 ">
      {item.type === "ACTIVE" && item.requiresAmmo && (
        <span className="text-[9px] bg-[var(--theme-warning)]/10 text-[var(--theme-warning)] border border-[var(--theme-warning)]/30 px-2 py-1 w-fit font-bold tracking-widest">
          REQUER MUNIÇÃO: {item.commsType}
        </span>
      )}

      {(item as { commsType: string }).commsType && (
        <span className="text-[9px] bg-[var(--theme-warning)]/10 text-[var(--theme-warning)] border border-[var(--theme-warning)]/30 px-2 py-1 w-fit font-bold tracking-widest">
          TYPE: {(item as { commsType: string }).commsType}
        </span>
      )}

      {item.description && (
        <span className="text-[10px] text-[var(--theme-text)]/80 italic leading-relaxed border-l-2 border-[var(--theme-accent)]/30 pl-2 whitespace-pre-wrap">
          {item.description}
        </span>
      )}

      {hasInstantActions && (
        <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-[var(--theme-border)] border-dashed w-full">
          <span className="text-[8px] text-[var(--theme-success)] uppercase font-bold tracking-widest mb-1 mt-1">
            AÇÕES IMEDIATAS (ON USE):
          </span>
          {("instantActions" in item ? item.instantActions : []).map((act) => (
            <div
              key={act.id}
              className="flex justify-between items-center px-2 py-1 border w-full bg-[var(--theme-success)]/10 border-[var(--theme-success)]/30"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] font-bold font-mono text-[var(--theme-success)]">
                  [{act.val > 0 ? `+${act.val}` : act.val}]
                </span>
                <span className="text-[9px] uppercase font-mono tracking-wider text-[var(--theme-success)]">
                  [{act.target.replace("_", ":")}]
                </span>
                <span className="text-[9px] text-[var(--theme-text)] uppercase tracking-wider truncate">
                  {act.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <EffectsList effects={item.effects} />

      <EffectsList
        effects={inheritedEffects}
        title="EFEITOS DA MUNIÇÃO / CARGA INTERNA:"
      />
    </div>
  );
}
