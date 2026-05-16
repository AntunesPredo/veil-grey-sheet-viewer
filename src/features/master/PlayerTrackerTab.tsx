import { useEffect } from "react";
import { useNetworkStore } from "../../shared/store/useNetworkStore";
import { PlayerCard } from "./components/PlayerCard";

export function PlayerTrackerTab() {
  const onlinePlayers = useNetworkStore((state) => state.onlinePlayers);
  const telemetryData = useNetworkStore((state) => state.telemetryData);
  const telemetryHashes = useNetworkStore((state) => state.telemetryHashes);
  const broadcastMasterPing = useNetworkStore(
    (state) => state.broadcastMasterPing,
  );

  useEffect(() => {
    const pingInterval = setInterval(() => {
      broadcastMasterPing(telemetryHashes);
    }, 10000);
    return () => clearInterval(pingInterval);
  }, [broadcastMasterPing, telemetryHashes]);

  const knownPlayers = Array.from(
    new Set([...onlinePlayers, ...Object.keys(telemetryData)]),
  ).filter((p) => !(p === "MESTRE" || p === "SANDBOX"));

  return (
    <div className="flex flex-col h-full gap-4 overflow-y-auto custom-scrollbar pr-2">
      <div className="flex justify-between items-center border-b border-[var(--theme-danger)]/30 pb-2 shrink-0">
        <span className="text-xs font-bold text-[var(--theme-danger)] tracking-widest uppercase">
          VISÃO GERAL
        </span>
        <span className="text-[10px] font-mono text-[var(--theme-text)]/50">
          REGISTROS NA BASE: {knownPlayers.length}
        </span>
      </div>

      {knownPlayers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-[var(--theme-danger)]/30 text-[var(--theme-danger)]/50 font-mono text-xs uppercase tracking-widest animate-pulse">
          NENHUM REGISTRO DE UNIDADE DETECTADO.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
          {knownPlayers.map((player) => (
            <PlayerCard key={player} playerName={player} />
          ))}
        </div>
      )}
    </div>
  );
}
