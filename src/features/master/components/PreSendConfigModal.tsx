import { useState } from "react";
import { Modal } from "../../../shared/ui/Overlays";
import { Button, NumberStepper } from "../../../shared/ui/Form";
import type { Item, CustomEffect } from "../../../shared/types/veil-grey";

interface PreSendPayload {
  id: string | number;
  type: "ITEM" | "EFFECT";
  data: Item | CustomEffect;
}

interface PreSendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  payloads: PreSendPayload[];
  onConfirmTargeting: (finalPayloads: PreSendPayload[]) => void;
}

export function PreSendConfigModal({
  isOpen,
  onClose,
  payloads,
  onConfirmTargeting,
}: PreSendConfigModalProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const [prevIsOpen, setPrevIsOpen] = useState(false);

  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    const initial: Record<string, number> = {};
    payloads.forEach((p) => {
      if (p.type === "ITEM") initial[p.id] = (p.data as Item).quantity || 1;
    });
    setQuantities(initial);
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  const updateQty = (id: string, val: number) =>
    setQuantities((prev) => ({ ...prev, [id]: val }));

  const handleNext = () => {
    const finalPayloads = payloads.map((p) => {
      if (p.type === "ITEM") {
        return { ...p, data: { ...p.data, quantity: quantities[p.id] || 1 } };
      }
      return p;
    });
    onConfirmTargeting(finalPayloads);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="CONFIGURAÇÃO DE REMESSA"
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-4">
        <span className="text-xs font-mono text-[var(--theme-text)]/70 uppercase">
          Ajuste as quantidades dos itens antes de selecionar os alvos da
          transmissão.
        </span>
        <div className="max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col gap-2">
          {payloads.map((p) => (
            <div
              key={p.id}
              className="flex justify-between items-center p-2 border border-[var(--theme-border)] bg-[var(--theme-background)]/50"
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[var(--theme-accent)] tracking-widest uppercase">
                  [{p.type}]{" "}
                  {p.type === "ITEM"
                    ? (p.data as Item).name
                    : (p.data as CustomEffect).description}
                </span>
              </div>
              {p.type === "ITEM" && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase tracking-widest opacity-60">
                    QTD ENVIADA:
                  </span>
                  <NumberStepper
                    size="sm"
                    value={quantities[p.id] || 1}
                    onDecrement={() =>
                      updateQty(
                        typeof p.id === "string" ? p.id : p.id.toString(),
                        Math.max(1, (quantities[p.id] || 1) - 1),
                      )
                    }
                    onIncrement={() =>
                      updateQty(
                        typeof p.id === "string" ? p.id : p.id.toString(),
                        (quantities[p.id] || 1) + 1,
                      )
                    }
                    disableDecrement={(quantities[p.id] || 1) <= 1}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-end pt-4 border-t border-[var(--theme-border)]">
          <Button
            variant="danger"
            onClick={onClose}
            className="border-dashed flex-1"
          >
            CANCELAR
          </Button>
          <Button
            variant="warning"
            onClick={handleNext}
            className="animate-pulse flex-[2]"
          >
            AVANÇAR PARA SELEÇÃO DE ALVOS &gt;
          </Button>
        </div>
      </div>
    </Modal>
  );
}
