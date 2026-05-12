import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useCharacterStore } from "../character/store";
import { useDisclosure } from "../../shared/hooks/useDisclosure";
import type { CustomEffect, Note } from "../../shared/types/veil-grey";
import { Button } from "../../shared/ui/Form";
import { Markdown } from "../../shared/ui/Markdown";
import { CustomEffectModal } from "../stats/CustomEffectModal";
import { ConfirmModal } from "../../shared/ui/Overlays";
import { EffectsList } from "../../shared/ui/EffectsList";
import { ExtraNoteBlock } from "./ExtraNoteBlock";
import { useResizeObserver } from "../../shared/hooks/useResizeObserver";
import { useNetworkStore } from "../../shared/store/useNetworkStore";
import { TargetSelectionModal } from "../../shared/ui/TargetSelectionModal";
import { RetroToast } from "../../shared/ui/RetroToast";

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

export function NotesManager() {
  const notes = useCharacterStore((state) => state.notes);
  const mainNote = useCharacterStore((state) => state.mainNote);
  const isMainNoteEditing = useCharacterStore(
    (state) => state.isMainNoteEditing,
  );
  const mainNoteHeight = useCharacterStore((state) => state.mainNoteHeight);
  const customEffects = useCharacterStore((state) => state.customEffects);
  const updateMainNote = useCharacterStore((state) => state.updateMainNote);
  const addNote = useCharacterStore((state) => state.addNote);
  const updateNote = useCharacterStore((state) => state.updateNote);
  const deleteNote = useCharacterStore((state) => state.deleteNote);
  const toggleNoteEditMode = useCharacterStore(
    (state) => state.toggleNoteEditMode,
  );
  const removeCustomEffect = useCharacterStore(
    (state) => state.removeCustomEffect,
  );
  const updateNoteHeight = useCharacterStore((state) => state.updateNoteHeight);
  const [noteToTransmit, setNoteToTransmit] = useState<Note | null>(null);
  const sendPayload = useNetworkStore((state) => state.sendPayload);

  const effectModal = useDisclosure();
  const deleteModal = useDisclosure();

  const [targetNoteId, setTargetNoteId] = useState<number | string | null>(
    null,
  );
  const [noteToDelete, setNoteToDelete] = useState<{
    id: number;
    title: string;
    content: string;
  } | null>(null);

  const mainNoteRef = useResizeObserver("MAIN", updateNoteHeight);

  const handleOpenEffectModal = (noteId: number | string | null) => {
    setTargetNoteId(noteId);
    effectModal.onOpen();
  };

  const handleOpenDelete = (note: Note) => {
    setNoteToDelete(note);
    deleteModal.onOpen();
  };

  const handleSendNote = (targets: string[]) => {
    if (!noteToTransmit) return;

    const noteEffects = customEffects.filter(
      (e) => e.link === noteToTransmit.id,
    );

    targets.forEach((target) => {
      sendPayload(target, "NOTE", {
        note: noteToTransmit,
        effects: noteEffects,
      });
    });

    setNoteToTransmit(null);
    RetroToast.success("ARQUIVO DE NOTA TRANSMITIDO.");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-[var(--theme-accent)]/30 bg-[var(--theme-background)]/40 flex flex-col shadow-[0_0_10px_rgba(0,0,0,0.5)_inset]">
        <div className="bg-[var(--theme-accent)]/10 border-b border-[var(--theme-accent)] p-2 font-bold tracking-widest flex justify-between items-center">
          <span>REGISTRO PRINCIPAL</span>
          <Button size="sm" onClick={() => toggleNoteEditMode("MAIN")}>
            {isMainNoteEditing ? "[ SALVAR ]" : "[ EDITAR ]"}
          </Button>
        </div>
        <div className="p-4 relative">
          <AnimatePresence mode="wait">
            {isMainNoteEditing ? (
              <motion.div
                key="edit"
                variants={crtVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col gap-2"
              >
                <textarea
                  ref={mainNoteRef}
                  value={mainNote}
                  onChange={(e) => updateMainNote(e.target.value)}
                  style={{ height: mainNoteHeight || 150, minHeight: 100 }}
                  className="w-full bg-[var(--theme-background)]/80 border border-[var(--theme-accent)]/10 p-2 text-sm text-[var(--theme-accent)] font-mono outline-none resize-y custom-scrollbar"
                />
                <Button
                  variant="primary"
                  className="border-dashed"
                  onClick={() => handleOpenEffectModal("MAIN")}
                >
                  + INJETAR EFEITO
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="view"
                variants={crtVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                ref={mainNoteRef}
                style={{ height: mainNoteHeight || 150, minHeight: 100 }}
                className="w-full overflow-y-auto resize-y p-2 bg-[var(--theme-background)] border border-transparent custom-scrollbar"
              >
                <div className="prose prose-invert prose-sm prose-p:my-1 prose-headings:my-2 prose-a:text-[var(--theme-accent)] max-w-none text-[var(--theme-accent)]">
                  {mainNote ? (
                    <Markdown content={mainNote} />
                  ) : (
                    <em className="text-[var(--theme-accent)]">
                      Sem anotações principais...
                    </em>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <EffectsList
            effects={
              customEffects?.filter((e: CustomEffect) => e.link === "MAIN") ||
              []
            }
            onRemove={removeCustomEffect}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-dashed border-[var(--theme-accent)]/30 pt-4">
        <div className="flex flex-col gap-2 items-start">
          <span className="text-[14px] font-bold text-center text-[var(--theme-text)] tracking-widest">
            ANOTAÇÕES EXTRAS
          </span>
          <Button
            variant="primary"
            className="px-4 hover:border-[var(--theme-accent)]"
            onClick={addNote}
          >
            [+] NOVA ANOTAÇÃO
          </Button>
        </div>

        <AnimatePresence>
          {notes.map((note) => (
            <ExtraNoteBlock
              key={note.id}
              note={note}
              onDelete={() => handleOpenDelete(note)}
              onEditToggle={() => toggleNoteEditMode(note.id)}
              onUpdate={(field: "title" | "content", val: string) =>
                updateNote(note.id, field, val)
              }
              onAddEffect={() => handleOpenEffectModal(note.id)}
              effects={
                customEffects?.filter(
                  (e: CustomEffect) => e.link === note.id,
                ) || []
              }
              onRemoveEffect={removeCustomEffect}
              updateHeight={updateNoteHeight}
              onSendNote={setNoteToTransmit}
            />
          ))}
        </AnimatePresence>
      </div>

      <TargetSelectionModal
        isOpen={!!noteToTransmit}
        onClose={() => setNoteToTransmit(null)}
        onSelect={handleSendNote}
      />

      <CustomEffectModal
        isOpen={effectModal.isOpen}
        onClose={effectModal.onClose}
        link={targetNoteId}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        title="APAGAR REGISTRO"
        isDanger
        message={
          <div className="text-left bg-[var(--theme-background)] p-3 border border-[var(--theme-border)] mt-2">
            <span className="font-bold text-[var(--theme-danger)] block mb-1">
              [{noteToDelete?.title}]
            </span>
            <p className="text-[var(--theme-accent)] text-xs truncate whitespace-nowrap">
              {noteToDelete?.content || "Sem conteúdo."}
            </p>
          </div>
        }
        onConfirm={() => {
          if (noteToDelete) deleteNote(noteToDelete.id);
        }}
      />
    </div>
  );
}
