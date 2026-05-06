import { useState } from "react";
import { useVitalsStore } from "./useVitalsStore";
import { useCharacterStore } from "../character/store";
import { useCharacterStats } from "../../shared/hooks/useCharacterStats";
import { Modal } from "../../shared/ui/Overlays";
import { Button, NumberStepper } from "../../shared/ui/Form";
import { RetroToast } from "../../shared/ui/RetroToast";
import { dispatchDiscordLog } from "../../shared/utils/discordWebhook";

export function QuickRestModal() {
  const { isQuickRestOpen, closeQuickRest } = useVitalsStore();
  const name = useCharacterStore((state) => state.name);
  const sustenance = useCharacterStore((state) => state.sustenance);
  const updateSustenance = useCharacterStore((state) => state.updateSustenance);
  const updateEnergy = useCharacterStore((state) => state.updateEnergy);

  const {
    actualEnergy,
    energyCap,
    slotsPerStage,
    maxEnergy,
    availableSustenanceToSpend,
  } = useCharacterStats();

  let currentStageMax = maxEnergy;
  if (actualEnergy < slotsPerStage) currentStageMax = slotsPerStage;
  else if (actualEnergy < slotsPerStage * 2)
    currentStageMax = slotsPerStage * 2;

  const absoluteMax = Math.min(currentStageMax, energyCap);
  const missingInStage = Math.max(0, absoluteMax - actualEnergy);

  const safeSustenance = isNaN(Number(sustenance.current))
    ? 0
    : Number(sustenance.current);

  const maxConvertible = Math.min(availableSustenanceToSpend, missingInStage);

  const [userAmount, setUserAmount] = useState<number | null>(null);
  const amount = userAmount !== null ? userAmount : maxConvertible;

  if (!isQuickRestOpen) return null;

  const handleClose = () => {
    setUserAmount(null);
    closeQuickRest();
  };

  const handleConfirm = () => {
    if (amount <= 0) {
      RetroToast.error("QUANTIDADE INVÁLIDA PARA CONVERSÃO.");
      return;
    }

    updateSustenance(safeSustenance - amount);
    updateEnergy(actualEnergy + amount);

    const logMsg = `**DESCANSO RÁPIDO:** [${name}] converteu ${amount} de Alimentação em Energia.\nEnergia atual: ${actualEnergy + amount}/${maxEnergy}.`;
    dispatchDiscordLog("PLAYER", name, logMsg);
    RetroToast.success(`+${amount} ENERGIA RESTAURADA.`);

    handleClose();
  };

  return (
    <Modal
      isOpen={isQuickRestOpen}
      onClose={handleClose}
      title="PROTOCOLO: DESCANSO RÁPIDO"
    >
      <div className="flex flex-col gap-4">
        <div className="bg-[var(--theme-warning)]/10 border border-[var(--theme-warning)] p-3 text-center">
          <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--theme-warning)] block mb-2">
            METABOLISMO EM CONVERSÃO
          </span>
          <p className="text-[11px] font-mono text-[var(--theme-text)]/70 uppercase">
            Converte pontos de nutrição disponíveis diretamente para estâmina
            dentro do limiar do estágio atual sem comprometer a capacidade
            máxima de energia.
          </p>
        </div>

        <div className="flex justify-between items-center p-3 bg-black border border-[var(--theme-border)]">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[var(--theme-accent)] tracking-widest uppercase">
              NUTRIÇÃO SEGURA
            </span>
            <span className="text-xl font-mono text-[var(--theme-accent)]">
              {availableSustenanceToSpend}{" "}
              <span className="text-xs text-[var(--theme-text)]/50">
                / {safeSustenance} TOTAL
              </span>
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-[var(--theme-accent)] tracking-widest uppercase">
              DEFICIT DO ESTÁGIO
            </span>
            <span className="text-xl font-mono text-[var(--theme-accent)]">
              {missingInStage}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-center justify-center my-4">
          <span className="text-[10px] font-bold text-[var(--theme-warning)] tracking-widest uppercase">
            TAXA DE CONVERSÃO
          </span>
          <NumberStepper
            value={amount}
            onDecrement={() => setUserAmount(Math.max(0, amount - 1))}
            onIncrement={() =>
              setUserAmount(Math.min(maxConvertible, amount + 1))
            }
            disableDecrement={amount <= 0}
            disableIncrement={amount >= maxConvertible}
          />
        </div>

        <div className="flex justify-end gap-2 mt-2 border-t border-[var(--theme-border)] pt-4">
          <Button
            className="flex-1 border-dashed"
            onClick={handleClose}
            variant="danger"
          >
            CANCELAR
          </Button>
          <Button
            className="flex-1"
            disabled={amount <= 0}
            onClick={handleConfirm}
            variant="warning"
          >
            CONFIRMAR CONVERSÃO
          </Button>
        </div>
      </div>
    </Modal>
  );
}
