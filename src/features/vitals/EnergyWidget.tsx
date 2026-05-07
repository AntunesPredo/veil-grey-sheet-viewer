import { useCharacterStore } from "../character/store";
import { useCharacterStats } from "../../shared/hooks/useCharacterStats";
import { dispatchDiscordLog } from "../../shared/utils/discordWebhook";
import { RetroToast } from "../../shared/ui/RetroToast";
import { useVitalsStore } from "./useVitalsStore";

export function EnergyWidget() {
  const name = useCharacterStore((state) => state.name);
  const consumeEnergy = useCharacterStore((state) => state.consumeEnergy);
  const {
    actualEnergy,
    energyCap,
    energyState,
    slotsPerStage,
    maxEnergy,
    actionPoints,
    apMod,
    reactions,
    rxMod,
    movement,
    movMod,
    // availableSustenanceToSpend,
  } = useCharacterStats();

  const { openQuickRest, openFullRest } = useVitalsStore();

  const handleSpendEnergy = () => {
    if (actualEnergy > 0) {
      consumeEnergy(1);
      dispatchDiscordLog(
        "PLAYER",
        name,
        `**DESGASTE FÍSICO:** [${name}] consumiu 1 uso de Energia.\nEnergia restante: ${actualEnergy - 1}/${maxEnergy}.`,
      );
      RetroToast.warning("1 USO DE ENERGIA CONSUMIDO.");
    } else {
      RetroToast.error("SISTEMA TOTALMENTE EXAUSTO. INCAPAZ DE GASTAR.");
    }
  };

  const telemetryData = [
    {
      title: "AP_CORE",
      label: "AÇÕES/TURNO",
      color: "var(--theme-accent)",
      compKey: "actionPoints",
    },
    {
      title: "RCT_SPD",
      label: "REAÇÕES/TURNO",
      color: "var(--theme-warning)",
      compKey: "reactionPoints",
    },
    {
      title: "MOV_MT",
      label: "METROS/TURNO",
      color: "var(--theme-success)",
      compKey: "movementPoints",
    },
  ];

  const stateLabels = {
    EXHAUSTED: {
      label: "EXAUSTO",
      class: "text-[var(--theme-danger)] glow-danger",
      desc: "FALHA MOTORA IMINENTE | MÚSCULOS EM COLAPSO | PENALIDADES SEVERAS EM TESTES FÍSICOS E MENTAIS.",
      border: "border-[var(--theme-danger)]",
      bg: "bg-[var(--theme-danger)]/10",
    },
    TIRED: {
      label: "CANSADO",
      class: "text-[var(--theme-warning)] glow-warning",
      desc: "FADIGA DETECTADA | DESEMPENHO MUSCULAR REDUZIDO | PENALIDADE APLICADA EM TESTES.",
      border: "border-[var(--theme-warning)]",
      bg: "bg-[var(--theme-warning)]/10",
    },
    RESTED: {
      label: "DESCANSADO",
      class: "text-[var(--theme-accent)] glow-text",
      desc: "SISTEMA OPERACIONAL | DESEMPENHO FÍSICO DENTRO DOS PARÂMETROS NORMAIS.",
      border: "border-[var(--theme-accent)]",
      bg: "bg-[var(--theme-accent)]/5",
    },
  };

  const renderTelemetryStat = (compKey: string) => {
    if (compKey === "actionPoints") {
      return (
        <div className="flex justify-between items-end">
          <span
            className={`text-3xl font-black font-mono leading-none ${apMod > 0 ? "text-[var(--theme-success)] glow-success" : apMod < 0 ? "text-[var(--theme-danger)] glow-danger" : "text-[var(--theme-accent)] glow-text"}`}
          >
            {actionPoints.toString().padStart(2, "0")}
          </span>
          <div className="flex gap-[3px] h-4">
            {Array.from({ length: actionPoints }).map((_, i) => (
              <div
                key={`ap-${i}`}
                className="w-2.5 h-full bg-[var(--theme-accent)] shadow-[0_0_5px_var(--theme-accent)]"
              />
            ))}
          </div>
        </div>
      );
    }
    if (compKey === "reactionPoints") {
      return (
        <div className="flex justify-between items-end">
          <span
            className={`text-3xl font-black font-mono leading-none ${rxMod > 0 ? "text-[var(--theme-success)] glow-success" : rxMod < 0 ? "text-[var(--theme-danger)] glow-danger" : "text-[var(--theme-warning)] glow-warning"}`}
          >
            {reactions.toString().padStart(2, "0")}
          </span>
          <div className="flex gap-[3px] h-4">
            {Array.from({ length: reactions }).map((_, i) => (
              <div
                key={`rx-${i}`}
                className="w-2.5 h-full bg-[var(--theme-warning)] shadow-[0_0_5px_var(--theme-warning)]"
              />
            ))}
          </div>
        </div>
      );
    }
    if (compKey === "movementPoints") {
      return (
        <div className="flex justify-between items-end">
          <span
            className={`text-3xl font-black font-mono leading-none ${movMod > 0 ? "text-[var(--theme-success)] glow-success" : movMod < 0 ? "text-[var(--theme-danger)] glow-danger" : "text-[var(--theme-success)] glow-success"}`}
          >
            {movement.toString().padStart(2, "0")}
          </span>
          <div className="flex gap-[1px] h-8 w-full items-end opacity-90 justify-end ml-4">
            {movement < 3
              ? Array.from({ length: movement }).map((_, i) => (
                  <div
                    key={`mov-sm-${i}`}
                    className="w-2.5 h-4 bg-[var(--theme-success)] shadow-[0_0_5px_var(--theme-success)]"
                  />
                ))
              : Array.from({ length: movement }).map((_, i) => {
                  const totalBlocks = movement;

                  const normalized =
                    totalBlocks <= 1 ? 1 : i / (totalBlocks - 1);

                  const minHeight = 35;
                  const maxHeight = 100;
                  const tension = totalBlocks > 4 ? 2 : 1;

                  const height =
                    minHeight +
                    Math.pow(normalized, tension) * (maxHeight - minHeight);

                  return (
                    <div
                      key={`mov-lg-${i}`}
                      className="flex-1 max-w-[8px] h-full flex flex-col justify-end drop-shadow-[0_0_5px_var(--theme-success)]"
                    >
                      <div
                        className="w-full bg-[var(--theme-success)]"
                        style={{
                          height: `${i === 0 || i === 1 ? Math.max(5, height - 10) : height}%`,
                          clipPath:
                            i === 0
                              ? "none"
                              : "polygon(0 15%, 100% 0, 100% 100%, 0 100%)",
                        }}
                      />
                    </div>
                  );
                })}
          </div>
        </div>
      );
    }
    return (
      <div className="flex justify-center items-center">
        <span className="text-2xl font-black font-mono leading-none text-[var(--theme-accent)] glow-text">
          NO TELEMETRY AVALIABLE
        </span>
      </div>
    );
  };

  const currentConf = stateLabels[energyState];
  const energyBlocks = Array.from({ length: maxEnergy }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-full w-full justify-between gap-4">
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <pattern
            id="lock-hazard"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="8" height="8" fill="var(--theme-background)" />
            <rect
              width="4"
              height="8"
              fill="var(--theme-warning)"
              opacity="0.3"
            />
          </pattern>
        </defs>
      </svg>

      <div className="p-2 flex flex-col gap-3 flex-1">
        <div className=" flex flex-col border-b-2 border-[var(--theme-accent)] pb-2 relative">
          <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-[var(--theme-accent)]" />
          <span className="text-[12px] text-[var(--theme-text)] tracking-[0.3em] font-bold uppercase mb-1">
            ESTADO ENERGÉTICO
          </span>
          <span
            className={`text-4xl md:text-5xl flex items-center justify-center font-black tracking-widest uppercase leading-none ${currentConf.class}`}
          >
            {currentConf.label}
          </span>
        </div>

        <div className="px-2 grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0 mt-2">
          {telemetryData.map((e) => (
            <div
              key={`telemetry-${e.title}`}
              className="border-2 border-[var(--theme-border)] bg-[var(--theme-background)] p-2.5 flex flex-col justify-between relative shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]"
            >
              <div className="flex justify-between items-center">
                <span
                  className="text-[14px] font-bold tracking-widest uppercase"
                  style={{ color: e.color }}
                >
                  {e.title}
                </span>
                <span className="text-[10px] text-[var(--theme-text)]/70 font-mono">
                  {e.label}
                </span>
              </div>
              {renderTelemetryStat(e.compKey)}
            </div>
          ))}
        </div>

        <div className="relative mx-2 p-4 md:p-6 border-2 border-[var(--theme-border)] bg-[#050505] shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] flex flex-col min-h-[80px]">
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[var(--theme-accent)]" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[var(--theme-accent)]" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[var(--theme-accent)]" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[var(--theme-accent)]" />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full mb-4 border-b border-[var(--theme-accent)] pb-2 gap-2">
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-bold text-[var(--theme-text)]/70 tracking-widest uppercase">
                CARGAS DE ENERGIA
              </span>
            </div>
            <span className="text-sm font-mono text-[var(--theme-accent)] font-bold">
              {actualEnergy}{" "}
              <span className="text-xs text-[var(--theme-text)]/70">
                / {maxEnergy}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center items-center">
            {energyBlocks.map((index) => {
              const isBlocked = index > energyCap;
              const isActive = index <= actualEnergy;
              const isEmpty = !isActive && !isBlocked;

              let colorVar = "var(--theme-accent)";
              if (index <= slotsPerStage) colorVar = "var(--theme-danger)";
              else if (index <= slotsPerStage * 2)
                colorVar = "var(--theme-warning)";

              let glowClass = "";
              let textClass = "";

              if (isActive) {
                if (index <= slotsPerStage) {
                  glowClass = "drop-shadow-[0_0_6px_var(--theme-danger)]";
                  textClass = "text-[var(--theme-danger)]";
                } else if (index <= slotsPerStage * 2) {
                  glowClass = "drop-shadow-[0_0_6px_var(--theme-warning)]";
                  textClass = "text-[var(--theme-warning)]";
                } else {
                  glowClass = "drop-shadow-[0_0_6px_var(--theme-accent)]";
                  textClass = "text-[var(--theme-accent)]";
                }
              } else if (isBlocked) {
                textClass = "text-[var(--theme-warning)] opacity-40";
              } else {
                textClass = "text-[var(--theme-text)] opacity-10";
              }

              return (
                <div key={index} className="flex flex-col items-center gap-1">
                  <svg
                    viewBox="0 0 30 30"
                    className={`w-6 h-6 md:w-8 md:h-8 transition-all duration-300 ${glowClass}`}
                  >
                    <polygon
                      points="10,2 28,2 28,20 20,28 2,28 2,10"
                      fill={
                        isActive
                          ? colorVar
                          : isBlocked
                            ? "url(#lock-hazard)"
                            : "transparent"
                      }
                      stroke={isBlocked ? "var(--theme-warning)" : colorVar}
                      strokeWidth={isActive ? "0" : "2"}
                      className={
                        isEmpty
                          ? "opacity-30"
                          : isBlocked
                            ? "opacity-40"
                            : "opacity-100"
                      }
                    />
                    {isBlocked && (
                      <circle
                        cx="15"
                        cy="15"
                        r="4"
                        fill="var(--theme-background)"
                        stroke="var(--theme-warning)"
                        strokeWidth="1"
                        className="opacity-60"
                      />
                    )}
                  </svg>
                  <span
                    className={`text-[8px] md:text-[9px] font-mono font-bold tracking-widest uppercase ${textClass}`}
                  >
                    C{index}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        {energyCap < maxEnergy && (
          <div className="mx-2 border border-[var(--theme-warning)]/50 bg-[var(--theme-warning)]/10 p-3 flex items-start gap-3 shadow-[0_0_15px_rgba(204,122,0,0.1)]">
            <span className="text-xl leading-none text-[var(--theme-warning)] animate-pulse">
              ⚠
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[var(--theme-warning)] tracking-widest uppercase">
                BLOQUEIO ATIVO
              </span>
              <span className="text-[9px] md:text-[10px] font-mono text-[var(--theme-text)]/70 uppercase leading-relaxed">
                Seu corpo não é capaz de manter mais cargas de energia devido a
                restrições de nutrição. Alimente-se para restaurar a capacidade
                máxima do sistema.
              </span>
            </div>
          </div>
        )}
        <div
          className={`mx-2 border-2 border-[var(--theme-border)] p-3 border-l-4 ${currentConf.border} ${currentConf.bg} relative overflow-hidden`}
        >
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)",
            }}
          />
          <span className="text-[10px] md:text-xs text-[var(--theme-text)]/80 uppercase font-mono leading-relaxed block relative z-10">
            {currentConf.desc}
          </span>
        </div>
      </div>

      <div className="mx-4 pb-5 grid grid-cols-[1fr_1.3fr_1fr] gap-3 md:gap-4 mt-2">
        <button
          onClick={openFullRest}
          disabled
          className="group flex flex-col items-center justify-center p-3 border-2 border-[var(--theme-success)] bg-[var(--theme-background)] text-[var(--theme-success)] hover:bg-[var(--theme-success)] hover:text-black shadow-[0_4px_0_var(--theme-success)] active:shadow-[0_0px_0_var(--theme-success)] active:translate-y-[4px] transition-all disabled:opacity-50 disabled:pointer-events-none outline-none"
        >
          <span className="font-black text-[10px] md:text-sm tracking-widest uppercase leading-tight group-hover:glow-none glow-success">
            FULL REST
          </span>
          <span className="font-mono text-[8px] md:text-[9px] opacity-70 tracking-widest uppercase mt-1">
            REINICIAR
          </span>
        </button>

        <button
          onClick={handleSpendEnergy}
          disabled={actualEnergy <= 0}
          className="group relative overflow-hidden flex flex-col items-center justify-center p-3 border-2 border-[var(--theme-danger)] bg-[var(--theme-danger)]/10 text-[var(--theme-danger)] hover:bg-[var(--theme-danger)] hover:text-white shadow-[0_4px_0_var(--theme-danger)] active:shadow-[0_0px_0_var(--theme-danger)] active:translate-y-[4px] transition-all disabled:opacity-30 disabled:pointer-events-none disabled:grayscale outline-none"
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
            style={{
              backgroundImage:
                "repeating-linear-gradient(-45deg, rgba(0,0,0,0.3) 0, rgba(0,0,0,0.3) 8px, transparent 8px, transparent 16px)",
            }}
          />

          <span className="font-black text-xs md:text-base tracking-[0.2em] uppercase leading-tight relative z-10 glow-danger group-hover:glow-none transition-all">
            GASTAR AÇÃO
          </span>
          <span className="font-mono text-[8px] md:text-[10px] opacity-80 tracking-widest mt-1 relative z-10 text-[var(--theme-text)] group-hover:text-white">
            -1 CARGA
          </span>
        </button>

        <button
          onClick={openQuickRest}
          disabled
          // disabled={
          //   actualEnergy >= energyCap || availableSustenanceToSpend <= 0
          // }
          className="group flex flex-col items-center justify-center p-3 border-2 border-[var(--theme-warning)] bg-[var(--theme-background)] text-[var(--theme-warning)] hover:bg-[var(--theme-warning)] hover:text-black shadow-[0_4px_0_var(--theme-warning)] active:shadow-[0_0px_0_var(--theme-warning)] active:translate-y-[4px] transition-all disabled:opacity-50 disabled:pointer-events-none disabled:grayscale outline-none"
        >
          <span className="font-black text-[10px] md:text-sm tracking-widest uppercase leading-tight group-hover:glow-none glow-warning">
            QUICK REST
          </span>
          <span className="font-mono text-[8px] md:text-[9px] opacity-70 tracking-widest uppercase mt-1">
            CONVERTER.
          </span>
        </button>
      </div>
    </div>
  );
}
