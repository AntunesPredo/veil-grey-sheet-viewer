import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Step1Method } from "./Step1Method";
import { Step3Properties } from "./Step3Properties";
import { Step4Preview } from "./Step4Preview";
import type {
  CustomEffect,
  Item,
  ItemType,
  Skill,
  ConsumableItem,
  InstantAction,
  CombatProps,
} from "../../shared/types/veil-grey";
import { useCharacterStore } from "../character/store";
import { useDisclosure } from "../../shared/hooks/useDisclosure";
import { useCustomSvgIcons } from "../../shared/hooks/useCustomSvgIcons";
import { RetroToast } from "../../shared/ui/RetroToast";
import { ConfirmModal, Modal } from "../../shared/ui/Overlays";
import { Button } from "../../shared/ui/Form";
import { buildFinalItem } from "./buildFinalItem";
import { Step2Identity } from "./Step2Identity";
import { getAllowedModes } from "../../shared/utils/effectUtils";

export interface ItemFormData {
  id: number | null;
  name: string;
  description: string;
  slots: number;
  quantity: number;
  type: ItemType;
  drawer: string;
  svgId: string;
  uses: number;
  maxUses: number;
  quality: number;
  condition: number;
  commsType: string;
  bonusDamage: number;
  combatProps: CombatProps;
  perItemSlotReduction: number;
  containerProps: {
    slotCapacity: number;
    slotReduction: number;
    drawers: string[];
  };
  skillId: Skill | null;
  effects: CustomEffect[];
  singleUse: boolean;
  fullCharge: boolean;
  requiresAmmo: boolean;
  hasArmor: boolean;
  armorProps: {
    pe: number;
    maxPe: number;
    rd: number;
  };
  hasInstantActions: boolean;
  instantActions: InstantAction[];
}

const defaultFormData: ItemFormData = {
  id: null,
  name: "",
  description: "",
  slots: 1,
  quantity: 1,
  type: "MATERIAL",
  drawer: "",
  svgId: "mataterial_commum",
  uses: 1,
  maxUses: 1,
  quality: 4,
  condition: 100,
  commsType: "",
  perItemSlotReduction: 0,
  containerProps: { slotCapacity: 5, slotReduction: 5, drawers: [] },
  skillId: null,
  effects: [],
  singleUse: true,
  fullCharge: true,
  requiresAmmo: false,
  hasArmor: false,
  armorProps: { pe: 120, maxPe: 120, rd: 30 },
  hasInstantActions: false,
  instantActions: [],
  bonusDamage: 0,
  combatProps: {
    weaponType: "NONE",
    baseDamage: 0,
    range: "CURTO",
    baseDifficulty: 10,
    scalingAttr: null,
    scalingTier: "NONE",
  },
};

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit: Item | null;
  onSaveOverride?: (item: Item, nestedItems?: Item[]) => void;
}

