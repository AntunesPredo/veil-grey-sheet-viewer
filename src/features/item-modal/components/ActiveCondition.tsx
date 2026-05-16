import type { ItemFormData } from "../ItemModal";
import { ITEM_QUALITIES } from "../../../shared/utils/selectOptions";

export function ActiveCondition({
  formData,
  onActiveChange,
}: {
  formData: ItemFormData;
  onActiveChange: (f: "condition" | "quality", v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 bg-[var(--theme-danger)]/10 border border-[var(--theme-danger)]/30 p-3">
      <span className="text-[10px] font-bold text-[var(--theme-accent)] tracking-widest uppercase">
        ESTADO DO EQUIPAMENTO
      </span>
      <div className="grid gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-[var(--theme-accent)] tracking-widest uppercase flex justify-between">
            CONDIÇÃO <span>{formData.condition}%</span>
          </span>
          <input
            type="range"
            min="1"
            max="100"
            value={formData.condition}
            onChange={(e) =>
              onActiveChange("condition", parseInt(e.target.value) || 1)
            }
            className="w-full accent-[var(--theme-danger)] mt-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-[var(--theme-accent)] tracking-widest uppercase">
            QUALIDADE
          </span>
          <select
            className="bg-[var(--theme-background)] border border-[var(--theme-danger)]/50 text-[var(--theme-accent)] p-1.5 font-mono text-xs outline-none"
            value={formData.quality}
            onChange={(e) =>
              onActiveChange("quality", parseFloat(e.target.value))
            }
          >
            {ITEM_QUALITIES.map((q) => (
              <option key={q.value} value={q.value}>
                {q.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
