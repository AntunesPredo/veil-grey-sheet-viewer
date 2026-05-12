import { useState } from "react";
import { useCharacterStore } from "../character/store";
import { useCharacterStats } from "../../shared/hooks/useCharacterStats";
import { useVitalsStore } from "./useVitalsStore";
import { Button } from "../../shared/ui/Form";
import { motion, AnimatePresence } from "framer-motion";
import { VG_CONFIG } from "../../shared/config/system.config";

const injectedStyle = `
.liquid-fill {
  background-image: repeating-linear-gradient(
    -45deg,
    rgba(255, 255, 255, 0.1) 0px,
    rgba(255, 255, 255, 0.1) 4px,
    transparent 4px,
    transparent 8px
  );
  background-size: 11px 11px;
  animation: liquidMove 1s linear infinite;
}

@keyframes liquidMove {
  from { background-position: 0 0; }
  to { background-position: 11px 0; }
}

.pipe-flow-x-right {
  background: linear-gradient(90deg, transparent 0%, transparent 50%, currentColor 50%, currentColor 100%);
  background-size: 16px 100%;
  animation: flow-right 0.5s linear infinite;
}
.pipe-flow-x-left {
  background: linear-gradient(90deg, transparent 0%, transparent 50%, currentColor 50%, currentColor 100%);
  background-size: 16px 100%;
  animation: flow-left 0.5s linear infinite;
}
.pipe-flow-y-down {
  background: linear-gradient(180deg, transparent 0%, transparent 50%, currentColor 50%, currentColor 100%);
  background-size: 100% 16px;
  animation: flow-down 0.5s linear infinite;
}

@keyframes flow-right {
  from { background-position: 0 0; }
  to { background-position: 16px 0; }
}
@keyframes flow-left {
  from { background-position: 16px 0; }
  to { background-position: 0 0; }
}
@keyframes flow-down {
  from { background-position: 0 0; }
  to { background-position: 0 16px; }
}
`;

const CouplingPoint = ({
  color,
  isActive,
}: {
  color: string;
  isActive: boolean;
}) => (
  <div className="absolute left-[1px] top-1/2 -translate-y-1/2 z-30 flex items-center justify-start drop-shadow-[0_0_4px_rgba(0,0,0,0.8)] pointer-events-none">
    <svg
      width="18"
      height="24"
      viewBox="0 0 18 24"
      className="overflow-visible"
    >
      <polygon
        points="0,4 12,4 10,20 0,20"
        fill="#050505"
        stroke={isActive ? color : "var(--theme-border)"}
        strokeWidth="2"
      />
      <rect
        x="-4"
        y="10"
        width="5"
        height="4"
        fill="#050505"
        stroke={isActive ? color : "var(--theme-border)"}
        strokeWidth="2"
      />
    </svg>
  </div>
);

const MobilePipe = ({
  color,
  isActive,
}: {
  color: string;
  isActive: boolean;
}) => (
  <div
    className="absolute inset-0 z-0 pointer-events-none md:hidden"
    style={{ color: isActive ? color : "var(--theme-border)" }}
  >
    {/* SEG 1 */}
    <div
      className="absolute top-[22px] right-[2%] w-[3%] h-[3px]"
      style={{ backgroundColor: isActive ? "#000" : "var(--theme-border)" }}
    >
      {isActive && (
        <div className="absolute inset-0 pipe-flow-x-right opacity-90" />
      )}
    </div>
    {/* SEG 2 */}
    <div
      className="absolute top-[22px] right-[2%] w-[3px] bottom-[72px]"
      style={{ backgroundColor: isActive ? "#000" : "var(--theme-border)" }}
    >
      {isActive && (
        <div className="absolute inset-0 pipe-flow-y-down opacity-90" />
      )}
    </div>
    {/* SEG 3 */}
    <div
      className="absolute bottom-[72px] right-[2%] left-[1%] h-[3px]"
      style={{ backgroundColor: isActive ? "#000" : "var(--theme-border)" }}
    >
      {isActive && (
        <div className="absolute inset-0 pipe-flow-x-left opacity-90" />
      )}
    </div>
    {/* SEG 4 */}
    <div
      className="absolute top-[66px] left-[0.5%] w-[3px] bottom-[30px]"
      style={{ backgroundColor: isActive ? "#000" : "var(--theme-border)" }}
    >
      {isActive && (
        <div className="absolute inset-0 pipe-flow-y-down opacity-90" />
      )}
      {/* SEG 5: */}
    </div>
    <div
      className="absolute bottom-[27px] left-[0.5%] w-[3%] h-[3px]"
      style={{ backgroundColor: isActive ? "#000" : "var(--theme-border)" }}
    >
      {isActive && (
        <div className="absolute inset-0 pipe-flow-x-right opacity-90" />
      )}
    </div>
  </div>
);

