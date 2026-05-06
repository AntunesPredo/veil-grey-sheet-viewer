import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  generateInjectionHash,
  type InjectPayloadType,
} from "../../shared/utils/hashIntegration";
import { Button, Checkbox, Input } from "../../shared/ui/Form";
import type { InstantActionTarget } from "../../shared/types/veil-grey";
import { useCharacterStore } from "../character/store";
import { Modal } from "../../shared/ui/Overlays";

type DraftPayload = {
  _tempId: string;
  type: InjectPayloadType;
  singleUse: boolean;
  data: unknown;
  label: string;
};

export function HashGeneratorModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const inventory = useCharacterStore((state) => state.inventory);
  const customEffects = useCharacterStore((state) => state.customEffects);

  const [queue, setQueue] = useState<DraftPayload[]>([]);
  const [activeTab, setActiveTab] = useState<InjectPayloadType>("XP");

  const [singleUse, setSingleUse] = useState(false);
  const [hashByLink, setHashByLink] = useState(true);

  const [actTarget, setActTarget] = useState<InstantActionTarget | "">("");
  const [actVal, setActVal] = useState<number>(0);
  const [actDesc, setActDesc] = useState("");

  const [xpVal, setXpVal] = useState<number>(0);

  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedEffects, setSelectedEffects] = useState<number[]>([]);

  const resetForms = () => {
    setActTarget("");
    setActVal(0);
    setActDesc("");
    setXpVal(0);
    setSelectedItems([]);
    setSelectedEffects([]);
  };

  const handleTabChange = (tab: InjectPayloadType) => {
    setActiveTab(tab);
    resetForms();
  };

  const handleAddAction = () => {
    if (!actTarget || !actDesc) return;
    setQueue((q) => [
      ...q,
      {
        _tempId: crypto.randomUUID(),
        type: "ACTION",
        singleUse,
        data: { target: actTarget, val: actVal, description: actDesc },
        label: `AÇÃO: ${actDesc} [${actTarget}] (${actVal > 0 ? `+${actVal}` : actVal})`,
      },
    ]);
    resetForms();
  };

  const handleAddXp = () => {
    if (xpVal <= 0) return;
    setQueue((q) => [
      ...q,
      {
        _tempId: crypto.randomUUID(),
        type: "XP",
        singleUse,
        data: { amount: xpVal },
        label: `EXPERIÊNCIA: +${xpVal} XP`,
      },
    ]);
    resetForms();
  };

  const handleAddItems = () => {
    const itemsToAdd = inventory.filter((i) => selectedItems.includes(i.id));
    const newDrafts: DraftPayload[] = itemsToAdd.map((item) => ({
      _tempId: crypto.randomUUID(),
      type: "ITEM",
      singleUse,
      data: { ...item, parentId: null, isCarried: true, isEquipped: false },
      label: `MATÉRIA: ${item.name} (Qtd: ${item.quantity})`,
    }));
    setQueue((q) => [...q, ...newDrafts]);
    resetForms();
  };

  const handleAddEffects = () => {
    const effectsToAdd = customEffects.filter((e) =>
      selectedEffects.includes(e.id),
    );
    const newDrafts: DraftPayload[] = effectsToAdd.map((eff) => ({
      _tempId: crypto.randomUUID(),
      type: "EFFECT",
      singleUse,
      data: { ...eff, link: null },
      label: `EFEITO: ${eff.description} [${eff.target}]`,
    }));
    setQueue((q) => [...q, ...newDrafts]);
    resetForms();
  };

  const removeFromQueue = (tempId: string) => {
    setQueue((q) => q.filter((i) => i._tempId !== tempId));
  };

  const generateFinalHash = () => {
    if (queue.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const payloadsToEncode = queue.map(({ _tempId, label, ...rest }) => rest);
    generateInjectionHash(payloadsToEncode, { hashByLink });
    setQueue([]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="SÍNTESE DE HASHES"
      maxWidth="max-w-4xl"
    >
      <div className="flex flex-col md:flex-row gap-6 max-h-[70vh] min-h-[50vh]">
        <div className="flex-[3] flex flex-col border-r border-[var(--theme-border)] pr-6">
          <div className="flex gap-2 mb-4 border-b border-[var(--theme-border)] pb-4 overflow-x-auto custom-scrollbar">
            <Button
              size="sm"
              variant={activeTab === "XP" ? "warning" : "primary"}
              className="border-dashed flex-1 text-xs"
              onClick={() => handleTabChange("XP")}
            >
              EXPERIÊNCIA
            </Button>
            <Button
              size="sm"
              variant={activeTab === "ACTION" ? "warning" : "primary"}
              className="border-dashed flex-1 text-xs"
              onClick={() => handleTabChange("ACTION")}
            >
              AÇÃO IMEDIATA
            </Button>
            <Button
              size="sm"
              variant={activeTab === "ITEM" ? "warning" : "primary"}
              className="border-dashed flex-1 text-xs"
              onClick={() => handleTabChange("ITEM")}
            >
              INVENTÁRIO
            </Button>
            <Button
              size="sm"
              variant={activeTab === "EFFECT" ? "warning" : "primary"}
              className="border-dashed flex-1 text-xs"
              onClick={() => handleTabChange("EFFECT")}
            >
              EFEITOS
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-4">
            <AnimatePresence mode="wait">
              {activeTab === "XP" && (
                <motion.div
                  key="xp"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-4 h-full"
                >
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-[var(--theme-warning)] font-bold tracking-widest uppercase">
                      QUANTIDADE DE XP A CONCEDER
                    </span>
                    <Input
                      type="number"
                      value={xpVal}
                      onChange={(e) => setXpVal(parseInt(e.target.value) || 0)}
                      className="w-full text-center text-3xl py-4 font-black"
                    />
                  </div>

                  <div className="mt-auto flex flex-col gap-4">
                    <Checkbox
                      label="USO ÚNICO"
                      checked={singleUse}
                      onChange={() => setSingleUse(!singleUse)}
                    />
                    <Button
                      variant="warning"
                      onClick={handleAddXp}
                      className="border-dashed w-full py-3 text-sm"
                    >
                      ADICIONAR À FILA
                    </Button>
                  </div>
                </motion.div>
              )}

              {activeTab === "ACTION" && (
                <motion.div
                  key="action"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-4 h-full"
                >
                  <select
                    value={actTarget}
                    onChange={(e) =>
                      setActTarget(e.target.value as InstantActionTarget)
                    }
                    className="bg-black border-2 border-[var(--theme-warning)] text-[var(--theme-warning)] p-3 text-sm font-mono font-bold outline-none w-full"
                  >
                    <option value="">-- SELECIONAR ALVO DE AÇÃO --</option>
                    <option value="HP_HEAL">PONTOS DE VIDA (+ CURA)</option>
                    <option value="HP_DRAIN">PONTOS DE VIDA (- DANO)</option>
                    <option value="HP_TEMP">VIDA TEMPORÁRIA (+ TEMP HP)</option>
                    <option value="ENERGY_STAGE_RESTORE">
                      ENERGIA (+1 ESTÁGIO)
                    </option>
                    <option value="ENERGY_STAGE_DRAIN">
                      ENERGIA (-1 ESTÁGIO)
                    </option>
                    <option value="ENERGY_USES_RESTORE">
                      ENERGIA (+ USOS DE BATERIA)
                    </option>
                    <option value="ENERGY_USES_DRAIN">
                      ENERGIA (- USOS DE BATERIA)
                    </option>
                    <option value="SUSTENANCE_ADD">
                      ALIMENTAÇÃO (+ SACIEDADE)
                    </option>
                    <option value="SUSTENANCE_DRAIN">
                      ALIMENTAÇÃO (- SACIEDADE)
                    </option>
                    <option value="INSANITY_ADD">LOUCURA (+ SUCUMBIR)</option>
                    <option value="INSANITY_DRAIN">
                      LOUCURA (- RECENTRALIZAR)
                    </option>
                    <option value="EVILNESS_ADD">MALDADE (+ CORRUPÇÃO)</option>
                    <option value="EVILNESS_SUB">MALDADE (- REDENÇÃO)</option>
                  </select>

                  <div className="flex gap-4 items-end">
                    <div className="flex-1 flex flex-col gap-2">
                      <span className="text-xs text-[var(--theme-warning)] font-bold tracking-widest uppercase">
                        VALOR
                      </span>
                      <Input
                        type="number"
                        value={actVal}
                        onChange={(e) =>
                          setActVal(parseInt(e.target.value) || 0)
                        }
                        className="w-full text-lg py-2"
                      />
                    </div>
                    <div className="flex-[2] flex flex-col gap-2">
                      <span className="text-xs text-[var(--theme-warning)] font-bold tracking-widest uppercase">
                        DESCRIÇÃO DO LOG
                      </span>
                      <Input
                        type="text"
                        placeholder="Ex: Armadilha de Urso"
                        value={actDesc}
                        onChange={(e) => setActDesc(e.target.value)}
                        className="w-full text-lg py-2"
                      />
                    </div>
                  </div>
                  <div className="mt-auto flex flex-col gap-4">
                    <Checkbox
                      label="USO ÚNICO"
                      checked={singleUse}
                      onChange={() => setSingleUse(!singleUse)}
                    />
                    <Button
                      variant="warning"
                      onClick={handleAddAction}
                      className="border-dashed w-full py-3 text-sm"
                    >
                      ADICIONAR À FILA
                    </Button>
                  </div>
                </motion.div>
              )}

              {activeTab === "ITEM" && (
                <motion.div
                  key="item"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-4 h-full"
                >
                  <span className="text-xs text-[var(--theme-warning)] font-bold tracking-widest uppercase">
                    SELECIONE AS MATÉRIAS DO INVENTÁRIO
                  </span>
                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[350px] custom-scrollbar bg-[var(--theme-background)]/50 p-2 border border-[var(--theme-border)]">
                    {inventory.length === 0 && (
                      <span className="text-sm text-[var(--theme-text)]/50 italic p-2">
                        Inventário Vazio.
                      </span>
                    )}
                    {inventory.map((item) => (
                      <div
                        key={item.id}
                        onClick={() =>
                          setSelectedItems((p) =>
                            p.includes(item.id)
                              ? p.filter((id) => id !== item.id)
                              : [...p, item.id],
                          )
                        }
                        className={`flex flex-col p-3 border cursor-pointer transition-colors gap-2 ${
                          selectedItems.includes(item.id)
                            ? "bg-[var(--theme-warning)]/20 border-[var(--theme-warning)] shadow-[0_0_10px_var(--theme-warning)]"
                            : "bg-[var(--theme-background)] border-[var(--theme-border)] hover:border-[var(--theme-warning)]/50"
                        }`}
                      >
                        <div className="flex justify-between items-start w-full pointer-events-none">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[var(--theme-accent)]">
                              [{item.type}] {item.name}
                            </span>
                            <span className="text-xs text-[var(--theme-text)]/70 line-clamp-2 mt-1">
                              {item.description || "Sem descrição explícita."}
                            </span>
                          </div>
                          <div className="shrink-0 ml-2">
                            <Checkbox
                              label=""
                              checked={selectedItems.includes(item.id)}
                              onChange={() => {}}
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-[var(--theme-warning)] font-mono font-bold mt-1">
                          <span>QTD: {item.quantity}</span>
                          <span>SLOTS: {item.slots}</span>
                          {"uses" in item && (
                            <span>
                              CARGAS: {item.uses}/{item.maxUses}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto flex flex-col gap-4">
                    <Checkbox
                      label="USO ÚNICO"
                      checked={singleUse}
                      onChange={() => setSingleUse(!singleUse)}
                    />
                    <Button
                      variant="warning"
                      onClick={handleAddItems}
                      disabled={selectedItems.length === 0}
                      className="border-dashed w-full py-3 text-sm"
                    >
                      EXTRAIR SELECIONADOS PARA FILA
                    </Button>
                  </div>
                </motion.div>
              )}

              {activeTab === "EFFECT" && (
                <motion.div
                  key="effect"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-4 h-full"
                >
                  <span className="text-xs text-[var(--theme-warning)] font-bold tracking-widest uppercase">
                    SELECIONE OS EFEITOS ATIVOS
                  </span>
                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[350px] custom-scrollbar bg-[var(--theme-background)]/50 p-2 border border-[var(--theme-border)]">
                    {customEffects.length === 0 && (
                      <span className="text-sm text-[var(--theme-text)]/50 italic p-2">
                        Nenhum efeito ativo localizado.
                      </span>
                    )}
                    {customEffects.map((eff) => (
                      <div
                        key={eff.id}
                        onClick={() =>
                          setSelectedEffects((p) =>
                            p.includes(eff.id)
                              ? p.filter((id) => id !== eff.id)
                              : [...p, eff.id],
                          )
                        }
                        className={`flex flex-col p-3 border cursor-pointer transition-colors gap-2 ${
                          selectedEffects.includes(eff.id)
                            ? "bg-[var(--theme-warning)]/20 border-[var(--theme-warning)] shadow-[0_0_10px_var(--theme-warning)]"
                            : "bg-[var(--theme-background)] border-[var(--theme-border)] hover:border-[var(--theme-warning)]/50"
                        }`}
                      >
                        <div className="flex justify-between items-start w-full pointer-events-none">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[var(--theme-accent)] uppercase">
                              {eff.description}
                            </span>
                            <span className="text-xs font-mono text-[var(--theme-text)]/70 mt-1">
                              ALVO: {eff.target}
                            </span>
                          </div>
                          <div className="shrink-0 ml-2">
                            <Checkbox
                              label=""
                              checked={selectedEffects.includes(eff.id)}
                              onChange={() => {}}
                            />
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-[var(--theme-warning)] font-mono font-bold mt-1">
                          <span>
                            VALOR: {eff.val > 0 ? `+${eff.val}` : eff.val}
                          </span>
                          <span>MODO: {eff.mode}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto flex flex-col gap-4">
                    <Checkbox
                      label="USO ÚNICO"
                      checked={singleUse}
                      onChange={() => setSingleUse(!singleUse)}
                    />
                    <Button
                      variant="warning"
                      onClick={handleAddEffects}
                      disabled={selectedEffects.length === 0}
                      className="border-dashed w-full py-3 text-sm"
                    >
                      EXTRAIR SELECIONADOS PARA FILA
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-[2] flex flex-col bg-[var(--theme-background)]/80 border-2 border-[var(--theme-warning)]/30 p-4">
          <span className="text-sm font-bold text-[var(--theme-warning)] tracking-widest uppercase mb-4 border-b border-[var(--theme-warning)]/30 pb-3 text-center">
            FILA DE INJEÇÃO ({queue.length})
          </span>
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 mb-4">
            <AnimatePresence>
              {queue.length === 0 && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-[var(--theme-text)]/30 text-center italic mt-10 uppercase"
                >
                  Nenhum pacote na fila.
                </motion.span>
              )}
              {queue.map((q) => (
                <motion.div
                  key={q._tempId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex justify-between items-center p-3 border border-[var(--theme-warning)]/50 bg-[var(--theme-warning)]/5"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-xs font-bold text-[var(--theme-warning)] truncate uppercase">
                      {q.label}
                    </span>
                    <span className="text-[10px] text-[var(--theme-text)]/50 mt-1 font-mono">
                      {q.singleUse ? "[ USO ÚNICO ]" : "[ REUTILIZÁVEL ]"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    className="h-8 w-8 flex items-center justify-center p-0 border-none shrink-0"
                    onClick={() => removeFromQueue(q._tempId)}
                  >
                    X
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="flex flex-col gap-3">
            <Checkbox
              label="Compactar para link"
              checked={hashByLink}
              onChange={() => setHashByLink(!hashByLink)}
            />
            <Button
              variant="warning"
              className="w-full py-4 text-sm border-dashed animate-pulse shadow-[0_0_15px_var(--theme-warning)]"
              disabled={queue.length === 0}
              onClick={generateFinalHash}
            >
              GERAR HASH MESTRE
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
