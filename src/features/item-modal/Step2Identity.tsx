import { motion } from "framer-motion";
import type { ItemType } from "../../shared/types/veil-grey";
import { Input } from "../../shared/ui/Form";
import type { ItemFormData } from "./ItemModal";
import { ITEM_TYPES } from "../../shared/utils/selectOptions";

interface Step2IdentityProps {
  formData: ItemFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItemFormData>>;
  onTypeSelect: (type: ItemType) => void;
}

export function Step2Identity({
  formData,
  setFormData,
  onTypeSelect,
}: Step2IdentityProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-[var(--theme-accent)] tracking-widest uppercase">
          NOME DO ITEM
        </span>
        <Input
          value={formData.name}
          onChange={(e) =>
            setFormData((prev: ItemFormData) => ({
              ...prev,
              name: e.target.value,
            }))
          }
          placeholder="Ex: Kit de Primeiros Socorros"
          className="text-lg py-2"
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <span className="text-[10px] font-bold text-[var(--theme-text)] tracking-widest uppercase">
          CLASSIFICAÇÃO ESTRUTURAL
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
          {ITEM_TYPES.map((t) => (
            <label
              key={t.id}
              className={`flex flex-col p-2 border cursor-pointer transition-colors ${formData.type === t.id ? "bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]" : "bg-[var(--theme-background)] border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50"}`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 border border-[var(--theme-accent)] rotate-45 flex items-center justify-center ${formData.type === t.id ? "bg-[var(--theme-accent)]" : "bg-transparent"}`}
                >
                  {formData.type === t.id && (
                    <div className="w-1 h-1 bg-[var(--theme-background)]" />
                  )}
                </div>
                <span
                  className={`font-bold text-xs tracking-widest ${formData.type === t.id ? "text-[var(--theme-accent)]" : "text-[var(--theme-text)]/50"}`}
                >
                  {t.label}
                </span>
              </div>
              <span className="text-[9px] text-[var(--theme-text)]/60 mt-1 pl-5">
                {t.desc}
              </span>
              <input
                type="radio"
                name="itemType"
                value={t.id}
                checked={formData.type === t.id}
                onChange={() => onTypeSelect(t.id)}
                className="hidden"
              />
            </label>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
