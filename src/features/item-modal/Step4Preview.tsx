import { motion } from "framer-motion";
import { ItemNodeWrapper } from "../inventory/components/ItemNodeWrapper";
import type { ItemFormData } from "./ItemModal";
import { buildFinalItem } from "./buildFinalItem";
import { useDisclosure } from "../../shared/hooks/useDisclosure";
import { CustomEffectModal } from "../stats/CustomEffectModal";
import { EffectsList } from "../../shared/ui/EffectsList";
import { Button } from "../../shared/ui/Form";
import { getAllowedModes } from "../../shared/utils/effectUtils";
import type { CustomEffect, InstantAction } from "../../shared/types/veil-grey";
import { InstantActionModal } from "../stats/InstantActionModal";

interface Step4PreviewProps {
  formData: ItemFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItemFormData>>;
}

export function Step4Preview({ formData, setFormData }: Step4PreviewProps) {
  const mockItem = buildFinalItem(formData);
  const effectModal = useDisclosure();
  const actionModal = useDisclosure();
  const allowedModes = getAllowedModes(formData.type);

  const handleSaveEffect = (newEffect: CustomEffect) => {
    setFormData((p) => ({ ...p, effects: [...p.effects, newEffect] }));
  };

  const handleRemoveEffect = (id: number) => {
    setFormData((p) => ({
      ...p,
      effects: p.effects.filter((e) => e.id !== id),
    }));
  };

  const handleSaveAction = (newAction: InstantAction) => {
    setFormData((p) => ({
      ...p,
      instantActions: [...p.instantActions, newAction],
    }));
  };

  const handleRemoveAction = (id: string) => {
    setFormData((p) => ({
      ...p,
      instantActions: p.instantActions.filter((a) => a.id !== id),
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-6 pt-2"
    >
      <div className="flex flex-col items-center text-center gap-2">
        <span className="text-[10px] font-bold text-[var(--theme-accent)] tracking-widest uppercase border-b border-[var(--theme-accent)]/30 pb-1">
          ANÁLISE DE ESTRUTURA (PRÉVIA)
        </span>
        <span className="text-xs text-[var(--theme-text)]/70">
          Valide a assinatura de dados antes da síntese final na matriz.
        </span>
      </div>

      <div className="w-full pointer-events-none p-4 bg-[var(--theme-background)]/40 border border-dashed border-[var(--theme-border)] flex justify-center">
        <div className="w-full max-w-[340px]">
          <ItemNodeWrapper
            item={mockItem}
            allInventory={[]}
            onEdit={() => {}}
            onDelete={() => {}}
            activeDragId={null}
            isEditMode={false}
            isOverlay={true}
          />
        </div>
      </div>

      {allowedModes.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-dashed border-[var(--theme-border)] pt-4 w-full">
          <div className="flex justify-between items-center bg-[var(--theme-background)]/80 p-2 border border-[var(--theme-border)]">
            <span className="text-[10px] font-bold text-[var(--theme-accent)] tracking-widest uppercase">
              EFEITOS ANEXADOS
            </span>
            <Button
              size="sm"
              onClick={effectModal.onOpen}
              className="border-dashed px-2 py-1 text-[9px]"
            >
              + INJETAR EFEITO
            </Button>
          </div>
          <div className="max-h-[150px] overflow-y-auto custom-scrollbar">
            <EffectsList
              effects={formData.effects}
              onRemove={handleRemoveEffect}
            />
          </div>
        </div>
      )}

      {formData.hasInstantActions && (
        <div className="flex flex-col gap-2 border-t border-dashed border-[var(--theme-border)] pt-4 w-full">
          <div className="flex justify-between items-center bg-[var(--theme-background)]/80 p-2 border border-[var(--theme-border)]">
            <span className="text-[10px] font-bold text-[var(--theme-success)] tracking-widest uppercase">
              AÇÕES IMEDIATAS (CONSUMÍVEL)
            </span>
            <Button
              size="sm"
              variant="success"
              onClick={actionModal.onOpen}
              className="border-dashed px-2 py-1 text-[9px]"
            >
              + INJETAR AÇÃO
            </Button>
          </div>
          <div className="max-h-[150px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
            {formData.instantActions.map((act) => (
              <div
                key={act.id}
                className="flex justify-between items-center bg-[var(--theme-success)]/10 border border-[var(--theme-success)]/30 p-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-[var(--theme-success)]">
                    [{act.target}]
                  </span>
                  <span className="text-[10px] font-mono text-[var(--theme-text)]">
                    {act.description} ({act.val > 0 ? `+${act.val}` : act.val})
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  className="h-5 px-1.5 py-0 border-none"
                  onClick={() => handleRemoveAction(act.id)}
                >
                  X
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <CustomEffectModal
        isOpen={effectModal.isOpen}
        onClose={effectModal.onClose}
        allowedModes={allowedModes}
        onSave={handleSaveEffect}
      />

      <InstantActionModal
        isOpen={actionModal.isOpen}
        onClose={actionModal.onClose}
        onSave={handleSaveAction}
      />
    </motion.div>
  );
}
