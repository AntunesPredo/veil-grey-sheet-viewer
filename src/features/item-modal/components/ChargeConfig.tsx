import { Checkbox, Input } from "../../../shared/ui/Form";
import type { ItemFormData } from "../ItemModal";

export function ChargeConfig({
  formData,
  setFormData,
  isConsumable,
}: {
  formData: ItemFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItemFormData>>;
  isConsumable: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 bg-[var(--theme-warning)]/10 border border-[var(--theme-warning)]/30 p-3">
      {isConsumable ? (
        <Checkbox
          label="USO ÚNICO (DESTRUTIVO)"
          checked={formData.singleUse}
          onChange={() =>
            setFormData((prev) => ({
              ...prev,
              singleUse: !prev.singleUse,
              uses: !prev.singleUse ? 1 : prev.uses,
              maxUses: !prev.singleUse ? 1 : prev.maxUses,
            }))
          }
        />
      ) : (
        <Checkbox
          label="CARGA COMPLETA NA SÍNTESE"
          checked={formData.fullCharge}
          onChange={() =>
            setFormData((prev) => ({ ...prev, fullCharge: !prev.fullCharge }))
          }
        />
      )}

      {(!isConsumable || !formData.singleUse) && (
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed border-[var(--theme-warning)]/30">
          {!isConsumable && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[var(--theme-warning)] tracking-widest uppercase">
                MÁX. DE CARGAS
              </span>
              <Input
                type="number"
                min="1"
                value={formData.maxUses}
                onChange={(e) =>
                  setFormData((prev) => {
                    const newMax = Math.max(1, parseInt(e.target.value) || 1);
                    return {
                      ...prev,
                      maxUses: newMax,
                      uses: Math.min(prev.uses, newMax),
                    };
                  })
                }
                className="text-center font-mono border-[var(--theme-warning)]/50 text-[var(--theme-warning)]"
              />
            </div>
          )}

          <div
            className={`flex flex-col gap-1 ${formData.fullCharge && !isConsumable ? "opacity-30 pointer-events-none" : ""}`}
          >
            <span className="text-[10px] font-bold text-[var(--theme-warning)] tracking-widest uppercase">
              CARGAS ATUAIS
            </span>
            <Input
              type="number"
              min="0"
              max={isConsumable ? undefined : formData.maxUses}
              value={
                formData.fullCharge && !isConsumable
                  ? formData.maxUses
                  : formData.uses
              }
              onChange={(e) => {
                const newValue = parseInt(e.target.value) || 0;
                setFormData((prev) => ({
                  ...prev,
                  uses: isConsumable
                    ? newValue
                    : Math.min(newValue, prev.maxUses),
                  maxUses: isConsumable ? Math.max(1, newValue) : prev.maxUses,
                }));
              }}
              className="text-center font-mono border-[var(--theme-warning)]/50 text-[var(--theme-warning)]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
