import { motion, AnimatePresence, type Variants } from "framer-motion";
import type { CustomEffect, Note } from "../../shared/types/veil-grey";
import { Button, Input } from "../../shared/ui/Form";
import { Markdown } from "../../shared/ui/Markdown";
import { EffectsList } from "../../shared/ui/EffectsList";
import { useResizeObserver } from "../../shared/hooks/useResizeObserver";

const isDev =
  import.meta.env.VITE_IN_DEVELOPMENT === "true" || import.meta.env.DEV;

type ExtraNoteBlockProps = {
  note: Note;
  onDelete: () => void;
  onEditToggle: () => void;
  onUpdate: (field: "title" | "content", val: string) => void;
  onAddEffect: () => void;
  effects: CustomEffect[];
  onRemoveEffect: (id: number) => void;
  updateHeight: (id: number | "MAIN", height: number) => void;
  onSendNote: (note: Note) => void;
};

const crtVariants: Variants = {
  hidden: { opacity: 0, clipPath: "inset(50% 0 50% 0)" },
  visible: {
    opacity: 1,
    clipPath: "inset(0% 0 0% 0)",
    transition: { duration: 0.15, ease: [0.45, 0.05, 0.55, 0.95] },
  },
  exit: {
    opacity: 0,
    clipPath: "inset(50% 0 50% 0)",
    transition: { duration: 0.1 },
  },
};

export function ExtraNoteBlock({
  note,
  onDelete,
  onEditToggle,
  onUpdate,
  onAddEffect,
  effects,
  onRemoveEffect,
  updateHeight,
  onSendNote,
}: ExtraNoteBlockProps) {
  const noteRef = useResizeObserver(note.id, updateHeight);

  return (
    <motion.div
      layout
      variants={crtVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="border border-[var(--theme-accent)]/30 bg-[var(--theme-background)] flex flex-col"
    >
      <div className="flex justify-between items-center p-2 bg-[var(--theme-border)] border-b border-[var(--theme-border)]">
        {note.isEditing ? (
          <Input
            value={note.title}
            onChange={(e) => onUpdate("title", e.target.value)}
            className="flex-1 font-bold text-[var(--theme-accent)] h-6 py-0 border-none bg-[var(--theme-background)]"
          />
        ) : (
          <span className="font-bold text-[var(--theme-accent)] uppercase">
            {note.title}
          </span>
        )}
        <div className="flex gap-1 ml-2">
          <Button size="sm" onClick={onEditToggle}>
            {note.isEditing ? "[ SALVAR ]" : "[ EDITAR ]"}
          </Button>
          {note.isEditing && (
            <Button size="sm" variant="danger" onClick={onDelete}>
              <svg
                viewBox="0 0 16 16"
                className="w-4 h-4"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.1716 8.00003L1.08582 3.91424L3.91424 1.08582L8.00003 5.1716L12.0858 1.08582L14.9142 3.91424L10.8285 8.00003L14.9142 12.0858L12.0858 14.9142L8.00003 10.8285L3.91424 14.9142L1.08582 12.0858L5.1716 8.00003Z"
                  fill="currentColor"
                />
              </svg>
            </Button>
          )}
        </div>
      </div>

      <div className="p-2">
        <AnimatePresence mode="wait">
          {note.isEditing ? (
            <motion.div
              key="edit-note"
              variants={crtVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col gap-2"
            >
              <textarea
                ref={noteRef}
                value={note.content}
                onChange={(e) => onUpdate("content", e.target.value)}
                style={{ height: note.height || 80, minHeight: 60 }}
                className="w-full bg-[var(--theme-background)]/80 border border-[var(--theme-accent)]/10 p-2 text-sm text-[var(--theme-accent)] font-mono outline-none resize-y custom-scrollbar"
              />
              {isDev && (
                <div className="flex gap-1 mt-2 border-t border-[var(--theme-accent)]/20 pt-2">
                  <Button
                    size="sm"
                    variant="warning"
                    className="border-dashed"
                    onClick={() => onSendNote(note)}
                  >
                    [ TRANSMITIR NOTA ]
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    className="border-dashed"
                    onClick={onAddEffect}
                  >
                    + ATRELAR EFEITO
                  </Button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="view-note"
              variants={crtVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              ref={noteRef}
              style={{ height: note.height || 80, minHeight: 60 }}
              className="w-full overflow-y-auto resize-y bg-transparent hover:bg-[var(--theme-accent)]/5 transition-colors p-1 custom-scrollbar"
            >
              <div className="prose prose-invert prose-sm prose-p:my-1 prose-headings:my-2 max-w-none text-[var(--theme-accent)]">
                {note.content ? (
                  <Markdown content={note.content} />
                ) : (
                  <em className="text-[var(--theme-accent)]/50">Vazio...</em>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <EffectsList effects={effects} onRemove={onRemoveEffect} />
      </div>
    </motion.div>
  );
}
