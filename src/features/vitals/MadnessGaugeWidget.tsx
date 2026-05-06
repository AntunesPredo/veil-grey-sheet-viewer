import { useMemo, useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useCharacterStore } from "../character/store";
import { useCharacterStats } from "../../shared/hooks/useCharacterStats";
import { Button } from "../../shared/ui/Form";
import { executeRawRoll } from "../../shared/utils/diceEngine";
import { RetroToast } from "../../shared/ui/RetroToast";
import { dispatchDiscordLog } from "../../shared/utils/discordWebhook";
import { VG_CONFIG } from "../../shared/config/system.config";
import { useCustomSvgIcons } from "../../shared/hooks/useCustomSvgIcons";
import { useVitalsStore } from "./useVitalsStore";

export function MadnessGaugeWidget() {
  const name = useCharacterStore((state) => state.name);
  const insanity = useCharacterStore((state) => state.insanity);
  const creationStatus = useCharacterStore((state) => state.creationStatus);
  const openInsanityModal = useVitalsStore((state) => state.openInsanityModal);

  const { getSpecificIcon } = useCustomSvgIcons();
  const { maxInsanity, insanityState, insStages } = useCharacterStats();

  const containerRef = useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = useState(450);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSvgWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleTestInsanity = () => {
    const expression = `${VG_CONFIG.rules.mainDice}+${insanity.current}`;
    const result = executeRawRoll(expression, []);
    if (result.error) return RetroToast.error(result.error);

    const logMsg = `**TESTE DE INSANIDADE:** ${result.total}\n\`\`\`\n${result.log}\n\`\`\``;
    dispatchDiscordLog("PLAYER", name, logMsg);
    RetroToast.warning(`TESTE DE INSANIDADE: ${result.total}`);
  };

  const progress = maxInsanity === 0 ? 0 : insanity.current / maxInsanity;

  const p1 = maxInsanity === 0 ? 0 : insStages[0] / maxInsanity;

  const stateConfig = {
    STABLE: {
      label: "ESTÁVEL",
      colorClass: "text-[var(--theme-accent)]",
      strokeColor: "var(--theme-accent)",
      desc: "OPERACIONAL. Dentro dos parâmetros aceitáveis.",
      glow: "drop-shadow-[0_0_4px_var(--theme-accent)]",
      coreAnim: "",
    },
    UNSTABLE: {
      label: "INSTÁVEL",
      colorClass: "text-[var(--theme-warning)]",
      strokeColor: "var(--theme-warning)",
      desc: "ALERTA: Integridade psicológica comprometida.",
      glow: "drop-shadow-[0_0_10px_var(--theme-warning)]",
      coreAnim: "madness-unstable",
    },
    INSANE: {
      label: "INSANO",
      colorClass: "text-[var(--theme-danger)]",
      strokeColor: "var(--theme-danger)",
      desc: "FALHA. Psique completamente fraturada",
      glow: "drop-shadow-[0_0_12px_var(--theme-danger)]",
      coreAnim: "madness-burst",
    },
  };

  const activeConf = stateConfig[insanityState];

  const coreX = 75;
  const coreY = 80;

  const endX = Math.max(150, svgWidth - 28);

  const pathD = `M ${coreX} 130 A 50 50 0 0 1 ${coreX} 30 L ${endX} 30 L ${endX} 45`;
  const tickPath = `M 80 18 L ${endX} 18`;

  const icon = useMemo(() => {
    const iconId =
      insanityState === "INSANE"
        ? "eye_insane"
        : insanityState === "UNSTABLE"
          ? "eye_unstable"
          : "eye_stable";
    return getSpecificIcon(iconId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insanityState]);

  return (
    <>
      <div
        ref={containerRef}
        className="relative w-full h-[154px] bg-[var(--theme-background)] overflow-hidden"
      >
        <svg
          viewBox={`0 0 ${svgWidth} 154`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g
            className="opacity-30"
            stroke="var(--theme-border)"
            strokeWidth="1"
          >
            <line x1={coreX} y1="0" x2={coreX} y2="135" strokeDasharray="4 4" />
            <line
              x1="15"
              y1={coreY}
              x2={svgWidth}
              y2={coreY}
              strokeDasharray="4 4"
            />
          </g>

          <g style={{ transformOrigin: `${coreX}px ${coreY}px` }}>
            <circle
              cx={coreX}
              cy={coreY}
              r="38"
              fill="none"
              stroke="var(--theme-border)"
              strokeWidth="2"
              strokeDasharray="10 5"
            />

            <g
              className={activeConf.coreAnim}
              style={{
                transformOrigin: `${coreX}px ${coreY}px`,
              }}
            >
              <g
                className={insanityState === "INSANE" ? "madness-vibrate" : ""}
              >
                {icon ? (
                  <g
                    transform={`translate(${coreX - 32}, ${coreY - 32}) scale(${64 / 512})`}
                    style={{ color: activeConf.strokeColor }}
                    stroke={activeConf.strokeColor}
                    strokeWidth={0}
                  >
                    {icon.svg}
                  </g>
                ) : (
                  <rect
                    x={coreX - 12}
                    y={coreY - 12}
                    width="24"
                    height="24"
                    fill="none"
                    stroke={activeConf.strokeColor}
                    strokeWidth="3"
                  />
                )}
              </g>
            </g>

            <rect
              x={coreX - 18}
              y={coreY - 18}
              width="36"
              height="36"
              fill="none"
              stroke="var(--theme-border)"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.6"
            />
          </g>

          {insanityState === "INSANE" && (
            <circle
              cx={coreX}
              cy={coreY}
              r="45"
              fill="none"
              stroke="var(--theme-danger)"
              strokeWidth="2"
              strokeDasharray="20 10"
              className="animate-pulse"
            />
          )}

          <path
            d={tickPath}
            fill="none"
            stroke="var(--theme-accent)"
            strokeWidth="4"
            strokeDasharray="2 18"
            className="opacity-20"
          />

          <path
            d={pathD}
            fill="none"
            stroke="#000"
            strokeWidth="18"
            strokeLinecap="square"
          />
          <path
            d={pathD}
            fill="none"
            stroke="var(--theme-border)"
            strokeWidth="20"
            strokeLinecap="square"
            className="opacity-40"
          />
          <path
            d={pathD}
            fill="none"
            stroke="#111"
            strokeWidth="14"
            strokeLinecap="square"
          />

          <motion.path
            d={pathD}
            fill="none"
            stroke={activeConf.strokeColor}
            strokeWidth="10"
            strokeLinecap="butt"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress === 0 ? 0.001 : progress }}
            transition={{ duration: 1.5, type: "spring", bounce: 0.2 }}
            className={activeConf.glow}
            filter="url(#glow)"
          />

          <motion.path
            d={pathD}
            fill="none"
            stroke="var(--theme-warning)"
            strokeWidth="24"
            pathLength="1"
            strokeDasharray="0.003 1"
            strokeDashoffset={-p1}
            className="opacity-80"
          />

          <text
            x="90"
            y="138"
            fill={activeConf.strokeColor}
            fontSize="12"
            fontFamily="monospace"
            className="opacity-70 font-bold"
          >
            {(progress * 100).toFixed(1)}%
          </text>

          <foreignObject x="140" y="45" width={svgWidth - 150} height="100">
            <div className="flex flex-col w-full h-full justify-start mt-2 pr-2">
              <div className="flex justify-between items-end mb-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--theme-border)] font-bold tracking-[0.2em] mb-1">
                    MNLT_CAPACITY
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-6xl font-black font-mono tracking-tighter leading-none ${activeConf.colorClass}`}
                      style={{
                        textShadow: `0 0 15px ${activeConf.strokeColor}40`,
                      }}
                    >
                      {String(insanity.current).padStart(2, "0")}
                    </span>
                    <span className="text-xl text-[var(--theme-border)] font-mono font-bold">
                      /{String(maxInsanity).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                {creationStatus === "CLOSED" ? (
                  <div className="hidden md:flex gap-2 pb-1">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => openInsanityModal("SUB")}
                    >
                      <svg
                        className="w-14 h-5"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M1 10L1 6L15 6V10L1 10Z" fill="currentColor" />
                      </svg>
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => openInsanityModal("ADD")}
                    >
                      <svg
                        className="w-14 h-5"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 1H6V6L1 6V10H6V15H10V10H15V6L10 6V1Z"
                          fill="currentColor"
                        />
                      </svg>
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </foreignObject>
        </svg>
      </div>

      <div className="flex flex-col px-5 pb-5 border-[var(--theme-border)] gap-5">
        {creationStatus === "CLOSED" ? (
          <div className="flex md:hidden gap-2 pb-1">
            <Button
              variant="success"
              size="sm"
              className="w-full"
              onClick={() => openInsanityModal("SUB")}
            >
              <div className="flex flex-1 py-1 justify-center">
                <svg
                  className="w-14 h-5"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M1 10L1 6L15 6V10L1 10Z" fill="currentColor" />
                </svg>
              </div>
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="w-full"
              onClick={() => openInsanityModal("ADD")}
            >
              <div className="flex flex-1 py-1 justify-center">
                <svg
                  className="w-14 h-5"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 1H6V6L1 6V10H6V15H10V10H15V6L10 6V1Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </Button>
          </div>
        ) : null}
        <div className="flex justify-between text-[11px] font-bold font-mono tracking-wider bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-1">
          <div className="flex flex-1 gap-1.5 items-center justify-center">
            <div className="w-2 h-2 bg-[var(--theme-accent)]"></div>
            <span className="text-[var(--theme-accent)] mt-0.5">
              ESTÁVEL: {insStages[0] - 1}
            </span>
          </div>
          <div className="flex flex-1 gap-1.5 items-center justify-center border-x-2 border-[var(--theme-border)]">
            <div className="w-2 h-2 bg-[var(--theme-warning)]"></div>
            <span className="text-[var(--theme-warning)] mt-0.5">
              INSTÁVEL: {insStages[1]}
            </span>
          </div>
          <div className="flex flex-1 gap-1.5 items-center justify-center">
            <div className="w-2 h-2 bg-[var(--theme-danger)]"></div>
            <span className="text-[var(--theme-danger)] mt-0.5">
              INSANO: {insStages[2]}
            </span>
          </div>
        </div>
        <div
          className={`p-4 ${insanityState === "INSANE" ? "bg-[var(--theme-danger)]/10" : "bg-[var(--theme-accent)]/10"}`}
          style={{ borderLeft: `4px solid ${activeConf.strokeColor}` }}
        >
          <div
            className={`flex items-start gap-2 ${insanityState === "INSANE" ? "text-white" : activeConf.colorClass}`}
          >
            <span className="text-[12px] font-mono font-bold mt-0.5">&gt;</span>
            <span className="block text-[10px] md:text-[12px] font-mono tracking-wide leading-relaxed font-bold uppercase">
              {activeConf.desc}
            </span>
          </div>
        </div>

        <Button
          variant={insanityState === "INSANE" ? "danger" : "primary"}
          size="sm"
          className="py-4 text-[12px] md:text-[14px]"
          onClick={handleTestInsanity}
        >
          [ TESTE DE INSANIDADE ]
        </Button>
      </div>
    </>
  );
}
