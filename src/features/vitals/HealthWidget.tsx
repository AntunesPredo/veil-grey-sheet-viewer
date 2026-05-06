import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCharacterStore } from "../character/store";
import { useCharacterStats } from "../../shared/hooks/useCharacterStats";
import { useVitalsStore } from "./useVitalsStore";
import type { EquipableItem } from "../../shared/types/veil-grey";
import { Button } from "../../shared/ui/Form";

type SliceType = "hp" | "temp" | "empty";

function HexCell({
  slices,
  hpColor,
}: {
  slices: SliceType[];
  hpColor: string;
}) {
  const slicePaths = [
    "M50 50 L50 0 L6.7 25 Z", // Slice 1 (11h)
    "M50 50 L6.7 25 L6.7 75 Z", // Slice 2 (10h)
    "M50 50 L6.7 75 L50 100 Z", // Slice 3 (7h)
    "M50 50 L50 100 L93.3 75 Z", // Slice 4 (6h)
    "M50 50 L93.3 75 L93.3 25 Z", // Slice 5 (4h)
    "M50 50 L93.3 25 L50 0 Z", // Slice 6 (1h)
  ];

  const hasAnyPoints = slices.some((s) => s !== "empty");
  const hasTemp = slices.some((s) => s === "temp");
  const outlineColor = hasTemp ? "var(--theme-success)" : hpColor;

  return (
    <svg viewBox="0 0 100 100" className="w-10 h-10 drop-shadow-md">
      <polygon
        points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25"
        fill="none"
        stroke="var(--theme-border)"
        strokeWidth="3"
        opacity={hasAnyPoints ? 0.8 : 0.3}
      />

      {slices.map((type, i) => {
        const fillColor =
          type === "hp"
            ? hpColor
            : type === "temp"
              ? "var(--theme-success)"
              : "transparent";
        return (
          <path
            key={i}
            d={slicePaths[i]}
            fill={fillColor}
            stroke={type !== "empty" ? "white" : "transparent"}
            strokeWidth="1"
            opacity={type !== "empty" ? 1 : 0.05}
            className={
              type === "temp"
                ? "animate-pulse"
                : "transition-colors duration-300"
            }
          />
        );
      })}

      {hasAnyPoints && (
        <polygon
          points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25"
          fill="none"
          stroke={outlineColor}
          strokeWidth="4"
          className={hasTemp ? "animate-pulse opacity-100" : "opacity-40"}
          filter="blur(1px)"
        />
      )}
    </svg>
  );
}

