import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "../../../shared/ui/Form";
import { Accordion } from "../../../shared/ui/Accordion";

interface ArsenalFolderProps {
  id: string;
  name: string;
  isOpen: boolean;
  onToggle: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

export function ArsenalFolder({
  id,
  name,
  isOpen,
  onToggle,
  onDelete,
  children,
}: ArsenalFolderProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `sortable_${id}`, data: { type: "FOLDER" } });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `folder_${id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={`relative group border-2 transition-colors ${
        isDragging ? "opacity-50" : ""
      } ${isOver ? "border-[var(--theme-accent)] bg-[var(--theme-accent)]/20" : "border-transparent"}`}
    >
      <div className="absolute right-8 top-1 flex gap-1 z-10">
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing p-0.5 text-[var(--theme-text)]/40 hover:text-[var(--theme-accent)] bg-[var(--theme-background)] border border-[var(--theme-border)]"
        >
          <svg viewBox="0 0 20 20" className="w-3 h-3 fill-current">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
          </svg>
        </div>
        <Button
          size="sm"
          variant="danger"
          className="h-5 px-2 py-0 text-[8px]"
          onClick={onDelete}
        >
          X
        </Button>
      </div>

      <div ref={setDropRef}>
        <Accordion title={`DIR: ${name}`} isOpen={isOpen} onToggle={onToggle}>
          <div className="flex flex-col gap-1 min-h-[40px] p-1">{children}</div>
        </Accordion>
      </div>
    </div>
  );
}
