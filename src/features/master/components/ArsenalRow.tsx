import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Checkbox, Button } from "../../../shared/ui/Form";
import type { Item, CustomEffect } from "../../../shared/types/veil-grey";

export function ArsenalRow({
  id,
  type,
  data,
  isSelected,
  onToggle,
  onDelete,
}: {
  id: string;
  type: "ITEM" | "EFFECT";
  data: Item | CustomEffect;
  isSelected: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { type, payload: data },
  });

  const isEff = type === "EFFECT";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 border border-[var(--theme-border)] bg-[var(--theme-background)] p-1.5 hover:border-[var(--theme-accent)]/50 transition-colors ${
        isDragging ? "opacity-50 border-dashed z-50" : "z-10"
      }`}
    >
      <div
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing p-1 text-[var(--theme-text)]/40 hover:text-[var(--theme-accent)] touch-none"
      >
        <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </div>

      <Checkbox label="" checked={isSelected} onChange={onToggle} />

      <span className="text-[10px] font-bold uppercase truncate flex-1 leading-tight">
        {isEff ? (
          <>
            [{(data as CustomEffect).mode}] {(data as CustomEffect).description}{" "}
            (
            {(data as CustomEffect).val > 0
              ? `+${(data as CustomEffect).val}`
              : (data as CustomEffect).val}
            )
          </>
        ) : (
          (data as Item).name
        )}
      </span>

      <Button
        size="sm"
        variant="danger"
        className="h-5 py-0 px-2 text-[8px] shrink-0"
        onClick={onDelete}
      >
        X
      </Button>
    </div>
  );
}
