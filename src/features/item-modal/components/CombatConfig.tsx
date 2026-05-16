import { VG_CONFIG } from "../../../shared/config/system.config";
import type {
  Attribute,
  WeaponRange,
  WeaponScaling,
} from "../../../shared/types/veil-grey";
import { Input } from "../../../shared/ui/Form";
import type { ItemFormData } from "../ItemModal";
import {
  WEAPON_TYPES,
  WEAPON_RANGES,
  WEAPON_SCALINGS,
} from "../../../shared/utils/selectOptions";

export function CombatConfig({
  formData,
  setFormData,
}: {
  formData: ItemFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItemFormData>>;
}) {
  const handleCombatProp = (
    key: keyof typeof formData.combatProps,
    val: string | number | Attribute | WeaponScaling | null,
  ) => {
    setFormData((p) => ({
      ...p,
      combatProps: { ...p.combatProps, [key]: val },
    }));
  };

  return (
    <div className="flex flex-col gap-3 bg-[var(--theme-danger)]/10 border border-[var(--theme-danger)]/30 p-3">
      <span className="text-[10px] font-bold text-[var(--theme-danger)] tracking-widest uppercase mb-1">
        PARÂMETROS DE COMBATE
      </span>
      <select
        value={formData.combatProps.weaponType}
        onChange={(e) => handleCombatProp("weaponType", e.target.value)}
        className="bg-black border border-[var(--theme-danger)]/50 text-[var(--theme-danger)] p-2 text-xs font-mono outline-none w-full uppercase font-bold"
      >
        {WEAPON_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
        <option value="NONE">-- NENHUM --</option>
      </select>

      <div className="grid grid-cols-2 gap-3 mt-2">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-[var(--theme-danger)] tracking-widest uppercase">
            DANO BASE
          </span>
          <Input
            type="number"
            value={formData.combatProps.baseDamage}
            onChange={(e) =>
              handleCombatProp("baseDamage", parseInt(e.target.value) || 0)
            }
            className="w-full text-center border-[var(--theme-danger)]/50 text-[var(--theme-danger)] focus:bg-[var(--theme-danger)]/10"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-[var(--theme-danger)] tracking-widest uppercase">
            ALCANCE
          </span>
          <select
            value={formData.combatProps.range}
            onChange={(e) =>
              handleCombatProp("range", e.target.value as WeaponRange)
            }
            className="w-full bg-black border border-[var(--theme-danger)]/50 text-[var(--theme-danger)] p-2.5 text-xs font-mono outline-none"
          >
            {WEAPON_RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {formData.combatProps.weaponType === "RANGED" && (
          <div className="flex flex-col gap-1 col-span-2 border-t border-dashed border-[var(--theme-danger)]/30 pt-2">
            <span className="text-[9px] text-[var(--theme-danger)] tracking-widest uppercase">
              DIFICULDADE BASE DE DISPARO
            </span>
            <Input
              type="number"
              value={formData.combatProps.baseDifficulty}
              onChange={(e) =>
                handleCombatProp(
                  "baseDifficulty",
                  parseInt(e.target.value) || 0,
                )
              }
              className="w-full text-center border-[var(--theme-danger)]/50 text-[var(--theme-danger)] focus:bg-[var(--theme-danger)]/10"
            />
          </div>
        )}

        {formData.combatProps.weaponType === "MELEE" && (
          <>
            <div className="flex flex-col gap-1 border-t border-dashed border-[var(--theme-danger)]/30 pt-2">
              <span className="text-[9px] text-[var(--theme-danger)] tracking-widest uppercase">
                ATRIBUTO ESCALÁVEL
              </span>
              <select
                value={formData.combatProps.scalingAttr || ""}
                onChange={(e) =>
                  handleCombatProp("scalingAttr", e.target.value || null)
                }
                className="w-full bg-black border border-[var(--theme-danger)]/50 text-[var(--theme-danger)] p-2.5 text-xs font-mono outline-none"
              >
                <option value="">NENHUM</option>
                <optgroup label="Físicos">
                  {Object.entries(VG_CONFIG.att_groups.physical.atributes).map(
                    ([k, a]) => (
                      <option key={k} value={k}>
                        {a.label}
                      </option>
                    ),
                  )}
                </optgroup>
              </select>
            </div>
            <div className="flex flex-col gap-1 border-t border-dashed border-[var(--theme-danger)]/30 pt-2">
              <span className="text-[9px] text-[var(--theme-danger)] tracking-widest uppercase">
                GRAU DE ESCALA
              </span>
              <select
                value={formData.combatProps.scalingTier}
                onChange={(e) =>
                  handleCombatProp(
                    "scalingTier",
                    e.target.value as WeaponScaling,
                  )
                }
                className="w-full bg-black border border-[var(--theme-danger)]/50 text-[var(--theme-danger)] p-2.5 text-xs font-mono outline-none"
              >
                {WEAPON_SCALINGS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
