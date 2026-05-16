import { useState } from "react";
import { useVitalsStore } from "./useVitalsStore";
import { useCharacterStore } from "../character/store";
import { useCharacterStats } from "../../shared/hooks/useCharacterStats";
import { Modal } from "../../shared/ui/Overlays";
import { Button, Checkbox } from "../../shared/ui/Form";
import { executeRawRoll } from "../../shared/utils/diceEngine";
import { RetroToast } from "../../shared/ui/RetroToast";
import { dispatchDiscordLog } from "../../shared/utils/discordWebhook";
import { VG_CONFIG } from "../../shared/config/system.config";
import { REST_DIFFICULTIES } from "../../shared/utils/selectOptions";

export function FullRestModal() {
  const { isFullRestOpen, closeFullRest } = useVitalsStore();
  const name = useCharacterStore((state) => state.name);
  const sustenance = useCharacterStore((state) => state.sustenance);
  const updateSustenance = useCharacterStore((state) => state.updateSustenance);
  const updateEnergy = useCharacterStore((state) => state.updateEnergy);
  const applyDamage = useCharacterStore((state) => state.applyDamage);

  const { actualEnergy, slotsPerStage, maxEnergy, sustanceStages } =
    useCharacterStats();

  const [shelter, setShelter] = useState(false);
  const [temp, setTemp] = useState(false);
  const [food, setFood] = useState(false);
  const [difficulty, setDifficulty] = useState(15);

  const [step, setStep] = useState<"CONFIG" | "RESULT">("CONFIG");
  const [resultData, setResultData] = useState<{
    roll: number;
    success: boolean;
    sustenanceLoss: number;
    damageTaken: number;
    newEnergy: number;
  } | null>(null);

  if (!isFullRestOpen) return null;

  const handleRollRest = () => {
    const mod = (shelter ? 2 : -2) + (temp ? 2 : -2) + (food ? 2 : -2);
    const roll = executeRawRoll(`1d20+${mod}`);

    if (roll.error) return RetroToast.error(roll.error);

    const success = roll.total >= difficulty || roll.isCriticalSuccess;

    const thresholdStarving = sustanceStages[0] - 1;
    const thresholdHungry = thresholdStarving + sustanceStages[1];
    const thresholdSatiated = thresholdHungry + sustanceStages[2];

    let newSustenance = 0;
    let hpDamage = 0;
    let sustenanceLoss = 0;

    if (sustenance.current > thresholdSatiated) {
      newSustenance = thresholdHungry + 1;
    } else if (sustenance.current > thresholdHungry) {
      newSustenance = thresholdStarving + 1;
    } else if (sustenance.current > thresholdStarving) {
      newSustenance = 0;
    } else {
      newSustenance = 0;
      hpDamage =
        (sustenance.current + 1) * VG_CONFIG.rules.starvationHpDamagePerPoint;
    }

    sustenanceLoss = sustenance.current - newSustenance;

    let newEnergy = actualEnergy;
    if (success) {
      let currentLevelMax = maxEnergy;
      if (actualEnergy <= slotsPerStage) currentLevelMax = slotsPerStage;
      else if (actualEnergy <= slotsPerStage * 2)
        currentLevelMax = slotsPerStage * 2;

      newEnergy = Math.min(maxEnergy, currentLevelMax + slotsPerStage);

      let newCap = maxEnergy;
      if (newSustenance <= thresholdStarving) newCap = slotsPerStage;
      else if (newSustenance <= thresholdHungry) newCap = slotsPerStage * 2;

      newEnergy = Math.min(newEnergy, newCap);
    }

    setResultData({
      roll: roll.total,
      success,
      sustenanceLoss,
      damageTaken: hpDamage,
      newEnergy,
    });

    setStep("RESULT");

    const damageMsg =
      hpDamage > 0
        ? `\n**[!] FALHA POR INANIÇÃO:** Dano Estrutural de ${hpDamage} PV aplicado.`
        : "";
    const resultText = success
      ? `SUCESSO (Energia -> ${newEnergy}/${maxEnergy})`
      : `FALHA (Energia Mantida: ${newEnergy}/${maxEnergy})`;

    const logMsg = `**CICLO DE DESCANSO:** [${name}]\n**Dificuldade Alvo:** DC ${difficulty}\n**Modificadores Locais:** Abrigo(${shelter ? "+2" : "-2"}), Temp(${temp ? "+2" : "-2"}), Nutrição(${food ? "+2" : "-2"})\n**Rolagem:** ${roll.total}\n**Resultado:** ${resultText}\n**Alimentação Drenada:** ${sustenanceLoss} pts.${damageMsg}`;

    dispatchDiscordLog("PLAYER", name, logMsg);
  };

  const handleFinish = () => {
    if (resultData) {
      updateSustenance(sustenance.current - resultData.sustenanceLoss);
      if (resultData.damageTaken > 0)
        applyDamage(resultData.damageTaken, "IGNORE", null);
      updateEnergy(resultData.newEnergy);
    }

    setStep("CONFIG");
    setResultData(null);
    closeFullRest();
  };

  return (
    <Modal
      isOpen={isFullRestOpen}
      onClose={closeFullRest}
      title="PROTOCOLO: DESCANSO LONGO"
    >
      <div className="flex flex-col gap-4">
        {step === "CONFIG" ? (
          <>
            <div className="bg-[var(--theme-accent)]/5 border border-[var(--theme-accent)] p-3 text-center">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--theme-accent)] block mb-2">
                VARIÁVEIS AMBIENTAIS
              </span>
              <p className="text-[10px] font-mono text-[var(--theme-text)]/70 uppercase text-justify">
                As condições do ambiente afetam drasticamente sua capacidade de
                reparo biológico. Variáveis ausentes aplicam penalidades (-2).
                Variáveis ativas concedem bônus (+2).
              </p>
            </div>

            <div className="flex flex-col gap-3 p-3 bg-[var(--theme-background)] border border-[var(--theme-border)]">
              <Checkbox
                checked={shelter}
                label="ABRIGO SEGURO E CONFORTÁVEL"
                onChange={() => setShelter(!shelter)}
              />
              <Checkbox
                checked={temp}
                label="TEMPERATURA ESTABILIZADA"
                onChange={() => setTemp(!temp)}
              />
              <Checkbox
                checked={food}
                label="BEM ALIMENTADO ANTES DE DORMIR"
                onChange={() => setFood(!food)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-[var(--theme-warning)] tracking-widest uppercase">
                DIFICULDADE DA ÁREA (DC)
              </span>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value))}
                className="bg-black border border-[var(--theme-warning)]/50 text-[var(--theme-warning)] p-3 text-xs font-mono outline-none uppercase font-bold"
              >
                {REST_DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col text-[9px] font-mono text-[var(--theme-danger)] italic border-t border-[var(--theme-border)] border-dashed pt-2 mt-2">
              * O descanso longo sempre reduzirá seu limiar de fome para o
              estágio inferior ou causará dano caso esteja em Inanição.
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button
                className="flex-1 border-dashed"
                onClick={closeFullRest}
                variant="danger"
              >
                CANCELAR
              </Button>
              <Button
                className="flex-1"
                onClick={handleRollRest}
                variant="primary"
              >
                EXECUTAR CICLO
              </Button>
            </div>
          </>
        ) : (
          <>
            <div
              className={`border p-4 text-center ${resultData?.success ? "bg-[var(--theme-success)]/10 border-[var(--theme-success)]" : "bg-[var(--theme-danger)]/10 border-[var(--theme-danger)]"}`}
            >
              <span className="text-[10px] font-bold tracking-widest uppercase block mb-1">
                RESULTADO DO REPOUSO
              </span>
              <span
                className={`text-4xl font-mono font-black ${resultData?.success ? "text-[var(--theme-success)] glow-success" : "text-[var(--theme-danger)] glow-danger"}`}
              >
                {resultData?.roll}
              </span>
              <span
                className={`text-[11px] uppercase tracking-widest font-bold block mt-2 ${resultData?.success ? "text-[var(--theme-success)]" : "text-[var(--theme-danger)]"}`}
              >
                {resultData?.success
                  ? "[ SUCESSO NO REPARO ]"
                  : "[ DESCANSO PERTURBADO ]"}
              </span>
            </div>

            <div className="flex flex-col gap-2 p-3 bg-black border border-[var(--theme-border)]">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold text-[var(--theme-accent)] uppercase">
                <span>ENERGIA ATUALIZADA:</span>
                <span>
                  {resultData?.newEnergy} / {maxEnergy}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono font-bold text-[var(--theme-warning)] uppercase">
                <span>METABOLISMO DRENADO:</span>
                <span>-{resultData?.sustenanceLoss} PTS</span>
              </div>
              {resultData?.damageTaken ? (
                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-[var(--theme-danger)] uppercase animate-pulse">
                  <span>DANO POR INANIÇÃO:</span>
                  <span>-{resultData?.damageTaken} PV</span>
                </div>
              ) : null}
            </div>

            <Button
              className="w-full mt-2 py-4"
              onClick={handleFinish}
              variant="primary"
            >
              CONCLUIR E ACORDAR
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
