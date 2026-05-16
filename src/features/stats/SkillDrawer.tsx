import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "../../shared/store/useUIStore";
import { useCharacterStore } from "../character/store";
import { useDrawerResize } from "../../shared/hooks/useDrawerResize";
import { VG_CONFIG } from "../../shared/config/system.config";
import { Button, Input, NumberStepper, Checkbox } from "../../shared/ui/Form";
import { Accordion } from "../../shared/ui/Accordion";
import type { Skill, Attribute, SkillData } from "../../shared/types/veil-grey";
import { RetroToast } from "../../shared/ui/RetroToast";
import { useActiveModifiers } from "../../shared/hooks/useActiveModifiers";
import { useRoller } from "../../shared/hooks/useRoller";

const getAttrShort = (attrId: string) => {
  for (const group of Object.values(VG_CONFIG.att_groups)) {
    const attributes = group.atributes as Record<string, { short: string }>;
    if (attrId in attributes) {
      return attributes[attrId].short;
    }
  }
  return attrId.substring(0, 3).toUpperCase();
};

export function SkillDrawer() {
  const { drawerRight, setDrawerState, accordions, toggleAccordion } =
    useUIStore();

  const skills = useCharacterStore((state) => state.skills);
  const attributes = useCharacterStore((state) => state.attributes);
  const level = useCharacterStore((state) => state.level);
  const freePoints = useCharacterStore((state) => state.freePoints);
  const creationStatus = useCharacterStore((state) => state.creationStatus);
  const sandboxMode = useCharacterStore((state) => state.sandboxMode);
  const lockedSnapshot = useCharacterStore((state) => state.lockedSnapshot);
  const updateSkill = useCharacterStore((state) => state.updateSkill);
  const updateProgression = useCharacterStore(
    (state) => state.updateProgression,
  );
  const { getBonusSum, getSkillMod } = useActiveModifiers();

  const effectiveFreePoints = freePoints.skills;

  const { initiateRoll } = useRoller();
  const { isOpen, isPinned, widthVW } = drawerRight;
  const drawerRef = useRef<HTMLDivElement>(null!);
  const { handleMouseDown } = useDrawerResize("right", drawerRef);

  const [searchQuery, setSearchQuery] = useState("");
  const [showAllDesc, setShowAllDesc] = useState(false);
  const [descToggles, setDescToggles] = useState<Record<string, boolean>>({});

  const isDistributing =
    creationStatus === "STARTED" || creationStatus === "LEVEL_UP";
  const canEdit = isDistributing || sandboxMode;
  const currentTier =
    VG_CONFIG.progression.tiers
      .slice()
      .reverse()
      .find((t) => level >= t.minLevel) || VG_CONFIG.progression.tiers[0];

  const transformClass =
    !isPinned && !isOpen ? "translate-x-full" : "translate-x-0";
  const layoutClass = isPinned
    ? "relative flex-shrink-0 border-l z-20 h-full"
    : `fixed top-0 bottom-0 right-0 h-[100vh] border-l-2 shadow-[-20px_0_30px_rgba(0,0,0,0.8)] ${isOpen ? "z-[110]" : "z-[100]"}`;

  const allSkillsFlat = Object.entries(VG_CONFIG.skill_groups).flatMap(
    ([, group]) =>
      Object.entries(group.skills).map(([skillKey, skill]) => ({
        ...skill,
        key: skillKey,
        groupLabel: group.label,
        rollCategory: group.rollCategory,
      })),
  );

  const filteredSkills =
    searchQuery.trim() === ""
      ? []
      : allSkillsFlat.filter(
          (s) =>
            s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.id.toLowerCase().includes(searchQuery.toLowerCase()),
        );

  const handleSkillChange = (
    skillKey: Skill,
    delta: number,
    skillData: SkillData,
  ) => {
    const currentVal = skills[skillKey] || 0;
    const targetVal = currentVal + delta;

    if (sandboxMode) {
      updateSkill(skillKey, targetVal);
      return;
    }

    if (!isDistributing) return;

    const baseValues = skillData.bases.map(
      (b: string) => attributes[b as Attribute] || 0,
    );
    const minBaseValue = Math.min(...baseValues);
    const actualSkillCap = Math.min(
      currentTier.maxSkill,
      VG_CONFIG.rules.skillMax,
      minBaseValue,
    );

    if (targetVal < VG_CONFIG.rules.skillMin) return;

    // TODO: Toasts will be tooltips
    if (delta > 0 && targetVal > actualSkillCap) {
      RetroToast.warning(
        `CAP ATINGIDO. LIMITADO PELO NÍVEL OU ATRIBUTO BASE (${actualSkillCap}).`,
      );
      return;
    }

    if (
      delta < 0 &&
      lockedSnapshot &&
      targetVal < lockedSnapshot.skills[skillKey]
    ) {
      RetroToast.error("NÃO É POSSÍVEL REGREDIR PERÍCIAS CONSOLIDADAS.");
      return;
    }

    if (delta > 0 && effectiveFreePoints <= 0) {
      RetroToast.warning("PONTOS INSUFICIENTES.");
      return;
    }

    updateProgression({
      freePoints: {
        ...freePoints,
        skills: effectiveFreePoints - delta,
      },
    });

    updateSkill(skillKey, targetVal);
  };

  const toggleDesc = (skillKey: string) => {
    setDescToggles((prev) => ({ ...prev, [skillKey]: !prev[skillKey] }));
  };

  const renderSkillRow = (
    skillKey: string,
    skillData: SkillData & { rollCategory: string },
    isFiltered = false,
  ) => {
    const rawBaseVal = skills[skillKey as Skill] || 0;
    const rollCategory = skillData.rollCategory || "";

    const bonusVal = getBonusSum(skillKey) + getBonusSum(rollCategory);

    const baseValues = skillData.bases.map(
      (b: string) => attributes[b as Attribute] || 0,
    );

    const minBaseValue = Math.min(...baseValues);
    const actualSkillCap = Math.min(
      currentTier.maxSkill,
      VG_CONFIG.rules.skillMax,
      minBaseValue,
    );

    const baseVal = Math.min(rawBaseVal + bonusVal, actualSkillCap);
    const modVal = getSkillMod(skillKey, rollCategory);
    const finalVal = baseVal + modVal;

    const minVal = lockedSnapshot
      ? lockedSnapshot.skills[skillKey as Skill]
      : VG_CONFIG.rules.skillMin;
    const canReduce = sandboxMode || rawBaseVal > minVal;
    const canIncrease =
      sandboxMode ||
      (effectiveFreePoints > 0 && rawBaseVal + bonusVal < actualSkillCap);

    const isDescOpen = showAllDesc || !!descToggles[skillKey];

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
        key={skillKey}
        className={`flex flex-col bg-[var(--theme-background)] p-1 border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50 transition-colors ${isFiltered ? "p-2" : ""}`}
      >
        <div className="flex justify-between items-center w-full">
          <div
            className="flex flex-row truncate pr-2 shrink min-w-[160px] gap-1 cursor-pointer group"
            onClick={() => toggleDesc(skillKey)}
          >
            <svg
              className="w-4 h-4 mt-[2px] fill-current group-hover:opacity-100 transition-transform shrink-0"
              style={{
                transform: isDescOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
              viewBox="0 0 24 24"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
            <div className="flex flex-col">
              {isFiltered && (
                <span className="text-[10px] text-[var(--theme-text)]">
                  [{skillData.groupLabel}]
                </span>
              )}
              <div className="flex items-center gap-1">
                <span className="text-[12px] uppercase truncate font-bold group-hover:text-[var(--theme-accent)] transition-colors">
                  {skillData.label}
                </span>
              </div>
              <div className="flex items-center">
                {skillData.bases.map((base: string, idx: number) => {
                  const short = getAttrShort(base);
                  const attrVal = attributes[base as Attribute] || 0;
                  return (
                    <span
                      key={base}
                      className="text-[9px] font-mono text-[var(--theme-text)]/70 flex items-center"
                    >
                      {short}{" "}
                      <span className="text-[var(--theme-accent)] ml-1 font-bold">
                        {attrVal}
                      </span>
                      {idx < skillData.bases.length - 1 && (
                        <span className="mx-1 text-[var(--theme-text)]">|</span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-2 items-center shrink-0">
            {canEdit ? (
              <NumberStepper
                size="sm"
                value={rawBaseVal}
                onDecrement={() =>
                  handleSkillChange(skillKey as Skill, -1, skillData)
                }
                onIncrement={() =>
                  handleSkillChange(skillKey as Skill, 1, skillData)
                }
                disableDecrement={!canReduce}
                disableIncrement={!canIncrease}
              />
            ) : (
              <span
                className={`font-mono px-2 py-1 border text-xs min-w-[32px] text-center flex items-center justify-center gap-1 ${valueBoxColor}`}
              >
                {baseVal}
                {modVal !== 0 && (
                  <span className="text-[9px] opacity-80">
                    [{modVal > 0 ? `+${modVal}` : modVal}]
                  </span>
                )}
              </span>
            )}

            {!isDistributing && (
              <Button
                size="sm"
                className="px-2 py-1 text-[9px]"
                onClick={() => {
                  initiateRoll(
                    skillData.label,
                    `${VG_CONFIG.rules.mainDice}+${baseVal > 0 ? finalVal : -1}`,
                    [skillData.id, skillData.rollCategory],
                  );
                  setSearchQuery("");
                }}
              >
                ROLL
              </Button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isDescOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="text-[10px] text-[var(--theme-text)]/70 mt-2 border-dashed border-t border-[var(--theme-accent)]/30 pt-2 pb-1 italic whitespace-normal leading-relaxed">
                {skillData.description || "Descrição indisponível."}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div
      ref={drawerRef}
      className={`bg-[var(--theme-background)] flex flex-col transition-transform duration-300 ease-in-out border-[var(--theme-accent)] w-[calc(100vw-24px)] md:w-[var(--desktop-w)] ${layoutClass} ${transformClass}`}
      style={{ "--desktop-w": `${widthVW}vw` } as React.CSSProperties}
    >
      {!isPinned && (
        <button
          onClick={() => setDrawerState("right", { isOpen: !isOpen })}
          className="absolute top-1/2 -translate-y-1/2 left-[-24px] w-6 h-16 bg-[var(--theme-background)] border border-r-0 border-[var(--theme-accent)] text-[var(--theme-accent)] font-bold shadow-[-5px_0_10px_rgba(0,0,0,0.8)] flex items-center justify-center hover:bg-[var(--theme-accent)] hover:text-black transition-colors rounded-l-md"
        >
          {isOpen ? "▶" : "◀"}
        </button>
      )}

      <div className="flex justify-between items-center p-2 bg-[var(--theme-accent)]/10 border-b border-[var(--theme-accent)] shrink-0 flex-row-reverse">
        <span className="font-bold tracking-widest text-[10px] text-[var(--theme-accent)] uppercase">
          MATRIZ DE PERÍCIAS
        </span>
        <Button
          size="sm"
          variant="primary"
          className={`px-1 py-0 border-none hidden md:block ${isPinned ? "bg-[var(--theme-accent)] text-black" : "hover:text-[var(--theme-accent)]"}`}
          onClick={() =>
            setDrawerState("right", { isPinned: !isPinned, isOpen: true })
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

      <div className="p-3 shrink-0 border-b border-[var(--theme-accent)]/20 bg-[var(--theme-background)]">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="PESQUISAR PERÍCIA..."
              className="w-full pl-8 pr-8 py-2 bg-[var(--theme-accent)] border border-[var(--theme-accent)] text-xs h-[34px]"
            />
            <svg
              className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 fill-[var(--theme-accent)]"
              viewBox="0 0 24 24"
            >
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--theme-accent)] hover:text-[var(--theme-danger)] font-bold px-1"
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0 8L6 2H16V14H6L0 8ZM6.79289 6.20711L8.58579 8L6.79289 9.79289L8.20711 11.2071L10 9.41421L11.7929 11.2071L13.2071 9.79289L11.4142 8L13.2071 6.20711L11.7929 4.79289L10 6.58579L8.20711 4.79289L6.79289 6.20711Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            )}
          </div>
          <div className="shrink-0 bg-[var(--theme-background)] border border-[var(--theme-accent)] px-2 h-[34px] flex items-center justify-center">
            <Checkbox
              label="DESC"
              checked={showAllDesc}
              onChange={() => setShowAllDesc(!showAllDesc)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar relative pl-3 flex flex-col pb-6">
        {searchQuery.trim() !== "" ? (
          <div className="flex flex-col gap-1 border border-[var(--theme-border)] p-2 bg-[var(--theme-background)]">
            <span className="text-[13px] text-[var(--theme-text)] mb-2 font-bold">
              RESULTADOS ({filteredSkills.length})
            </span>
            {filteredSkills.length === 0 ? (
              <span className="text-xs text-[var(--theme-accent)]">
                NENHUMA PERÍCIA ENCONTRADA.
              </span>
            ) : null}

            {filteredSkills.map((skill) =>
              renderSkillRow(skill.key, skill, true),
            )}
          </div>
        ) : (
          <>
            {Object.entries(VG_CONFIG.skill_groups).map(([groupKey, group]) => {
              const key = `SKILL_DRAWER_${groupKey}`;
              return (
                <Accordion
                  key={key}
                  isOpen={accordions[key]}
                  onToggle={() => toggleAccordion(key)}
                  title={group.label}
                >
                  {Object.entries(group.skills).map(([skillKey, skillData]) =>
                    renderSkillRow(
                      skillKey,
                      { ...skillData, rollCategory: group.rollCategory },
                      false,
                    ),
                  )}
                </Accordion>
              );
            })}
          </>
        )}
      </div>

      <div
        className="hidden md:flex absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-[var(--theme-accent)]/30 transition-colors z-50 flex items-center justify-center"
        onMouseDown={handleMouseDown}
      >
        <div className="h-8 w-[1px] bg-[var(--theme-accent)]/50" />
      </div>
    </div>
  );
}
