import { useRef } from "react";
import { useUIStore } from "../../shared/store/useUIStore";
import { useCharacterStore } from "../character/store";
import { Accordion } from "../../shared/ui/Accordion";
import { Button, NumberStepper } from "../../shared/ui/Form";
import { VG_CONFIG } from "../../shared/config/system.config";
import type { Attribute } from "../../shared/types/veil-grey";
import { useDrawerResize } from "../../shared/hooks/useDrawerResize";
import { RetroToast } from "../../shared/ui/RetroToast";
import { useActiveModifiers } from "../../shared/hooks/useActiveModifiers";
import { useRoller } from "../../shared/hooks/useRoller";
import { useCharacterStats } from "../../shared/hooks/useCharacterStats";

export function AttributeDrawer() {
  const { drawerLeft, setDrawerState, accordions, toggleAccordion } =
    useUIStore();
  const attributes = useCharacterStore((state) => state.attributes);
  const level = useCharacterStore((state) => state.level);
  const freePoints = useCharacterStore((state) => state.freePoints);
  const creationStatus = useCharacterStore((state) => state.creationStatus);
  const sandboxMode = useCharacterStore((state) => state.sandboxMode);
  const lockedSnapshot = useCharacterStore((state) => state.lockedSnapshot);
  const updateAttribute = useCharacterStore((state) => state.updateAttribute);
  const updateProgression = useCharacterStore(
    (state) => state.updateProgression,
  );
  const { getTargetSum } = useActiveModifiers();

  const freeAttrMod = getTargetSum("FREE_ATTR");
  const effectiveFreePoints = freePoints.attributes + freeAttrMod;

  const { getAttrMod } = useActiveModifiers();
  const { secondaryAttributes } = useCharacterStats();
  const { initiateRoll } = useRoller();
  const { isOpen, isPinned, widthVW } = drawerLeft;

  const drawerRef = useRef<HTMLDivElement>(null!);
  const { handleMouseDown } = useDrawerResize("left", drawerRef);

  const isDistributing =
    creationStatus === "STARTED" || creationStatus === "LEVEL_UP";
  const canEdit = isDistributing || sandboxMode;

  const currentTier =
    VG_CONFIG.progression.tiers
      .slice()
      .reverse()
      .find((t) => level >= t.minLevel) || VG_CONFIG.progression.tiers[0];

  const transformClass =
    !isPinned && !isOpen ? "-translate-x-full" : "translate-x-0";
  const layoutClass = isPinned
    ? "relative flex-shrink-0 border-r z-20 h-full"
    : `fixed top-0 bottom-0 left-0 h-[100vh] border-r-2 shadow-[20px_0_30px_rgba(0,0,0,0.8)] ${isOpen ? "z-[110]" : "z-[100]"}`;

  const handleAttributeChange = (attrKey: Attribute, delta: number) => {
    const currentVal = attributes[attrKey];
    const targetVal = currentVal + delta;

    if (sandboxMode) {
      updateAttribute(attrKey, targetVal);
      return;
    }

    if (!isDistributing) return;

    if (
      targetVal < VG_CONFIG.rules.attrMin ||
      targetVal > VG_CONFIG.rules.attrMax
    )
      return;
    if (delta > 0 && targetVal > currentTier.maxAttr) {
      RetroToast.warning(
        `CAP ATINGIDO. MÁXIMO NÍVEL ${level} É ${currentTier.maxAttr}`,
      );
      return;
    }

    if (
      delta < 0 &&
      lockedSnapshot &&
      targetVal < lockedSnapshot.attributes[attrKey]
    ) {
      RetroToast.error("NÃO É POSSÍVEL REGREDIR ATRIBUTOS CONSOLIDADOS.");
      return;
    }

    if (delta > 0 && effectiveFreePoints <= 0) {
      RetroToast.warning("PONTOS INSUFICIENTES.");
      return;
    }

    updateProgression({
      freePoints: {
        ...freePoints,
        attributes: effectiveFreePoints - delta,
      },
    });

    updateAttribute(attrKey, targetVal);
  };

  return (
    <div
      ref={drawerRef}
      className={`bg-[var(--theme-background)] flex flex-col transition-transform duration-300 ease-in-out border-[var(--theme-accent)] w-[calc(100vw-24px)] md:w-[var(--desktop-w)] ${layoutClass} ${transformClass}`}
      style={{ "--desktop-w": `${widthVW}vw` } as React.CSSProperties}
    >
      {!isPinned && (
        <button
          onClick={() => setDrawerState("left", { isOpen: !isOpen })}
          className="absolute top-1/2 -translate-y-1/2 right-[-24px] w-6 h-16 bg-[var(--theme-background)] border border-l-0 border-[var(--theme-accent)] text-[var(--theme-accent)] font-bold shadow-[5px_0_10px_rgba(0,0,0,0.8)] flex items-center justify-center hover:bg-[var(--theme-accent)] hover:text-[var(--theme-background)] transition-colors rounded-r-md"
        >
          {isOpen ? "◀" : "▶"}
        </button>
      )}

      <div className="flex justify-between items-center p-2 bg-[var(--theme-accent)]/10 border-b border-[var(--theme-accent)] shrink-0">
        <span className="font-bold tracking-widest text-[10px] text-[var(--theme-accent)]">
          MATRIZ DE ATRIBUTOS
        </span>
        <Button
          size="sm"
          className={`px-1 py-0 border-none hidden md:block ${isPinned ? "bg-[var(--theme-accent)] text-[var(--theme-background)]" : "hover:text-[var(--theme-accent)]"}`}
          onClick={() =>
            setDrawerState("left", { isPinned: !isPinned, isOpen: true })
          }
        >
          [PIN]
        </Button>
      </div>

      {(isDistributing || sandboxMode) && (
        <div className="bg-[var(--theme-warning)]/10 border-b border-[var(--theme-warning)]/30 p-2 text-center shrink-0">
          <span className="text-[10px] font-bold tracking-widest text-[var(--theme-warning)] uppercase">
            PONTOS LIVRES: {sandboxMode ? "[SANDBOX]" : effectiveFreePoints}
          </span>
        </div>
      )}

      <div
        className={`flex-1 overflow-y-auto p-2 custom-scrollbar relative pr-3 flex flex-col ${!isPinned ? "justify-center" : ""}`}
      >
        {Object.entries(VG_CONFIG.att_groups).map(([groupKey, group]) => {
          const key = `ATT_DRAWER_${groupKey}`;
          return (
            <Accordion
              key={key}
              isOpen={accordions[key]}
              onToggle={() => toggleAccordion(key)}
              title={group.label}
            >
              {Object.entries(group.atributes).map(([attrKey, attr]) => {
                const baseVal = attributes[attrKey as Attribute] || 0;
                const modVal = getAttrMod(attrKey, group.rollCategory);
                const finalVal = baseVal + modVal;

                const minVal = lockedSnapshot
                  ? lockedSnapshot.attributes[attrKey as Attribute]
                  : VG_CONFIG.rules.attrMin;
                const canReduce = sandboxMode || baseVal > minVal;
                const canIncrease =
                  sandboxMode ||
                  (effectiveFreePoints > 0 &&
                    baseVal < currentTier.maxAttr &&
                    baseVal < VG_CONFIG.rules.attrMax);

                let valueBoxColor =
                  "text-[var(--theme-text)] bg-[var(--theme-accent)]/20 border-[var(--theme-accent)]";
                if (modVal > 0)
                  valueBoxColor =
                    "text-[var(--theme-success)] bg-[var(--theme-success)]/10 border-[var(--theme-success)]";
                if (modVal < 0)
                  valueBoxColor =
                    "text-[var(--theme-danger)] bg-[var(--theme-danger)]/10 border-[var(--theme-danger)]";

                return (
                  <div
                    key={attrKey}
                    className="flex flex-col sm:flex-row justify-between items-center bg-[var(--theme-background)]/50 p-1 border border-[var(--theme-accent)]/30 hover:border-[var(--theme-accent)]/50 transition-colors"
                  >
                    <span className="text-[12px] uppercase font-bold">
                      {attr.label}
                    </span>

                    <div className="flex gap-2 items-center shrink-0">
                      {canEdit ? (
                        <NumberStepper
                          size="sm"
                          value={baseVal}
                          onDecrement={() =>
                            handleAttributeChange(attrKey as Attribute, -1)
                          }
                          onIncrement={() =>
                            handleAttributeChange(attrKey as Attribute, 1)
                          }
                          disableDecrement={!canReduce}
                          disableIncrement={!canIncrease}
                        />
                      ) : (
                        <span
                          className={`font-mono px-2 py-1 border text-xs min-w-[32px] text-center flex items-center justify-center gap-1 ${valueBoxColor}`}
                        >
                          {finalVal}
                          {modVal !== 0 && (
                            <span className="text-[10px] opacity-80">
                              [{modVal > 0 ? `+${modVal}` : modVal}]
                            </span>
                          )}
                        </span>
                      )}

                      {!isDistributing && (
                        <Button
                          size="sm"
                          className="px-2 py-1 text-[9px]"
                          onClick={() =>
                            initiateRoll(
                              attr.label,
                              `${VG_CONFIG.rules.mainDice}+${baseVal}`,
                              [attrKey, group.rollCategory],
                            )
                          }
                        >
                          ROLL
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </Accordion>
          );
        })}

        <div className="mt-4">
          <Accordion
            isOpen={accordions["SECONDARY"]}
            onToggle={() => toggleAccordion("SECONDARY")}
            title="ATRIBUTOS SECUNDÁRIOS"
          >
            <SecondaryStatRow
              label="AGILIDADE"
              rollKey="agility"
              rollCategory={VG_CONFIG.att_secondary.agility.rollCategory}
              baseValue={secondaryAttributes.agility}
              isDistributing={isDistributing}
              icon={<path d="M9 7L10 0H8L2 7V9H7L6 16H8L14 9L14 7H9Z" />}
            />
            <SecondaryStatRow
              label="MASSA CORPÓREA"
              rollKey="mass"
              rollCategory={VG_CONFIG.att_secondary.mass.rollCategory}
              baseValue={secondaryAttributes.mass}
              isDistributing={isDistributing}
              icon={
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.01717 9.33332C8.23022 9.1387 8.44783 8.94232 8.66896 8.74329L8.90839 8.5279C9.07797 8.37529 9.24931 8.22081 9.42128 8.06407L9.49147 8C11.7057 5.9758 14 3.57105 14 0H12C12 0.719834 11.8779 1.38003 11.6565 2H4.34354C4.1221 1.38003 4 0.719834 4 0H2C2 3.57105 4.29434 5.9758 6.50853 8C4.29434 10.0242 2 12.429 2 16H4C4 15.2802 4.1221 14.62 4.34354 14H11.6565C11.8779 14.62 12 15.2802 12 16H14C14 13.2115 12.6011 11.1342 10.9337 9.39389C10.7174 9.59149 10.5068 9.78069 10.3049 9.962L10.0069 10.2299C9.81254 10.4048 9.62552 10.5742 9.44577 10.7388C9.84726 11.1544 10.2154 11.5718 10.5397 12H5.46033C6.14452 11.0966 7.0241 10.2411 8 9.349L8.01717 9.33332ZM5.46033 4H10.5397C9.85548 4.90345 8.97591 5.75894 8 6.651C7.0241 5.75894 6.14452 4.90345 5.46033 4Z"
                />
              }
            />
            <SecondaryStatRow
              label="PERCEPÇÃO"
              rollKey="perception"
              rollCategory={VG_CONFIG.att_secondary.perception.rollCategory}
              baseValue={secondaryAttributes.perception}
              isDistributing={isDistributing}
              icon={
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0 8L3.07945 4.30466C4.29638 2.84434 6.09909 2 8 2C9.90091 2 11.7036 2.84434 12.9206 4.30466L16 8L12.9206 11.6953C11.7036 13.1557 9.90091 14 8 14C6.09909 14 4.29638 13.1557 3.07945 11.6953L0 8ZM8 11C9.65685 11 11 9.65685 11 8C11 6.34315 9.65685 5 8 5C6.34315 5 5 6.34315 5 8C5 9.65685 6.34315 11 8 11Z"
                />
              }
            />
            <SecondaryStatRow
              label="SAÚDE MENTAL"
              rollKey="mental_healt"
              rollCategory={VG_CONFIG.att_secondary.mental_health.rollCategory}
              baseValue={secondaryAttributes.mental_health}
              isDistributing={isDistributing}
              icon={
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M11 16V13H14V9H16V7L12 0H7C3.68629 0 1 2.68629 1 6C1 8.22085 2.2066 10.1599 4 11.1973V16H11ZM11 6C11.5523 6 12 5.55228 12 5C12 4.44772 11.5523 4 11 4C10.4477 4 10 4.44772 10 5C10 5.55228 10.4477 6 11 6Z"
                />
              }
            />
          </Accordion>
        </div>
      </div>

      <div
        className="hidden md:flex absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-[var(--theme-accent)]/30 transition-colors z-50 flex items-center justify-center"
        onMouseDown={handleMouseDown}
      >
        <div className="h-8 w-[1px] bg-[var(--theme-accent)]/50" />
      </div>
    </div>
  );
}

function SecondaryStatRow({
  label,
  rollKey,
  rollCategory,
  baseValue,
  icon,
  isDistributing,
}: {
  label: string;
  rollKey: string;
  rollCategory: string;
  baseValue: number;
  icon: React.ReactNode;
  isDistributing: boolean;
}) {
  const { initiateRoll } = useRoller();
  const { getAttrMod } = useActiveModifiers();
  const modVal = getAttrMod(rollKey, rollCategory) || 0;
  const finalVal = baseValue + modVal;
  let valueBoxColor =
    "text-[var(--theme-text)] bg-[var(--theme-background)]/80 border-[var(--theme-border)]";
  if (modVal > 0)
    valueBoxColor =
      "text-[var(--theme-success)] bg-[var(--theme-success)]/10 border-[var(--theme-success)]";
  if (modVal < 0)
    valueBoxColor =
      "text-[var(--theme-danger)] bg-[var(--theme-danger)]/10 border-[var(--theme-danger)]";

  return (
    <div className="flex justify-between items-center bg-[var(--theme-accent)]/5 px-1 py-2 border border-[var(--theme-accent)]/20 mb-1">
      <div className="flex items-center gap-2 text-[var(--theme-accent)] opacity-80">
        <svg className="w-6 h-6 fill-current" viewBox="0 0 16 16">
          {icon}
        </svg>
        <span className="text-[12px] uppercase font-bold">{label}</span>
      </div>
      <div className="flex gap-2 items-center shrink-0">
        <span
          className={`font-mono px-2 py-1 border text-[14px] min-w-[32px] text-center flex items-center justify-center gap-1 ${valueBoxColor}`}
        >
          {finalVal}
          {modVal !== 0 && (
            <span className="text-[14px]">
              [{modVal > 0 ? `+${modVal}` : modVal}]
            </span>
          )}
        </span>
        {!isDistributing && (
          <Button
            size="sm"
            className="px-2 py-1 text-[9px]"
            onClick={() =>
              initiateRoll(label, `${VG_CONFIG.rules.mainDice}+${baseValue}`, [
                rollKey,
                rollCategory,
              ])
            }
          >
            ROLL
          </Button>
        )}
      </div>
    </div>
  );
}