export function ItemModal({
  isOpen,
  onClose,
  itemToEdit,
  onSaveOverride,
}: ItemModalProps) {
  const addInventoryItem = useCharacterStore((state) => state.addInventoryItem);
  const updateInventoryItem = useCharacterStore(
    (state) => state.updateInventoryItem,
  );

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ItemFormData>(defaultFormData);

  const typeWarningModal = useDisclosure();
  const [pendingType, setPendingType] = useState<ItemType | null>(null);

  const errorModal = useDisclosure();
  const [errorMessage, setErrorMessage] = useState("");

  const { getCategoryIcons } = useCustomSvgIcons();

  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    if (itemToEdit) {
      setFormData({ ...defaultFormData, ...itemToEdit } as ItemFormData);
      setStep(2);
    } else {
      setFormData(defaultFormData);
      setStep(1);
    }
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  const handleError = (msg: string) => {
    setErrorMessage(msg);
    errorModal.onOpen();
  };

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => {
    if (step === 2 && itemToEdit) return;
    setStep((s) => s - 1);
  };

  const handleTypeSelect = (newType: ItemType) => {
    if (formData.type === newType) return;

    if (step > 2) {
      setPendingType(newType);
      typeWarningModal.onOpen();
    } else {
      applyTypeChange(newType);
    }
  };

  const applyTypeChange = (newType: ItemType) => {
    const newAvailableIcons = getCategoryIcons(newType);
    let newSvgId = formData.svgId;
    if (
      newAvailableIcons.length > 0 &&
      !newAvailableIcons.find((i) => i.id === formData.svgId)
    ) {
      newSvgId = newAvailableIcons[0].id;
    }

    const allowedStack = newType === "MATERIAL" || newType === "CONSUMABLE";
    const allowedModes = getAllowedModes(newType);

    setFormData((prev) => {
      let newProps = prev.containerProps;
      let newUses = prev.uses;
      let newMaxUses = prev.maxUses;

      if (newType === "EQUIPABLE") {
        newProps = {
          slotCapacity: 0,
          slotReduction: 0,
          drawers: prev.containerProps?.drawers || [],
        };
      } else if (
        newType === "CONTAINER" &&
        (prev.containerProps?.slotCapacity || 0) === 0
      ) {
        newProps = {
          slotCapacity: 5,
          slotReduction: 5,
          drawers: prev.containerProps?.drawers || [],
        };
      }

      if (newType === "ACTIVE") {
        newMaxUses = Math.floor(prev.condition * prev.quality);
        newUses = newMaxUses;
      } else if (
        newType === "CONSUMABLE" ||
        newType === "RECHARGEABLE" ||
        newType === "KIT"
      ) {
        newUses = 1;
        newMaxUses = 1;
      }

      return {
        ...prev,
        type: newType,
        svgId: newSvgId,
        uses: newUses,
        maxUses: newMaxUses,
        quantity: allowedStack ? prev.quantity : 1,
        effects: prev.effects.filter((e) => allowedModes.includes(e.mode)),
        containerProps: newProps,
      };
    });
  };

  const executeFinalize = () => {
    if (!formData.name.trim() || formData.slots < 0) {
      handleError(
        "FALHA DE INTEGRIDADE: Nome e Peso (Slots) são obrigatórios e devem ser válidos.",
      );
      return;
    }

    try {
      const finalItem = buildFinalItem(formData);
      const nestedItemsToGenerate: Item[] = [];

      if (
        (finalItem.type === "RECHARGEABLE" || finalItem.type === "KIT") &&
        !itemToEdit
      ) {
        const initialUses = formData.fullCharge
          ? formData.maxUses
          : Math.min(formData.uses, formData.maxUses);
        finalItem.uses = 0;

        if (initialUses > 0) {
          const ammo: ConsumableItem = {
            id: Date.now() + 1,
            name: `Carga (${finalItem.name})`,
            description: "Carga gerada automaticamente.",
            slots: 0,
            quantity: initialUses,
            type: "CONSUMABLE",
            svgId:
              finalItem.type === "KIT"
                ? "consumable_energy"
                : "consumable_bullet_1",
            uses: 1,
            maxUses: 1,
            commsType: finalItem.commsType,
            isCarried: true,
            isEquipped: false,
            parentId: finalItem.id,
            drawer: null,
            effects: [],
            instantActions: [],
          };
          nestedItemsToGenerate.push(ammo);
        }
      }

      if (onSaveOverride) {
        onSaveOverride(finalItem, nestedItemsToGenerate);
        RetroToast.success(`[${formData.name}] INSERIDO NO ARSENAL GLOBAL.`);
        onClose();
        return;
      }

      if (
        (finalItem.type === "RECHARGEABLE" || finalItem.type === "KIT") &&
        !itemToEdit
      ) {
        addInventoryItem(finalItem);
        if (nestedItemsToGenerate.length > 0)
          addInventoryItem(nestedItemsToGenerate[0]);
        RetroToast.success(
          `[${formData.name}] SINTETIZADO COM CARGAS INTERNAS.`,
        );
        onClose();
        return;
      }

      if (itemToEdit) {
        Object.keys(finalItem).forEach((key) => {
          updateInventoryItem(
            itemToEdit.id,
            key as keyof Item,
            finalItem[key as keyof Item],
          );
        });
        RetroToast.success(`[${formData.name}] RECONFIGURADO.`);
      } else {
        addInventoryItem(finalItem);
        RetroToast.success(`[${formData.name}] SINTETIZADO.`);
      }
      onClose();
    } catch (error) {
      handleError(`FALHA NA SÍNTESE - ${(error as Error).message}`);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={itemToEdit ? "RECONFIGURAR MATÉRIA" : "SINTETIZADOR DE MATÉRIA"}
      >
        <div className="flex flex-col gap-4 min-h-[300px] bg-[var(--theme-background)]">
          <div className="flex gap-1 h-1.5 w-full bg-[var(--theme-border)] shrink-0">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`flex-1 h-full transition-colors ${step >= i ? "bg-[var(--theme-accent)] shadow-[0_0_5px_var(--theme-accent)]" : "bg-transparent"}`}
              />
            ))}
          </div>

          <div className="flex-1">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <Step1Method
                  key="step1"
                  onNext={handleNext}
                  onClose={onClose}
                  onError={handleError}
                />
              )}
              {step === 2 && (
                <Step2Identity
                  key="step2"
                  formData={formData}
                  setFormData={setFormData}
                  onTypeSelect={handleTypeSelect}
                />
              )}
              {step === 3 && (
                <Step3Properties
                  key="step3"
                  formData={formData}
                  setFormData={setFormData}
                  icons={getCategoryIcons(formData.type)}
                />
              )}
              {step === 4 && (
                <Step4Preview
                  key="step4"
                  formData={formData}
                  setFormData={setFormData}
                />
              )}
            </AnimatePresence>
          </div>

          {step > 1 && (
            <div className="flex justify-between mt-4 pt-4 border-t border-[var(--theme-border)] shrink-0">
              <Button
                variant="danger"
                onClick={handlePrev}
                className={
                  step === 2 && itemToEdit ? "invisible" : "border-dashed"
                }
              >
                &lt; RETORNAR
              </Button>
              {step < 4 ? (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={!formData.name?.trim()}
                >
                  PROSSEGUIR &gt;
                </Button>
              ) : (
                <Button
                  variant="success"
                  onClick={executeFinalize}
                  className="animate-pulse shadow-[0_0_8px_rgba(0,255,0,0.4)]"
                >
                  {itemToEdit ? "GRAVAR ALTERAÇÕES" : "SINTETIZAR AGORA"}
                </Button>
              )}
            </div>
          )}
        </div>
      </Modal>

      <ConfirmModal
        isOpen={typeWarningModal.isOpen}
        onClose={() => {
          setPendingType(null);
          typeWarningModal.onClose();
        }}
        title="AVISO DE CORRUPÇÃO DE DADOS"
        message="A alteração do tipo estrutural descartará propriedades específicas preenchidas nos passos seguintes. Deseja forçar a formatação?"
        isDanger
        confirmText="FORÇAR FORMATAÇÃO"
        onConfirm={() => {
          if (pendingType) applyTypeChange(pendingType);
          typeWarningModal.onClose();
        }}
      />
      <ConfirmModal
        isOpen={errorModal.isOpen}
        onClose={errorModal.onClose}
        title="FALHA NO SISTEMA"
        message={errorMessage}
        isDanger
        onConfirm={errorModal.onClose}
      />
    </>
  );
}