function BioClusterChassis({
  children,
  chassisRef,
}: {
  children: React.ReactNode;
  chassisRef: React.RefObject<HTMLDivElement | null>;
}) {
  const inventory = useCharacterStore((state) => state.inventory);

  const equippedArmor = inventory.find(
    (i) => i.isEquipped && (i as EquipableItem).armorProps,
  ) as EquipableItem | undefined;

  const belt = equippedArmor
    ? "border-[var(--theme-accent)] h-[calc(100%+4px)]"
    : "border-[var(--theme-border)] h-3";

  return (
    <div className="relative flex flex-col">
      <div
        className={`absolute -top-1 -left-1 w-3 border-t-2 border-l-2 ${belt}`}
      />
      <div
        className={`absolute -top-1 -right-1 w-3 border-t-2 border-r-2 ${belt}`}
      />
      <div className={`flex flex-col ${equippedArmor ? "" : "gap-2"}`}>
        <div
          ref={chassisRef}
          className="border-2 border-[var(--theme-border)] bg-[#030303] p-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]"
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(var(--theme-border) 1px, transparent 1px), linear-gradient(90deg, var(--theme-border) 1px, transparent 1px)",
              backgroundSize: "15px 15px",
            }}
          ></div>

          <div className="relative z-10">{children}</div>
        </div>

        {equippedArmor ? (
          <div className="border-2 border-[var(--theme-accent)] bg-[var(--theme-accent)]/5 p-4 flex flex-col gap-3 shadow-[inset_0_0_15px_rgba(0,0,0,1)] relative">
            <div className="absolute top-1 left-1 w-2 h-2 bg-[var(--theme-accent)] opacity-60" />

            <div className="flex justify-between items-center border-b border-[var(--theme-accent)]/30 pb-2">
              <span className="text-[11px] font-black text-[var(--theme-accent)] tracking-widest uppercase">
                BLINDAGEM ATIVA: {equippedArmor.name}
              </span>
              <span className="text-[12px] font-black font-mono text-[var(--theme-accent)]">
                {equippedArmor.armorProps?.pe} /{" "}
                {equippedArmor.armorProps?.maxPe} PE
              </span>
            </div>

            <div className="flex items-center gap-4">
              <svg
                className="w-6 h-8 fill-[var(--theme-accent)] opacity-80"
                viewBox="0 0 24 24"
              >
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
              <div className="flex-1 h-3 bg-black border-2 border-[var(--theme-accent)]/50 overflow-hidden relative">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-[var(--theme-accent)] shadow-[0_0_8px_var(--theme-accent)]"
                  animate={{
                    width: `${(equippedArmor.armorProps!.pe / equippedArmor.armorProps!.maxPe) * 100}%`,
                  }}
                />
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(90deg, transparent, transparent 6px, #000 6px, #000 8px)",
                  }}
                />
              </div>
              <div className="border-l-2 border-[var(--theme-accent)] pl-3">
                <span className="text-[10px] font-mono tracking-widest text-[var(--theme-accent)]/70 uppercase">
                  Redução Máxima
                </span>
                <span className="text-[13px] font-black text-center font-mono text-[var(--theme-accent)] block leading-none mt-1">
                  -{equippedArmor.armorProps?.rd}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-14 border-2 border-dashed border-[var(--theme-border)] opacity-30 flex items-center justify-center bg-black/30">
            <span className="text-[10px] font-mono tracking-widest uppercase">
              Nenhuma blindagem detectada
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function HealthWidget() {
  const hp = useCharacterStore((state) => state.hp);
  const toggleAutoInjury = useCharacterStore((state) => state.toggleAutoInjury);
  const setManualInjury = useCharacterStore((state) => state.setManualInjury);
  const creationStatus = useCharacterStore((state) => state.creationStatus);

  const { maxHp, isInjured, isVeryInjured } = useCharacterStats();
  const { openModal } = useVitalsStore();

  const hpColor = isVeryInjured
    ? "var(--theme-danger)"
    : isInjured
      ? "var(--theme-warning)"
      : "var(--theme-accent)";

  const totalPoints = Math.max(maxHp, hp.current + hp.temp);
  const hexesNeeded = Math.ceil(totalPoints / 6);

  const [columns, setColumns] = useState(6);
  const chassisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chassisRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const availableWidth = entry.contentRect.width - 32;
        const calculatedCols = Math.max(1, Math.floor(availableWidth / 44));
        setColumns(calculatedCols);
      }
    });

    observer.observe(chassisRef.current);
    return () => observer.disconnect();
  }, []);

  const rows = Math.ceil(hexesNeeded / columns);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col md:flex-row gap-2 md:gap-0 justify-between items-end border-b-2 border-[var(--theme-border)] pb-2">
        <div className="flex items-baseline self-center gap-2">
          <span
            className="text-7xl font-black font-mono tracking-tighter leading-none"
            style={{
              color: hp.temp ? "var(--theme-success)" : hpColor,
              textShadow: `0px 0px 6px ${hp.temp ? "var(--theme-success)" : hpColor}`,
            }}
          >
            {String(hp.current + hp.temp).padStart(2, "0")}
          </span>
          <div className="flex gap-2">
            <span className="text-xl text-[var(--theme-accent)]/60 font-mono font-bold leading-none">
              / {String(maxHp).padStart(2, "0")}
            </span>
            {hp.temp > 0 ? (
              <span className="text-xl text-[var(--theme-success)] font-bold leading-none animate-pulse">
                (+{hp.temp.toString().padStart(2, "0")})
              </span>
            ) : null}
            <span className="text-[9px] hidden md:flex font-mono tracking-widest text-[var(--theme-border)] mt-1">
              MAX_CAPACITY
            </span>
          </div>
        </div>

        <div className="border-l-4 border-[var(--theme-border)] pl-3 mb-1 w-full md:w-auto">
          <div className="flex items-end gap-2">
            <span className="text-[9px] font-mono text-[var(--theme-accent)]/60 tracking-widest uppercase">
              ATUAL
            </span>
            <span
              className={`text-xl text-[${hpColor}] font-mono font-bold leading-none`}
            >
              {`${Math.min((hp.current / maxHp) * 100, 100).toFixed(1)}%`}
            </span>
          </div>

          <div className="w-full h-6 md:h-1.5 bg-[var(--theme-background)] border border-[var(--theme-border)] relative overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.5)_inset] mt-1">
            <motion.div
              className="h-full"
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min((hp.current / maxHp) * 100, 100)}%`,
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                backgroundColor: hpColor,
                boxShadow: `0 0 8px ${hpColor}`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <BioClusterChassis chassisRef={chassisRef}>
          <span className="text-[9px] font-mono font-bold text-[var(--theme-accent)] tracking-widest uppercase block mb-3 opacity-70 w-full text-left">
            [ LEITURA_DENSIDADE_CELULAR ]
          </span>

          <div
            className="grid gap-x-1 gap-y-[-10px] justify-start w-fit"
            style={{
              gridTemplateColumns: `repeat(${columns}, 40px)`,
              gridTemplateRows: `repeat(${rows}, 36px)`,
            }}
          >
            {Array.from({ length: hexesNeeded }).map((_, hexIndex) => {
              const slices: SliceType[] = Array.from({ length: 6 }).map(
                (_, sliceIndex) => {
                  const globalPointIndex = hexIndex * 6 + sliceIndex;
                  if (globalPointIndex < hp.current) return "hp";
                  if (
                    globalPointIndex >= hp.current &&
                    globalPointIndex < hp.current + hp.temp
                  )
                    return "temp";
                  return "empty";
                },
              );

              const currentRow = Math.floor(hexIndex / columns);
              const isOddRow = currentRow % 2 !== 0;

              return (
                <div
                  key={`hex-${hexIndex}`}
                  className="w-10 h-10"
                  style={{
                    gridColumn: `span 1`,
                    marginLeft: isOddRow ? "22px" : "0px",
                    marginTop: "-1px",
                  }}
                >
                  <HexCell slices={slices} hpColor={hpColor} />
                </div>
              );
            })}
          </div>
        </BioClusterChassis>
      </div>

      {creationStatus === "CLOSED" ? (
        <div className="grid grid-cols-2 gap-4 mt-2">
          <Button
            onClick={() => openModal("DAMAGE")}
            variant="danger"
            className="w-full group overflow-hidden transition-all"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl font-black">!</span>
              <span className="text-[11px] font-black tracking-widest group-hover:text-white transition-colors uppercase">
                Registrar Trauma
              </span>
            </div>
          </Button>

          <Button variant="success" onClick={() => openModal("HEALING")}>
            <div className="relative flex items-center justify-center gap-2">
              <span className="text-xl font-black leading-none">+</span>
              <span className="text-[11px] font-black tracking-widest uppercase">
                Injetar Cura
              </span>
            </div>
          </Button>
        </div>
      ) : null}

      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-2 relative flex items-center gap-2 mt-1 min-h-[50px] overflow-hidden">
        <motion.div layout className="flex gap-2 w-full h-full">
          <motion.div
            layout
            onClick={toggleAutoInjury}
            className={`overflow-hidden h-12 border-2 cursor-pointer transition-colors flex items-center justify-between px-3
                 ${hp.autoApplyInjury ? "border-[var(--theme-accent)] bg-[var(--theme-accent)]/10" : "border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50"}`}
            initial={false}
            animate={{
              width: hp.autoApplyInjury ? "100%" : "20%",
            }}
            transition={{ duration: 0.1, ease: "linear" }}
          >
            <span
              className={`font-black tracking-wider transition-all uppercase ${hp.autoApplyInjury ? "text-[14px] flex-1 text-center text-[var(--theme-accent)]" : "text-[11px] text-[var(--theme-border)]"}`}
            >
              {hp.autoApplyInjury
                ? "APLICAÇÕES DE FERIMENTOS AUTOMÁTICOS"
                : "AUTO"}
            </span>
            <div
              className={`w-3.5 h-3.5 border-2 border-[var(--theme-accent)] rotate-45 transition-all duration-300 ${hp.autoApplyInjury ? "bg-[var(--theme-accent)] shadow-[0_0_8px_var(--theme-accent)]" : "bg-black"}`}
            />
          </motion.div>

          <AnimatePresence>
            {!hp.autoApplyInjury && (
              <>
                <motion.div
                  layout
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "40%" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.1, ease: "linear" }}
                  onClick={() => setManualInjury("isInjured", !hp.isInjured)}
                  className={`h-12 border-2 cursor-pointer flex items-center justify-between gap-1 p-2 ${isInjured ? "border-[var(--theme-warning)] bg-[var(--theme-warning)]/10" : "border-[var(--theme-border)] hover:border-[var(--theme-warning)]/50"}`}
                >
                  <span
                    className={`text-[11px] font-black tracking-widest uppercase ${isInjured ? "text-[var(--theme-warning)]" : "text-[var(--theme-accent)]"}`}
                  >
                    MACHUCADO
                  </span>
                  <div
                    className={`w-3 h-3 border border-[var(--theme-warning)] rotate-45 transition-all ${isInjured ? "bg-[var(--theme-warning)] shadow-[0_0_8px_var(--theme-warning)]" : "bg-black"}`}
                  />
                </motion.div>

                <motion.div
                  layout
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "40%" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.1, ease: "linear" }}
                  onClick={() =>
                    setManualInjury("isVeryInjured", !hp.isVeryInjured)
                  }
                  className={`h-12 border-2 cursor-pointer flex items-center justify-between gap-1 p-2 ${isVeryInjured ? "border-[var(--theme-danger)] bg-[var(--theme-danger)]/10" : "border-[var(--theme-border)] hover:border-[var(--theme-danger)]/50"}`}
                >
                  <span
                    className={`text-[11px] font-black tracking-widest uppercase ${isVeryInjured ? "text-[var(--theme-danger)]" : "text-[var(--theme-accent)]"}`}
                  >
                    CRÍTICO
                  </span>
                  <div
                    className={`w-3 h-3 border border-[var(--theme-danger)] rotate-45 transition-all ${isVeryInjured ? "bg-[var(--theme-danger)] shadow-[0_0_8px_var(--theme-danger)]" : "bg-black"}`}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
