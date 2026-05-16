import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Input } from "../../shared/ui/Form";
import type { InstantActionTarget } from "../../shared/types/veil-grey";
import { useCharacterStore } from "../character/store";
import { Modal } from "../../shared/ui/Overlays";
import { TargetSelectionModal } from "../../shared/ui/TargetSelectionModal";
import { useNetworkStore } from "../../shared/store/useNetworkStore";
import { RetroToast } from "../../shared/ui/RetroToast";
import { useSystemData } from "../../shared/hooks/useSystemData";
import { useMasterStore } from "../master/masterStore";
import { INSTANT_ACTION_TARGETS } from "../../shared/utils/actionTargets";

type InjectPayloadType = "XP" | "ITEM" | "EFFECT" | "ACTION" | "TEST";

type DraftPayload = {
  _tempId: string;
  type: InjectPayloadType;
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
  const isMasterMode = useCharacterStore((state) => state.isMasterMode);

  const playerInventory = useCharacterStore((state) => state.inventory);
  const playerEffects = useCharacterStore((state) => state.customEffects);
  const masterInventory = useMasterStore((state) => state.globalItems);
  const masterEffects = useMasterStore((state) => state.globalEffects);

  const inventory = isMasterMode ? masterInventory : playerInventory;
  const customEffects = isMasterMode ? masterEffects : playerEffects;

  const sendPayload = useNetworkStore((state) => state.sendPayload);
  const { attributes: sysAttrs, skills: sysSkills } = useSystemData();
  const allRollables = [...sysAttrs, ...sysSkills];

  const [queue, setQueue] = useState<DraftPayload[]>([]);
  const [activeTab, setActiveTab] = useState<InjectPayloadType>("TEST");
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  const [actTarget, setActTarget] = useState<InstantActionTarget | "">("");
  const [actVal, setActVal] = useState<number>(0);
  const [actDesc, setActDesc] = useState("");
  const [xpVal, setXpVal] = useState<number>(0);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedEffects, setSelectedEffects] = useState<number[]>([]);

  const [testTargetId, setTestTargetId] = useState<string>("");
  const [testDc, setTestDc] = useState<number>(0);

  const resetForms = () => {
    setActTarget("");
    setActVal(0);
    setActDesc("");
    setXpVal(0);
    setSelectedItems([]);
    setSelectedEffects([]);
    setTestTargetId("");
    setTestDc(0);
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
        data: { target: actTarget, val: actVal, description: actDesc },
        label: `AÇÃO: ${actDesc} [${actTarget}]`,
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
      data: { ...eff, link: null },
      label: `EFEITO: ${eff.description} [${eff.target}]`,
    }));
    setQueue((q) => [...q, ...newDrafts]);
    resetForms();
  };

  const handleAddTest = () => {
    const found = allRollables.find((r) => r.id === testTargetId);
    if (!found) return;

    setQueue((q) => [
      ...q,
      {
        _tempId: crypto.randomUUID(),
        type: "TEST",
        data: {
          title: `Teste de ${found.label}`,
          rollKey: found.id,
          rollCategory: found.rollCategory,
          dc: testDc > 0 ? testDc : undefined,
        },
        label: `TESTE: ${found.label} ${testDc > 0 ? `(DC ${testDc})` : ""}`,
      },
    ]);
    resetForms();
  };

  const removeFromQueue = (tempId: string) =>
    setQueue((q) => q.filter((i) => i._tempId !== tempId));

  const handleDispatchQueue = (targets: string[]) => {
    queue.forEach((payload) => {
      targets.forEach((targetName) => {
        if (payload.type === "TEST") {
          sendPayload(targetName, "ROLL_REQUEST", payload.data);
        } else {
          sendPayload(targetName, payload.type, payload.data);
        }
      });
    });
    RetroToast.success(`PACOTES ENVIADOS PARA: ${targets.join(", ")}`);
    setQueue([]);
    setIsTargetModalOpen(false);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="PAINEL DE TRANSMISSÃO"
        maxWidth="max-w-4xl"
      >
        <div className="flex flex-col md:flex-row gap-6 max-h-[70vh] min-h-[50vh]">
          <div className="flex-[3] flex flex-col border-r border-[var(--theme-border)] pr-6">
            <div className="flex gap-2 mb-4 border-b border-[var(--theme-border)] pb-4 overflow-x-auto custom-scrollbar">
              <Button
                size="sm"
                variant={activeTab === "TEST" ? "warning" : "primary"}
                className="border-dashed flex-1 text-xs"
                onClick={() => handleTabChange("TEST")}
              >
                TESTE
              </Button>
              <Button
                size="sm"
                variant={activeTab === "XP" ? "warning" : "primary"}
                className="border-dashed flex-1 text-xs"
                onClick={() => handleTabChange("XP")}
              >
                EXP
              </Button>
              <Button
                size="sm"
                variant={activeTab === "ACTION" ? "warning" : "primary"}
                className="border-dashed flex-1 text-xs"
                onClick={() => handleTabChange("ACTION")}
              >
                AÇÕES
              </Button>
              <Button
                size="sm"
                variant={activeTab === "ITEM" ? "warning" : "primary"}
                className="border-dashed flex-1 text-xs"
                onClick={() => handleTabChange("ITEM")}
              >
                ITENS
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
                {activeTab === "TEST" && (
                  <motion.div
                    key="test"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col gap-4 h-full"
                  >
                    <div className="flex flex-col gap-2">
                      <span className="text-xs text-[var(--theme-warning)] font-bold tracking-widest uppercase">
                        SOLICITAR TESTE ESTATÍSTICO
                      </span>
                      <select
                        value={testTargetId}
                        onChange={(e) => setTestTargetId(e.target.value)}
                        className="bg-black border-2 border-[var(--theme-warning)] text-[var(--theme-warning)] p-3 text-sm font-mono font-bold outline-none w-full uppercase"
                      >
                        <option value="">
                          -- SELECIONAR ATRIBUTO OU PERÍCIA --
                        </option>
                        {allRollables.map((r) => (
                          <option key={r.id} value={r.id}>
                            [{r.groupLabel}] {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs text-[var(--theme-warning)] font-bold tracking-widest uppercase">
                        DIFICULDADE BASE (DC) - OPCIONAL
                      </span>
                      <Input
                        type="number"
                        value={testDc}
                        onChange={(e) =>
                          setTestDc(parseInt(e.target.value) || 0)
                        }
                        className="w-full text-lg py-2"
                      />
                    </div>
                    <div className="mt-auto flex flex-col gap-4">
                      <Button
                        variant="warning"
                        onClick={handleAddTest}
                        disabled={!testTargetId}
                        className="border-dashed w-full py-3 text-sm"
                      >
                        ADICIONAR À FILA
                      </Button>
                    </div>
                  </motion.div>
                )}

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
                        onChange={(e) =>
                          setXpVal(parseInt(e.target.value) || 0)
                        }
                        className="w-full text-center text-3xl py-4 font-black"
                      />
                    </div>
                    <div className="mt-auto flex flex-col gap-4">
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
                      {INSTANT_ACTION_TARGETS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
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
                      SELECIONE AS MATÉRIAS
                    </span>
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[350px] custom-scrollbar bg-[var(--theme-background)]/50 p-2 border border-[var(--theme-border)]">
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
                          className={`flex flex-col p-3 border cursor-pointer transition-colors gap-2 ${selectedItems.includes(item.id) ? "bg-[var(--theme-warning)]/20 border-[var(--theme-warning)]" : "bg-[var(--theme-background)] border-[var(--theme-border)]"}`}
                        >
                          <span className="text-sm font-bold text-[var(--theme-accent)]">
                            [{item.type}] {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto flex flex-col gap-4">
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
                      SELECIONE OS EFEITOS
                    </span>
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[350px] custom-scrollbar bg-[var(--theme-background)]/50 p-2 border border-[var(--theme-border)]">
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
                          className={`flex flex-col p-3 border cursor-pointer transition-colors gap-2 ${selectedEffects.includes(eff.id) ? "bg-[var(--theme-warning)]/20 border-[var(--theme-warning)]" : "bg-[var(--theme-background)] border-[var(--theme-border)]"}`}
                        >
                          <span className="text-sm font-bold text-[var(--theme-accent)] uppercase">
                            {eff.description}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto flex flex-col gap-4">
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
              FILA DE TRANSMISSÃO ({queue.length})
            </span>
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 mb-4">
              <AnimatePresence>
                {queue.map((q) => (
                  <motion.div
                    key={q._tempId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex justify-between items-center p-3 border border-[var(--theme-warning)]/50 bg-[var(--theme-warning)]/5"
                  >
                    <span className="text-xs font-bold text-[var(--theme-warning)] truncate uppercase">
                      {q.label}
                    </span>
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
            <Button
              variant="warning"
              className="w-full py-4 text-sm border-dashed animate-pulse shadow-[0_0_15px_var(--theme-warning)]"
              disabled={queue.length === 0}
              onClick={() => setIsTargetModalOpen(true)}
            >
              SELECIONAR ALVO E TRANSMITIR
            </Button>
          </div>
        </div>
      </Modal>

      <TargetSelectionModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        onSelect={handleDispatchQueue}
        title="SELECIONE O RECEPTOR DOS DADOS"
        allowAll={true}
      />
    </>
  );
}