const TechPipe = ({
  color,
  isActive,
}: {
  color: string;
  isActive: boolean;
}) => (
  <div className="w-full h-full flex items-center relative overflow-hidden px-1">
    <div
      className="w-full h-[3px] relative rounded-full overflow-hidden"
      style={{
        backgroundColor: isActive ? "#000" : "var(--theme-border)",
        color,
      }}
    >
      {isActive && (
        <div className="absolute inset-0 pipe-flow-x-right opacity-90" />
      )}
    </div>
  </div>
);

const ParallelogramTank = ({
  color,
  fillPct,
  label,
  val,
  cap,
  isPointZero,
}: {
  color: string;
  fillPct: number;
  label: string;
  val: number;
  cap: number;
  isPointZero: boolean;
}) => {
  const isActive = fillPct > 0 || isPointZero;
  const isFull = fillPct >= 1;

  return (
    <div className="relative ml-5 md:ml-0 w-full h-14 shrink-0 group drop-shadow-md flex flex-1 items-center justify-center min-w-[120px]">
      <CouplingPoint color={color} isActive={isActive} />

      <div
        className="absolute inset-0 z-0 transition-colors"
        style={{
          backgroundColor: isActive ? color : "var(--theme-border)",
          clipPath:
            "polygon(15px 0%, 100% 0%, calc(100% - 15px) 100%, 0% 100%)",
          boxShadow: isActive ? `0 0 10px ${color}` : "none",
        }}
      />

      <div
        className="absolute top-[2px] bottom-[2px] left-[2px] right-[2px] bg-[#050505] z-10"
        style={{
          clipPath:
            "polygon(14px 0%, 100% 0%, calc(100% - 14px) 100%, 0% 100%)",
        }}
      >
        {isActive && (
          <div
            className="absolute left-0 top-0 bottom-0 transition-all duration-500 flex flex-col justify-end"
            style={{ width: `${fillPct * 100}%`, backgroundColor: color }}
          >
            {!isFull && (
              <div
                className="absolute top-0 right-[-15px] bottom-0 w-[15px] z-20"
                style={{ color }}
              >
                <svg
                  viewBox="0 0 20 100"
                  preserveAspectRatio="none"
                  className="w-full h-full overflow-visible"
                >
                  <polygon
                    fill="currentColor"
                    style={{ filter: `drop-shadow(2px 0 4px ${color})` }}
                  >
                    <animate
                      attributeName="points"
                      dur="0.5s"
                      repeatCount="indefinite"
                      calcMode="linear"
                      values="
                        0,0 12,15 5,30 15,50 8,70 15,85 0,100;
                        0,0 15,15 5,30 18,50 5,70 12,85 0,100;
                        0,0 10,15 8,30 15,50 12,70 15,85 0,100;
                        0,0 12,15 5,30 15,50 8,70 15,85 0,100
                      "
                    />
                  </polygon>
                </svg>
              </div>
            )}

            <div
              className="w-full h-full relative"
              style={{ backgroundColor: color }}
            >
              <div className="absolute inset-0 liquid-fill mix-blend-overlay opacity-50" />
            </div>
          </div>
        )}
      </div>

      <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
        <span
          className={`bg-[#050505] px-3 py-1 border border-current text-[11px] font-bold font-mono tracking-widest drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] whitespace-nowrap ${isActive ? `text-[${color}]` : "text-[var(--theme-text)]/40"}`}
        >
          {label} [{val}/{cap}]
        </span>
      </div>
    </div>
  );
};

