import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCharacterStore } from "../character/store";
import { useVitalsStore } from "./useVitalsStore";
import { Modal } from "../../shared/ui/Overlays";
import { Button, Input } from "../../shared/ui/Form";
import { executeRawRoll } from "../../shared/utils/diceEngine";
import { RetroToast } from "../../shared/ui/RetroToast";
import { dispatchDiscordLog } from "../../shared/utils/discordWebhook";
import { useCharacterStats } from "../../shared/hooks/useCharacterStats";

export function InsanityTransactionModal() {
  const isInsanityOpen = useVitalsStore((state) => state.isInsanityOpen);
  const insanityMode = useVitalsStore((state) => state.insanityMode);
  const isInsanitySystemInjection = useVitalsStore(
    (state) => state.isInsanitySystemInjection,
  );
  const insanityInputValue = useVitalsStore(
    (state) => state.insanityInputValue,
  );
  const setInsanityInputValue = useVitalsStore(
    (state) => state.setInsanityInputValue,
  );
  const closeInsanityModal = useVitalsStore(
    (state) => state.closeInsanityModal,
  );

  const name = useCharacterStore((state) => state.name);
  const insanity = useCharacterStore((state) => state.insanity);
  const updateInsanity = useCharacterStore((state) => state.updateInsanity);
  const updateCrisis = useCharacterStore((state) => state.updateCrisis);
  const { maxInsanity } = useCharacterStats();

  const [step, setStep] = useState<"INPUT" | "CONFIRM">("INPUT");
  const [rolledAmount, setRolledAmount] = useState(0);

  useEffect(() => {
    if (isInsanityOpen && isInsanitySystemInjection && step === "INPUT") {
      handleProcessInput(insanityInputValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInsanityOpen]);

  if (!isInsanityOpen || !insanityMode) return null;

  const handleProcessInput = (valToProcess: string = insanityInputValue) => {
    if (!valToProcess.trim()) return;

    const result = executeRawRoll(valToProcess);
    if (result.error) return RetroToast.error(result.error);

    const absoluteTotal = Math.abs(result.total);
    setRolledAmount(absoluteTotal);
    setStep("CONFIRM");
  };

  const handleConfirm = () => {
    const isAdding = insanityMode === "ADD";

    let newTotal = isAdding
      ? insanity.current + rolledAmount
      : Math.max(0, insanity.current - rolledAmount);

    let crisisTriggered = false;

    if (isAdding && newTotal > maxInsanity) {
      newTotal = maxInsanity;
      crisisTriggered = true;
      updateCrisis({ state: "COLLAPSE", fails: 0, ignore: false });
    }

    updateInsanity(newTotal);

    let logMsg = isAdding
      ? `**CORRUPÇÃO MENTAL:** [${name}] sofreu +${rolledAmount} Ponto(s) de Loucura.`
      : `**RECENTRALIZAÇÃO:** [${name}] aliviou -${rolledAmount} Ponto(s) de Loucura.`;

    if (crisisTriggered) {
      logMsg += `\n**ALERTA: [${name}] atingiu o limite da sanidade e entrou em COLAPSO!**`;
      RetroToast.error(`COLAPSO DETECTADO! LIMITE DE LOUCURA ATINGIDO.`);
    } else {
      RetroToast[isAdding ? "error" : "success"](
        isAdding
          ? `LOUCURA AUMENTADA: +${rolledAmount}`
          : `MENTE ESTABILIZADA: -${rolledAmount}`,
      );
    }

    dispatchDiscordLog("PLAYER", name, logMsg);
    handleClose();
  };

  const handleClose = () => {
    setInsanityInputValue("");
    setStep("INPUT");
    closeInsanityModal();
  };

  return (
    <Modal
      isOpen={isInsanityOpen}
      onClose={handleClose}
      title={
        insanityMode === "ADD"
          ? "REGISTRAR CORRUPÇÃO MENTAL"
          : "REGISTRAR RECENTRALIZAÇÃO"
      }
      isDanger={insanityMode === "ADD"}
    >
      <div className="flex flex-col gap-4">
        {step === "INPUT" ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[var(--theme-accent)] tracking-widest uppercase">
                INSERIR VALOR OU EXPRESSÃO (EX: 1D4, 2)
              </span>
              <Input
                autoFocus
                value={insanityInputValue}
                onChange={(e) => setInsanityInputValue(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleProcessInput(insanityInputValue)
                }
                className={`text-center text-xl font-bold py-3 ${isInsanitySystemInjection ? "opacity-50 cursor-not-allowed border-dashed" : ""}`}
                disabled={isInsanitySystemInjection}
              />
            </div>
            <Button
              variant={insanityMode === "ADD" ? "danger" : "success"}
              onClick={() => handleProcessInput(insanityInputValue)}
              className="py-3"
              disabled={isInsanitySystemInjection}
            >
              PROCESSAR
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            <div
              className={`bg-[var(--theme-background)] border-2 p-3 text-center ${insanityMode === "ADD" ? "border-[var(--theme-danger)] text-[var(--theme-danger)] glow-danger" : "border-[var(--theme-success)] text-[var(--theme-success)] glow-success"}`}
            >
              <span className="text-xl font-bold block mb-1">
                {insanityMode === "ADD"
                  ? "LOUCURA A SER INJETADA"
                  : "LOUCURA A SER REMOVIDA"}
              </span>
              <span className="text-3xl font-mono font-bold">
                {rolledAmount}
              </span>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="primary"
                onClick={() => setStep("INPUT")}
                className="flex-1"
                disabled={isInsanitySystemInjection}
              >
                CANCELAR
              </Button>
              <Button
                variant={insanityMode === "ADD" ? "danger" : "success"}
                onClick={handleConfirm}
                className="flex-1"
              >
                CONFIRMAR
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </Modal>
  );
}
