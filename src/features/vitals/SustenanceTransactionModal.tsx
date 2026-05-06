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
import { VG_CONFIG } from "../../shared/config/system.config";

export function SustenanceTransactionModal() {
  const {
    isSustenanceOpen,
    sustenanceMode,
    isSustenanceSystemInjection,
    sustenanceInputValue,
    setSustenanceInputValue,
    closeSustenanceModal,
  } = useVitalsStore();

  const name = useCharacterStore((state) => state.name);
  const sustenance = useCharacterStore((state) => state.sustenance);
  const attributes = useCharacterStore((state) => state.attributes);
  const hp = useCharacterStore((state) => state.hp);

  const updateSustenance = useCharacterStore((state) => state.updateSustenance);
  const applyDamage = useCharacterStore((state) => state.applyDamage);
  const updateHpTemp = useCharacterStore((state) => state.updateHpTemp);

  const { maxSustenance, isOverweight } = useCharacterStats();

  const [step, setStep] = useState<"INPUT" | "CONFIRM">("INPUT");
  const [rolledAmount, setRolledAmount] = useState(0);

  useEffect(() => {
    if (isSustenanceOpen && isSustenanceSystemInjection && step === "INPUT") {
      handleProcessInput(sustenanceInputValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSustenanceOpen]);

  if (!isSustenanceOpen || !sustenanceMode) return null;

  const isSub = sustenanceMode === "SUB";

  const effectiveValue = isOverweight
    ? isSub
      ? rolledAmount * 2
      : Math.max(1, Math.floor(rolledAmount / 2))
    : rolledAmount;

  const handleProcessInput = (valToProcess: string = sustenanceInputValue) => {
    if (!valToProcess.trim()) return;
    const result = executeRawRoll(valToProcess);
    if (result.error) return RetroToast.error(result.error);

    setRolledAmount(result.total);
    setStep("CONFIRM");
  };

  const handleConfirm = () => {
    let logModifiers = "";

    if (isOverweight) {
      logModifiers += isSub
        ? "\n> [!] PENALIDADE DE SOBRECARGA: Consumo Metabólico x2."
        : "\n> [!] PENALIDADE DE SOBRECARGA: Uso Energético Imediato /2.";
    }

    let newSustenance = isSub
      ? sustenance.current - effectiveValue
      : sustenance.current + effectiveValue;

    let hpDamage = 0;
    let tempHpAdded = 0;

    if (newSustenance < 0) {
      const deficit = Math.abs(newSustenance);
      hpDamage = deficit * VG_CONFIG.rules.starvationHpDamagePerPoint;
      newSustenance = 0;
    } else if (newSustenance > maxSustenance) {
      const excess = newSustenance - maxSustenance;
      const tempPerPoint = Math.max(1, Math.floor(attributes.constitution / 2));
      tempHpAdded = Math.min(
        excess * tempPerPoint,
        attributes.constitution * 2,
      );
      newSustenance = maxSustenance;
    }

    updateSustenance(newSustenance);

    let logMsg = !isSub
      ? `**INGESTÃO CALÓRICA:** [${name}] processou +${effectiveValue} Ponto(s) de Alimentação.`
      : `**DESGASTE METABÓLICO:** [${name}] perdeu -${effectiveValue} Ponto(s) de Alimentação.`;

    logMsg += logModifiers;

    if (hpDamage > 0) {
      applyDamage(hpDamage, "IGNORE", null);
      logMsg += `\n> **[FALHA] INANIÇÃO PROFUNDA:** -${hpDamage} PV consumidos da integridade vital.`;
      RetroToast.error(`FALHA ESTRUTURAL: INANIÇÃO CAUSOU -${hpDamage} PV.`);
    }

    if (tempHpAdded > 0) {
      updateHpTemp(hp.temp + tempHpAdded);
      logMsg += `\n> **[OVERHEAL] EXCESSO NUTRICIONAL:** +${tempHpAdded} PV Temporários alocados.`;
      RetroToast.success(`OVERHEAL: +${tempHpAdded} PV TEMP.`);
    }

    dispatchDiscordLog("PLAYER", name, logMsg);
    handleClose();
  };

  const handleClose = () => {
    setSustenanceInputValue("");
    setStep("INPUT");
    closeSustenanceModal();
  };

  return (
    <Modal
      isOpen={isSustenanceOpen}
      onClose={handleClose}
      title={!isSub ? "PROCESSAR NUTRIÇÃO" : "DRENAR METABOLISMO"}
      isDanger={isSub}
    >
      <div className="flex flex-col gap-4">
        {step === "INPUT" ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[var(--theme-accent)] tracking-widest uppercase">
                INPUT DIRETO OU EXPRESSÃO (EX: 1D4, 2)
              </span>
              <Input
                autoFocus
                value={sustenanceInputValue}
                onChange={(e) => setSustenanceInputValue(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleProcessInput(sustenanceInputValue)
                }
                className={`text-center text-xl font-bold py-3 ${isSustenanceSystemInjection ? "opacity-50 cursor-not-allowed border-dashed" : ""}`}
                disabled={isSustenanceSystemInjection}
              />
            </div>
            <Button
              variant={!isSub ? "success" : "danger"}
              onClick={() => handleProcessInput(sustenanceInputValue)}
              className="py-3"
              disabled={isSustenanceSystemInjection}
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
              className={`bg-[var(--theme-background)] border-2 p-3 text-center flex flex-col items-center justify-center ${isSub ? "border-[var(--theme-danger)] text-[var(--theme-danger)] glow-danger" : "border-[var(--theme-success)] text-[var(--theme-success)] glow-success"}`}
            >
              <span className="text-xl font-bold block mb-1 tracking-widest uppercase">
                {isSub ? "IMPACTO METABÓLICO FINAL" : "ABSORÇÃO CALÓRICA FINAL"}
              </span>
              <span className="text-5xl font-mono font-black py-2">
                {effectiveValue}
              </span>

              {isOverweight && (
                <div
                  className="flex flex-col gap-1 mt-2 border-t border-dashed pt-2 w-full"
                  style={{ borderColor: "currentColor" }}
                >
                  <span className="text-[14px] text-[var(--theme-warning)] animate-pulse tracking-widest glow-warning uppercase font-bold">
                    [!] PENALIDADE DE SOBRECARGA ATIVA
                  </span>
                  <span className="text-[11px] text-[var(--theme-text)] uppercase font-mono">
                    BASE CAPTURADA: {rolledAmount} | MODIFICADOR FISICO{" "}
                    {isSub ? "- MULTIPLICAÇÃO (x2)" : "- DIVISÃO (/2)"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="primary"
                onClick={() => setStep("INPUT")}
                className="flex-1 border-dashed"
                disabled={isSustenanceSystemInjection}
              >
                REVERTER
              </Button>
              <Button
                variant={!isSub ? "success" : "danger"}
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
