import { useState, useEffect } from "react";
import { useCharacterStore } from "../character/store";
import { useVitalsStore } from "../vitals/useVitalsStore";
import { RetroToast } from "../../shared/ui/RetroToast";
import { ConfirmModal, Modal } from "../../shared/ui/Overlays";
import { Button, Input } from "../../shared/ui/Form";
import CryptoJS from "crypto-js";
import { useDisclosure } from "../../shared/hooks/useDisclosure";
import type {
  CustomEffect,
  EquipableItem,
  InstantAction,
} from "../../shared/types/veil-grey";
import type { InjectPayload } from "../../shared/utils/hashIntegration";
import { useUIStore } from "../../shared/store/useUIStore";
import { dispatchDiscordLog } from "../../shared/utils/discordWebhook";
import { HashGeneratorModal } from "./HashGeneratorModal";

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY || "fallback_veil_grey_key";
const isDev =
  import.meta.env.VITE_IN_DEVELOPMENT === "true" || import.meta.env.DEV;

export function SystemInjectionModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const name = useCharacterStore((state) => state.name);
  const addXp = useCharacterStore((state) => state.addXp);
  const addInventoryItem = useCharacterStore((state) => state.addInventoryItem);
  const addCustomEffect = useCharacterStore((state) => state.addCustomEffect);
  const processDirectAction = useCharacterStore(
    (state) => state.processDirectAction,
  );
  const usedInjectIds = useCharacterStore((state) => state.usedInjectIds);
  const registerInjectId = useCharacterStore((state) => state.registerInjectId);
  const hashBuilderModal = useDisclosure();
  const openVitalsModal = useVitalsStore((state) => state.openModal);
  const openInsanityModal = useVitalsStore((state) => state.openInsanityModal);
  const openDefenseModal = useVitalsStore((state) => state.openDefenseModal);

  const confirmModal = useDisclosure();
  const [hashInput, setHashInput] = useState("");
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  const pendingInjection = useUIStore((state) => state.pendingInjection);
  const setPendingInjection = useUIStore((state) => state.setPendingInjection);

  useEffect(() => {
    if (isOpen && pendingInjection) {
      setHashInput(pendingInjection);
      setPendingInjection(null);
    }
  }, [isOpen, pendingInjection, setPendingInjection]);

  const handleClose = () => {
    setHashInput("");
    setConfirmModalMessage("");
    onClose();
  };

  const handleInjectHash = () => {
    if (!hashInput.trim()) return;

    try {
      let cleanHash = decodeURIComponent(hashInput.trim());
      cleanHash = cleanHash.replace(/\s/g, "+");

      const bytes = CryptoJS.AES.decrypt(cleanHash, SECRET_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) {
        RetroToast.error("Payload criptográfico corrompido ou incorreto.");
      }

      const parsedData = JSON.parse(decryptedString);

      const payloads: InjectPayload[] = Array.isArray(parsedData)
        ? parsedData
        : [parsedData];
      if (payloads.length === 0)
        throw new Error("O pacote de injeção está vazio.");

      let successCount = 0;
      let msg = ` **[ ${name || "SUJEITO"} ] - INJECTIONS: ** `;
      payloads.forEach((payload) => {
        if (!payload.id || !payload.type) {
          RetroToast.error(
            `Payload ignorado por falta de assinatura: ${payload.id ?? "ID Desconecido"}`,
          );
          msg += `\n- [IGNORADO] Payload com assinatura inválida.`;
          return;
        }

        if (payload.singleUse && usedInjectIds.includes(payload.id)) {
          RetroToast.warning(
            `PACOTE [${payload.type}] JÁ CONSUMIDO ANTERIORMENTE.`,
          );
          msg += `\n- [IGNORADO] Pacote de ID ${payload.id} já consumido anteriormente.`;
          return;
        }

        switch (payload.type) {
          case "XP":
            addXp((payload.data as { amount: number }).amount);
            RetroToast.success(
              `EXPERIÊNCIA INJETADA: +${(payload.data as { amount: number }).amount} XP.`,
            );
            msg += `\n- [SUCESSO] Injetado ${(payload.data as { amount: number }).amount} XP.`;
            break;
          case "ITEM": {
            const newItem: EquipableItem = {
              ...(payload.data as EquipableItem),
              id: Date.now() + Math.random(),
              parentId: null,
              isCarried: true,
            };
            addInventoryItem(newItem);
            RetroToast.success(`MATÉRIA SINTETIZADA: [${newItem.name}]`);
            msg += `\n- [SUCESSO] Item injetado: ${newItem.name}`;
            break;
          }
          case "EFFECT": {
            const newEffect: CustomEffect = {
              ...(payload.data as CustomEffect),
              id: Date.now() + Math.random(),
            };
            addCustomEffect(newEffect);
            RetroToast.success(`EFEITO APLICADO: [${newEffect.description}]`);
            msg += `\n- [SUCESSO] Efeito injetado: ${newEffect.description}`;
            break;
          }
          case "ACTION": {
            const actionData = payload.data as InstantAction;
            if (actionData.target === "HP_DRAIN") {
              openVitalsModal("DAMAGE", actionData.val.toString(), true);
            } else if (actionData.target === "HP_HEAL") {
              openVitalsModal("HEALING", actionData.val.toString(), true);
            } else if (actionData.target === "INSANITY_ADD") {
              openInsanityModal("ADD", actionData.val.toString(), true);
            } else if (actionData.target === "INSANITY_DRAIN") {
              openInsanityModal("SUB", actionData.val.toString(), true);
            } else if (actionData.target === "SUSTENANCE_ADD") {
              useVitalsStore
                .getState()
                .openSustenanceModal("ADD", actionData.val.toString(), true);
            } else if (actionData.target === "SUSTENANCE_DRAIN") {
              useVitalsStore
                .getState()
                .openSustenanceModal("SUB", actionData.val.toString(), true);
            } else {
              processDirectAction(actionData);
              RetroToast.success(
                `AÇÃO IMEDIATA PROCESSADA: [${actionData.description}]`,
              );
              msg += `\n- [SUCESSO] Ação imediata processada: ${actionData.description}`;
            }
            break;
          }
          case "COMBAT_DEFENSE": {
            openDefenseModal(
              payload.data as {
                attackRoll: number;
                damage: number;
                defenseType: "DODGE" | "BLOCK";
                attackerName: string;
              },
            );
            break;
          }
          default:
            RetroToast.error(`Tipo de payload desconhecido: ${payload.type}`);
            msg += `\n- [ERRO] Tipo de payload desconhecido: ${payload.type}`;
        }

        if (payload.singleUse) {
          registerInjectId(payload.id);
        }
        successCount++;
      });

      if (successCount > 0) {
        dispatchDiscordLog("PLAYER", name, msg);
        setHashInput("");
        handleClose();
      }
    } catch (error) {
      confirmModal.onOpen();
      setConfirmModalMessage(
        `Erro de segurança durante a injeção - ${(error as Error).message ?? "Falha Inesperada."}`,
      );
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="INJEÇÃO EXTERNA (OVERRIDE)"
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4 p-3 bg-[var(--theme-background)] border border-[var(--theme-border)] relative">
            <svg
              className="w-10 h-10 fill-[var(--theme-accent)] shrink-0"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M4.70711 12.7071L8 16L11.2929 12.7071L8 9.41421L4.70711 12.7071Z"
                fill="currentColor"
              />
              <path
                d="M3.29289 11.2929L6.58579 8L3.29289 4.70711L0 8L3.29289 11.2929Z"
                fill="currentColor"
              />
              <path
                d="M4.70711 3.29289L8 0L11.2929 3.29289L8 6.58579L4.70711 3.29289Z"
                fill="currentColor"
              />
              <path
                d="M12.7071 4.70711L9.41421 8L12.7071 11.2929L16 8L12.7071 4.70711Z"
                fill="currentColor"
              />
            </svg>
            <div className="flex flex-col gap-2 w-full">
              <span className="text-[12px] font-bold text-[var(--theme-text)] tracking-widest uppercase">
                INSERIR HASH DE INJEÇÃO
              </span>
              <div className="flex flex-row gap-4">
                <Input
                  type="text"
                  placeholder="Código Criptografado..."
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInjectHash()}
                  className="w-full font-mono text-xs p-2 tracking-wider"
                />
                <Button variant="primary" onClick={handleInjectHash}>
                  INJETAR
                </Button>
              </div>
            </div>
          </div>

          {isDev && (
            <Button
              size="sm"
              variant="warning"
              onClick={(e) => {
                e.stopPropagation();
                hashBuilderModal.onOpen();
              }}
              className="w-full mt-2 border-dashed"
            >
              [DEV] CONSTRUTOR DE HASHES
            </Button>
          )}
        </div>
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={confirmModal.onClose}
          title="INJECTION ERROR"
          message={confirmModalMessage}
          isDanger
          onConfirm={() => {
            setConfirmModalMessage("");
            confirmModal.onClose();
          }}
        />
        <HashGeneratorModal
          isOpen={hashBuilderModal.isOpen}
          onClose={hashBuilderModal.onClose}
        />
      </Modal>
    </>
  );
}
