import { useEffect, useRef } from "react";
import { useNetworkStore } from "../../shared/store/useNetworkStore";
import { useVitalsStore } from "../../features/vitals/useVitalsStore";
import { Modal } from "../../shared/ui/Overlays";
import { Button } from "../../shared/ui/Form";
import { useCharacterStore } from "../../features/character/store";
import { ItemNodeWrapper } from "../../features/inventory/components/ItemNodeWrapper";
import { useRoller } from "../../shared/hooks/useRoller";
import { RetroToast } from "../../shared/ui/RetroToast";
import type {
  Item,
  CustomEffect,
  InstantAction,
  Note,
} from "../../shared/types/veil-grey";

export function NetworkQueueManager() {
  const queue = useNetworkStore((state) => state.queue);
  const popQueue = useNetworkStore((state) => state.popQueue);
  const importExternalNote = useCharacterStore(
    (state) => state.importExternalNote,
  );

  const vitals = useVitalsStore();
  const {
    addInventoryItem,
    addXp,
    addCustomEffect,
    processDirectAction,
    attributes,
    skills,
  } = useCharacterStore();
  const { initiateRoll } = useRoller();

  const processingIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (queue.length === 0) {
      if (processingIdRef.current) processingIdRef.current = null;
      return;
    }

    const current = queue[0];
    const anyVitalsModalOpen =
      vitals.isOpen ||
      vitals.isDefenseOpen ||
      vitals.isInsanityOpen ||
      vitals.isSustenanceOpen;

    if (processingIdRef.current === current.id) {
      if (["COMBAT_DEFENSE", "ACTION"].includes(current.type)) {
        const act = current.data as {
          target: string;
          val: number;
          description: string;
        };
        const isDirectAction =
          current.type === "ACTION" &&
          ![
            "HP_DRAIN",
            "HP_HEAL",
            "INSANITY_ADD",
            "INSANITY_DRAIN",
            "SUSTENANCE_ADD",
            "SUSTENANCE_DRAIN",
          ].includes(act.target);

        if (!isDirectAction && !anyVitalsModalOpen) {
          popQueue();
          processingIdRef.current = null;
        }
      }
      return;
    }

    if (!anyVitalsModalOpen) {
      processingIdRef.current = current.id;

      if (current.type === "COMBAT_DEFENSE") {
        vitals.openDefenseModal(
          current.data as {
            attackRoll: number;
            damage: number;
            attackerName: string;
          },
        );
      } else if (current.type === "ACTION") {
        const act = current.data as {
          target: string;
          val: number;
          description: string;
        };
        if (act.target === "HP_DRAIN") {
          vitals.openModal("DAMAGE", act.val.toString(), true);
        } else if (act.target === "HP_HEAL") {
          vitals.openModal("HEALING", act.val.toString(), true);
        } else if (act.target === "INSANITY_ADD") {
          vitals.openInsanityModal("ADD", act.val.toString(), true);
        } else if (act.target === "INSANITY_DRAIN") {
          vitals.openInsanityModal("SUB", act.val.toString(), true);
        } else if (act.target === "SUSTENANCE_ADD") {
          vitals.openSustenanceModal("ADD", act.val.toString(), true);
        } else if (act.target === "SUSTENANCE_DRAIN") {
          vitals.openSustenanceModal("SUB", act.val.toString(), true);
        }
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, vitals]);

  if (queue.length === 0) return null;
  const current = queue[0];

  if (["COMBAT_DEFENSE"].includes(current.type)) return null;
  if (current.type === "ACTION") {
    const act = current.data as {
      target: string;
      val: number;
      description: string;
    };
    const isDirectAction = ![
      "HP_DRAIN",
      "HP_HEAL",
      "INSANITY_ADD",
      "INSANITY_DRAIN",
      "SUSTENANCE_ADD",
      "SUSTENANCE_DRAIN",
    ].includes(act.target);
    if (!isDirectAction) return null;
  }

  const handleAccept = () => {
    if (current.type === "ITEM") {
      const newItem: Item = {
        ...(current.data as object),
        id: Date.now() + Math.random(),
        parentId: null,
        isCarried: true,
        isEquipped: false,
      } as Item;
      addInventoryItem(newItem);
      RetroToast.success(`MATÉRIA RECEBIDA: [${newItem.name}]`);
    } else if (current.type === "XP") {
      const xpData = current.data as { amount: number };
      addXp(xpData.amount);
      RetroToast.success(`EXPERIÊNCIA RECEBIDA: +${xpData.amount} XP`);
    } else if (current.type === "EFFECT") {
      const newEffect: CustomEffect = {
        ...(current.data as CustomEffect),
        id: Date.now() + Math.random(),
        link: null,
      };
      addCustomEffect(newEffect);
      RetroToast.success(`EFEITO APLICADO: [${newEffect.description}]`);
    } else if (current.type === "ROLL_REQUEST") {
      const req = current.data as {
        title: string;
        rollKey: string;
        rollCategory: string;
        dc?: number;
      };
      let baseVal = 0;
      if (req.rollKey in attributes)
        baseVal = attributes[req.rollKey as keyof typeof attributes];
      if (req.rollKey in skills)
        baseVal = skills[req.rollKey as keyof typeof skills];
      initiateRoll(
        req.title,
        `1d20+${baseVal}`,
        [req.rollKey, req.rollCategory],
        req.dc,
      );
    } else if (current.type === "ACTION") {
      const actionData = current.data as InstantAction;
      processDirectAction(actionData);
      RetroToast.success(`AÇÃO IMEDIATA: [${actionData.description}]`);
    } else if (current.type === "NOTE") {
      const payloadData = current.data as {
        note: Note;
        effects: CustomEffect[];
      };
      importExternalNote(payloadData.note, payloadData.effects);
      RetroToast.success(`NOTA INCORPORADA: [${payloadData.note.title}]`);
    }
    popQueue();
    processingIdRef.current = null;
  };

  const handleReject = () => {
    popQueue();
    processingIdRef.current = null;
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => {}}
      title={`TRANSMISSÃO RECEBIDA [${queue.length} RESTANTES]`}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col gap-4 text-center">
        <div className="bg-[var(--theme-warning)]/10 border border-[var(--theme-warning)] p-4">
          <span className="text-[10px] tracking-widest text-[var(--theme-warning)] font-bold block uppercase mb-2">
            ORIGEM DA TRANSMISSÃO: {current.attackerName}
          </span>

          {current.type === "ITEM" && (
            <div className="flex flex-col items-center gap-2 pointer-events-none mt-4 border border-[var(--theme-accent)]">
              <ItemNodeWrapper
                item={current.data as Item}
                allInventory={[]}
                onEdit={() => {}}
                onDelete={() => {}}
                activeDragId={null}
                isEditMode={false}
                isOverlay
              />
            </div>
          )}

          {current.type === "XP" && (
            <div className="text-4xl font-mono text-[var(--theme-success)] font-black glow-success my-4">
              +{(current.data as { amount: number }).amount} XP
            </div>
          )}

          {current.type === "EFFECT" && (
            <div className="text-lg font-mono text-[var(--theme-accent)] font-bold my-4 border border-[var(--theme-accent)] p-2">
              EFEITO: {(current.data as CustomEffect).description}
              <br />
              <span className="text-sm">
                (
                {(current.data as CustomEffect).val > 0
                  ? `+${(current.data as CustomEffect).val}`
                  : (current.data as CustomEffect).val}{" "}
                | {(current.data as CustomEffect).mode})
              </span>
            </div>
          )}

          {current.type === "ACTION" && (
            <div className="text-lg font-mono text-[var(--theme-success)] font-bold my-4 border border-[var(--theme-success)] p-2">
              AÇÃO IMEDIATA:{" "}
              {(current.data as { description: string }).description}
            </div>
          )}

          {current.type === "ROLL_REQUEST" && (
            <div className="flex flex-col gap-2 my-4">
              <span className="text-xl font-mono text-[var(--theme-accent)] font-bold glow-text uppercase">
                {(current.data as { title: string }).title}
              </span>
              {(current.data as { dc?: number }).dc !== undefined && (
                <span className="text-xs font-mono text-[var(--theme-warning)] mt-2 block font-bold">
                  DIFICULDADE ALVO: DC {(current.data as { dc: number }).dc}
                </span>
              )}
            </div>
          )}

          {current.type === "NOTE" && (
            <div className="flex flex-col gap-2 my-4 border border-[var(--theme-accent)] p-3 bg-[var(--theme-background)] text-left">
              <span className="text-[10px] text-[var(--theme-accent)] font-bold tracking-widest border-b border-[var(--theme-accent)]/30 pb-1 uppercase">
                DOCUMENTO ANEXADO
              </span>
              <span className="text-sm font-bold uppercase text-[var(--theme-accent)]">
                {(current.data as { note: Note }).note.title}
              </span>
              <span className="text-xs font-mono text-[var(--theme-text)]/70 line-clamp-3 italic">
                {(current.data as { note: Note }).note.content}
              </span>
              {(current.data as { effects: CustomEffect[] }).effects.length >
                0 && (
                <span className="text-[10px] text-[var(--theme-warning)] font-bold mt-2 uppercase tracking-widest">
                  +{" "}
                  {(current.data as { effects: CustomEffect[] }).effects.length}{" "}
                  EFEITO(S) INCLUSO(S)
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-2">
          <Button
            variant="danger"
            onClick={handleReject}
            className="flex-1 border-dashed"
          >
            DESCARTAR
          </Button>
          <Button
            variant="primary"
            onClick={handleAccept}
            className="flex-[2] animate-pulse"
          >
            ACEITAR PACOTE
          </Button>
        </div>
      </div>
    </Modal>
  );
}