export function SustenanceWidget() {
  const sustenance = useCharacterStore((state) => state.sustenance);
  const { maxSustenance, sustanceStages } = useCharacterStats();
  const openSustenanceModal = useVitalsStore(
    (state) => state.openSustenanceModal,
  );

  const [isExpandedMobile, setIsExpandedMobile] = useState(false);

  const t1Cap = sustanceStages[0] - 1;
  const t2Cap = sustanceStages[1];
  const t3Cap = sustanceStages[2];
  const t4Cap = sustanceStages[3];

  const val1 = Math.min(Math.max(sustenance.current, 0), t1Cap);
  const val2 = Math.min(Math.max(sustenance.current - t1Cap, 0), t2Cap);
  const val3 = Math.min(Math.max(sustenance.current - t1Cap - t2Cap, 0), t3Cap);
  const val4 = Math.min(
    Math.max(sustenance.current - t1Cap - t2Cap - t3Cap, 0),
    t4Cap,
  );

  let activeStageId = "ST01";
  if (val4 > 0) activeStageId = "ST04";
  else if (val3 > 0) activeStageId = "ST03";
  else if (val2 > 0) activeStageId = "ST02";

  const desktopPipeWidths = ["w-32", "w-27", "w-22", "w-17"];

  const stagesData = [
    {
      id: "ST04",
      name: "CHEIO",
      color: "var(--theme-success)",
      cap: t4Cap,
      val: val4,
      mod: "ATT PHYSICAL +1 | ATT MENTAL +1",
    },
    {
      id: "ST03",
      name: "SACIADO",
      color: "var(--theme-accent)",
      cap: t3Cap,
      val: val3,
      mod: "NO MODIFIER",
    },
    {
      id: "ST02",
      name: "FAMINTO",
      color: "var(--theme-warning)",
      cap: t2Cap,
      val: val2,
      mod: "ATT PHYSICAL -1 | ATT MENTAL -1",
    },
    {
      id: "ST01",
      name: "INANIÇÃO",
      color: "var(--theme-danger)",
      cap: t1Cap,
      val: val1,
      mod: "ATT PHYSICAL -2 |  ATT MENTAL -2",
    },
  ];

  return (
    <>
      <style>{injectedStyle}</style>
      <div className="flex flex-col font-mono w-full h-full relative bg-[var(--theme-background)]">
        <div className="flex flex-col md:flex-row justify-between items-start bg-[#050505] border-b-2 border-[var(--theme-border)] p-2 z-20 shrink-0 shadow-sm gap-2">
          <div className="flex flex-col text-center md:text-left w-full md:w-auto">
            <span className="text-[12px] text-[var(--theme-text)] tracking-[0.3em] font-bold uppercase">
              RESERVAS NUTRICIONAIS
            </span>
          </div>
          <div className="flex items-baseline justify-center w-full md:w-auto">
            <span className="text-2xl md:text-3xl font-black text-[var(--theme-accent)] glow-text leading-none mt-1">
              {sustenance.current}{" "}
            </span>
            <span className="text-sm">/{maxSustenance}</span>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              size="sm"
              variant="danger"
              className="h-8 py-0 px-4 text-[10px] flex-1 md:flex-none"
              onClick={() => openSustenanceModal("SUB")}
            >
              [ DRENAR ]
            </Button>
            <Button
              size="sm"
              variant="success"
              className="h-8 py-0 px-4 text-[10px] flex-1 md:flex-none"
              onClick={() => openSustenanceModal("ADD")}
            >
              [ INJETAR ]
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:gap-3 flex-1 w-full justify-center p-2">
          <AnimatePresence initial={false}>
            {stagesData.map((stage, idx) => {
              const isPointZero = idx === 3 && stage.val === 0;
              const isActive = isPointZero || stage.val > 0;
              const isMobileActive = stage.id === activeStageId;
              const isVisible = isExpandedMobile || isMobileActive;

              return (
                <motion.div
                  key={stage.id}
                  initial={false}
                  animate={{
                    height: isVisible ? "auto" : 0,
                    opacity: isVisible ? 1 : 0,
                    marginBottom: isVisible ? 8 : 0,
                  }}
                  transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                  className="md:!h-auto md:!opacity-100 md:!mb-0 md:!flex flex-col md:flex-row items-center w-full relative overflow-hidden md:overflow-visible"
                >
                  <div className="w-[95%] md:w-[40%] self-start shrink-0 flex border border-[var(--theme-border)] bg-[var(--theme-backgrund)] min-h-[46px] shadow-sm z-10">
                    <div
                      className="w-8 shrink-0 flex flex-col justify-center items-center border-r border-[var(--theme-border)] relative overflow-hidden"
                      style={{ color: stage.color }}
                    >
                      <div
                        className={`absolute inset-0 ${isActive ? "bg-current opacity-20" : "opacity-0"}`}
                      />
                      <span className="z-10 font-bold text-[9px] rotate-[-90deg] uppercase tracking-widest">
                        {stage.id}
                      </span>
                    </div>

                    <div className="flex flex-col flex-1 px-2 py-1 justify-center min-w-0">
                      <span
                        className={`font-bold uppercase tracking-widest truncate text-[11px]`}
                      >
                        SYS.
                        <span
                          className={`text-[16px] ${isActive ? "text-[var(--theme-accent)] glow-text" : "text-[var(--theme-accent)]/50"}`}
                        >
                          {stage.name}
                        </span>
                      </span>
                      <div className="flex flex-wrap items-center justify-between text-[8px] uppercase tracking-wider truncate mt-1 border-t border-[var(--theme-border)] pt-1">
                        <span className="text-[12px] text-[var(--theme-accent)]">
                          MOD:
                        </span>
                        <span
                          className={`ml-1 truncate font-bold ${isActive ? "text-[var(--theme-accent)]" : "text-[var(--theme-accent)]/50"}`}
                        >
                          {stage.mod}
                        </span>
                      </div>
                    </div>
                  </div>

                  <MobilePipe color={stage.color} isActive={isActive} />

                  <div
                    className={`hidden md:flex ${desktopPipeWidths[idx]} shrink-0 h-full relative items-center z-0`}
                  >
                    <TechPipe color={stage.color} isActive={isActive} />
                  </div>

                  <div className="flex flex-1 w-[98%] md:w-full z-10 self-end md:self-auto mt-6 md:mt-0">
                    <ParallelogramTank
                      isPointZero={isPointZero}
                      cap={stage.cap}
                      color={stage.color}
                      fillPct={stage.val / stage.cap}
                      label={stage.id}
                      val={stage.val}
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        <div className="flex flex-col border-t border-dashed border-[var(--theme-border)] text-[11px] font-mono uppercase">
          <span className="py-2 text-center w-full font-bold text-[14px] text-[var(--theme-accent)] tracking-widest">
            INFORMES NUTRICIONAIS:
          </span>
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-col flex-1 gap-1 border-l-2 border-[var(--theme-success)] bg-[var(--theme-success)]/10 p-2">
              <span className="font-bold text-[var(--theme-success)]">
                NUTRIÇÃO POSITIVA
              </span>
              <span className="text-[var(--theme-text)]/70">
                CADA PONTO EXCEDENTE CONVERTE CON/2 EM HP TEMP (MÁXIMO DE CON*
                {VG_CONFIG.rules.constitutionTempHpMultiPerNutricion}).
              </span>
            </div>
            <div className="flex flex-col flex-1 gap-1 border-l-2 border-[var(--theme-warning)] bg-[var(--theme-warning)]/10 p-2">
              <span className="font-bold text-[var(--theme-warning)]">
                NUTRIÇÃO NEGATIVA
              </span>
              <span className="text-[var(--theme-text)]/70">
                CADA PONTO DE DÉFICIT APLICA{" "}
                {VG_CONFIG.rules.starvationHpDamagePerPoint} PV DE DANO
                ESTRUTURAL.
              </span>
            </div>
          </div>
        </div>

        <div className="md:hidden flex justify-center mt-2 pb-2 px-2 z-20">
          <Button
            size="sm"
            className="w-full text-[10px] border-dashed"
            onClick={() => setIsExpandedMobile(!isExpandedMobile)}
          >
            {isExpandedMobile ? "▲ COLAPSAR MATRIZ ▲" : "▼ EXPANDIR MATRIZ ▼"}
          </Button>
        </div>
      </div>
    </>
  );
}
