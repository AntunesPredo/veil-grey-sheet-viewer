import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCharacterStore } from "../character/store";
import { VG_CONFIG } from "../../shared/config/system.config";
import { Button, Checkbox, NumberStepper } from "../../shared/ui/Form";
import { RetroToast } from "../../shared/ui/RetroToast";
import { Accordion } from "../../shared/ui/Accordion";
import type { Disadvantage } from "../../shared/types/veil-grey";

export function DisadvantagesScreen() {
  const confirmDisadvantages = useCharacterStore(
    (state) => state.confirmDisadvantages,
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [link1, setLink1] = useState(false);
  const [link2, setLink2] = useState(false);

  const [distAttr, setDistAttr] = useState(0);
  const [distSkill, setDistSkill] = useState(0);

  const [accordions, setAccordions] = useState<Record<string, boolean>>({
    physical: true,
    mental: true,
    social: true,
  });

  const toggleAccordion = (key: string) =>
    setAccordions((p) => ({ ...p, [key]: !p[key] }));

  const virtualPoints = useMemo(() => {
    const base = selectedIds.length * 2;
    const bonus = (link1 ? 1 : 0) + (link2 && selectedIds.length === 4 ? 1 : 0);
    return Math.min(base + bonus, 10);
  }, [selectedIds, link1, link2]);

  const allocatedPoints = distAttr + distSkill;
  const pointsRemaining = virtualPoints - allocatedPoints;

  const handleToggle = (item: Disadvantage) => {
    setSelectedIds((prev) => {
      if (prev.includes(item.id)) {
        const next = prev.filter((id) => id !== item.id);
        if (next.length < 4) setLink2(false);
        if (next.length < 2) setLink1(false);
        autoAdjustDistribution(next.length, link1, link2);
        return next;
      }

      if (prev.length >= 4) {
        RetroToast.warning("MÁXIMO DE 4 DESVANTAGENS ALCANÇADO.");
        return prev;
      }

      const catCount = prev.filter((id) => {
        const flaw = Object.values(VG_CONFIG.disadvantages)
          .flatMap((g) => g.items)
          .find((i) => i.id === id);
        return flaw?.categoryId === item.categoryId;
      }).length;

      if (catCount >= 2) {
        RetroToast.warning("OVERLOAD: MÁXIMO DE 2 ANOMALIAS POR CATEGORIA.");
        return prev;
      }

      return [...prev, item.id];
    });
  };

  const autoAdjustDistribution = (
    flawCount: number,
    l1: boolean,
    l2: boolean,
  ) => {
    const newMax = Math.min(
      flawCount * 2 + (l1 ? 1 : 0) + (l2 && flawCount === 4 ? 1 : 0),
      10,
    );
    if (distAttr + distSkill > newMax) {
      setDistAttr(0);
      setDistSkill(0);
    }
  };

  const handleConfirm = () => {
    if (pointsRemaining !== 0 && virtualPoints > 0) {
      RetroToast.error(
        "ALOCAR TODOS OS RECURSOS VIRTUAIS ANTES DE PROSSEGUIR.",
      );
      return;
    }
    const fullFlaws = Object.values(VG_CONFIG.disadvantages)
      .flatMap((g) => g.items)
      .filter((i) => selectedIds.includes(i.id));

    confirmDisadvantages(fullFlaws, distAttr, distSkill);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-2 md:p-6 gap-4 border-x-2 border-[var(--theme-danger)]">
      <div className="border-b-2 border-[var(--theme-danger)] pb-2 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-end">
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-black font-mono tracking-widest text-[var(--theme-danger)] uppercase glow-danger">
            SYS.INIT // REGISTRO DE DESVANTAGENS
          </h1>
          <p className="text-[14px] font-mono text-[var(--theme-danger)]/70 font-black uppercase max-w-2xl mt-1">
            &gt; IDENTIFICAÇÃO DE FALHAS SISTÊMICAS.
            <br />
            &gt; COMPENSAÇÃO DE RECURSOS VIRTUAIS HABILITADA.
          </p>
        </div>
        <div className="text-[12px] font-mono text-white px-2 bg-[var(--theme-danger)] font-bold text-right mt-2 md:mt-0 animate-pulse">
          STATUS: AGUARDANDO_INPUT
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-y-auto custom-scrollbar md:overflow-hidden">
        <div className="flex-1 flex flex-col h-fit md:h-auto md:overflow-y-auto custom-scrollbar border-2 border-[var(--theme-border)] bg-[var(--theme-background)] p-2 gap-2 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
          {Object.entries(VG_CONFIG.disadvantages).map(([key, group]) => {
            const groupSelected = group.items.filter((i) =>
              selectedIds.includes(i.id),
            );

            return (
              <div
                key={key}
                className="flex flex-col border-2 border-[var(--theme-border)] bg-[var(--theme-background)]"
              >
                <Accordion
                  isOpen={accordions[key]}
                  onToggle={() => toggleAccordion(key)}
                  title={`${group.label} [${groupSelected.length}/2]`}
                >
                  <div className="grid grid-cols-1 gap-2 p-2 bg-[var(--theme-background)]">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex flex-col p-3 border-2 cursor-pointer transition-colors ${selectedIds.includes(item.id) ? "bg-[var(--theme-danger)]/10 border-[var(--theme-danger)] shadow-[0_0_10px_rgba(139,0,0,0.2)]" : "bg-black border-[var(--theme-border)] hover:border-[var(--theme-danger)]/50"}`}
                        onClick={() => handleToggle(item)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span
                            className={`font-black font-mono text-[11px] uppercase tracking-widest ${selectedIds.includes(item.id) ? "text-[var(--theme-danger)] glow-danger" : "text-[var(--theme-accent)]"}`}
                          >
                            {item.title}
                          </span>
                          <div
                            className={`w-3 h-3 border-2 shrink-0 flex items-center justify-center ${selectedIds.includes(item.id) ? "border-[var(--theme-danger)] bg-[var(--theme-danger)]" : "border-[var(--theme-border)]"}`}
                          >
                            {selectedIds.includes(item.id) && (
                              <div className="w-1.5 h-1.5 bg-black" />
                            )}
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-[var(--theme-text)]/60 leading-tight uppercase mt-1">
                          {item.description}
                        </span>
                        {item.effects.length > 0 &&
                          item.effects.map((e) => {
                            const isPositive = e.val > 0;
                            return (
                              <div
                                className={`mt-2 text-[9px] font-mono font-bold ${isPositive ? "text-[var(--theme-success)]" : "text-[var(--theme-danger)]"} uppercase border-t border-dashed border-[var(--theme-danger)]/30 pt-1`}
                              >
                                &gt; [{e.mode}] TARGET: {e.target} (
                                {isPositive ? "+" : ""}
                                {e.val})
                              </div>
                            );
                          })}
                      </div>
                    ))}
                  </div>
                </Accordion>

                <AnimatePresence>
                  {!accordions[key] && groupSelected.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-wrap gap-2 p-2 bg-[var(--theme-background)] border-t-2 border-[var(--theme-border)]"
                    >
                      {groupSelected.map((i) => (
                        <span
                          key={`badge-${i.id}`}
                          className="text-[9px] bg-[var(--theme-danger)]/20 text-[var(--theme-danger)] border border-[var(--theme-danger)] px-2 py-0.5 font-black font-mono tracking-widest uppercase"
                        >
                          {i.title}
                        </span>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="w-full md:w-[380px] shrink-0 flex flex-col gap-4 md:h-auto md:overflow-y-auto custom-scrollbar scroll-left">
          <div className="border-2 border-[var(--theme-border)] bg-black p-3 flex flex-col gap-3">
            <span className="text-[11px] font-black font-mono text-[var(--theme-accent)] tracking-widest uppercase border-b-2 border-[var(--theme-border)] pb-2 mb-1">
              BÔNUS DE COMBO
            </span>
            <div className="flex flex-col gap-3">
              <Checkbox
                label="LINK 1 (+1 RECURSO_VIRTUAL)"
                checked={link1}
                onChange={() => {
                  setLink1(!link1);
                  autoAdjustDistribution(selectedIds.length, !link1, link2);
                }}
                disabled={selectedIds.length < 2}
              />
              <Checkbox
                label="LINK 2 (+1 RECURSO_VIRTUAL)"
                checked={link2}
                onChange={() => {
                  setLink2(!link2);
                  autoAdjustDistribution(selectedIds.length, link1, !link2);
                }}
                disabled={selectedIds.length < 4}
              />
              <span className="text-[9px] font-mono text-[var(--theme-text)]/50 leading-relaxed border-l-2 border-[var(--theme-border)] pl-2 mt-1">
                * Caso duas desvantagens possam ser somandas em algum contexto
                mais complexo anterior ou futuro é concedido um Bônus pela
                complexidade.
                <br />
                Requer aprovação do M.D.
              </span>
            </div>
          </div>

          <div className="border-2 border-[var(--theme-danger)] bg-[var(--theme-danger)]/5 p-4 flex flex-col gap-4 flex-1 shadow-[inset_0_0_15px_rgba(139,0,0,0.1)] relative">
            <div className="absolute top-1 left-1 w-2 h-2 bg-[var(--theme-danger)] opacity-60" />

            <div className="flex justify-between items-center border-b-2 border-[var(--theme-danger)]/50 pb-2">
              <span className="text-[12px] font-black font-mono text-[var(--theme-danger)] tracking-widest uppercase">
                RECURSOS ALOCÁVEIS
              </span>
              <span className="text-3xl font-black font-mono text-[var(--theme-danger)] glow-danger leading-none">
                {virtualPoints}
              </span>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <div className="flex justify-between items-center bg-[var(--theme-background)] border-2 border-[var(--theme-danger)]/30 p-2">
                <span className="text-[10px] font-black font-mono text-[var(--theme-danger)] uppercase tracking-widest">
                  ENVIAR PARA: ATRIBUTOS
                </span>
                <NumberStepper
                  size="sm"
                  value={distAttr}
                  onDecrement={() => setDistAttr((p) => Math.max(0, p - 1))}
                  onIncrement={() => setDistAttr((p) => p + 1)}
                  disableDecrement={distAttr === 0}
                  disableIncrement={distAttr >= 5 || pointsRemaining === 0}
                />
              </div>
              <div className="flex justify-between items-center bg-[var(--theme-background)] border-2 border-[var(--theme-danger)]/30 p-2">
                <span className="text-[10px] font-black font-mono text-[var(--theme-danger)] uppercase tracking-widest">
                  ENVIAR PARA: PERÍCIAS
                </span>
                <NumberStepper
                  size="sm"
                  value={distSkill}
                  onDecrement={() => setDistSkill((p) => Math.max(0, p - 1))}
                  onIncrement={() => setDistSkill((p) => p + 1)}
                  disableDecrement={distSkill === 0}
                  disableIncrement={distSkill >= 5 || pointsRemaining === 0}
                />
              </div>
            </div>

            <div className="mt-auto pt-4 border-t-2 border-dashed border-[var(--theme-danger)]/30 flex flex-col gap-3">
              <div
                className={`text-right text-[10px] font-black font-mono uppercase tracking-widest ${pointsRemaining === 0 ? "text-[var(--theme-success)]" : "text-[var(--theme-warning)] animate-pulse"}`}
              >
                {pointsRemaining === 0
                  ? "BALANCEAMENTO_COMPLETO"
                  : `DEFICIT_DE_ALOCAÇÃO: ${pointsRemaining}`}
              </div>

              <Button
                variant="danger"
                className={`w-full py-4 text-xs ${pointsRemaining === 0 && virtualPoints > 0 ? "shadow-[0_0_15px_var(--theme-danger)]" : ""}`}
                onClick={handleConfirm}
                disabled={pointsRemaining !== 0 && virtualPoints > 0}
              >
                [{" "}
                {selectedIds.length === 0
                  ? "PROSSEGUIR SEM DESVANTAGENS"
                  : "VINCULAR DESVANTAGENS & INICIAR"}{" "}
                ]
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
