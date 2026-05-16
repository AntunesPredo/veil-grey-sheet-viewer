import React, { useState } from "react";
import { useNetworkStore } from "../../../shared/store/useNetworkStore";
import { Button } from "../../../shared/ui/Form";
import { Accordion } from "../../../shared/ui/Accordion";
import type {
  CustomEffect,
  Item,
  Disadvantage,
} from "../../../shared/types/veil-grey";

export interface PlayerTelemetry {
  hp: { current: number; max: number; temp: number };
  insanity: { current: number; max: number };
  energy: { current: number; max: number; state: string };
  sustenance: { current: number; max: number; state: string };
  attributes: Record<string, number>;
  secondaryAttributes: Record<string, number>;
  skills: Record<string, number>;
  effects: CustomEffect[];
  customEffectIds: number[];
  inventory: Item[];
  disadvantages: Disadvantage[];
}

export const PlayerCard = React.memo(
  ({ playerName }: { playerName: string }) => {
    const data = useNetworkStore(
      (state) => state.telemetryData[playerName] as PlayerTelemetry | undefined,
    );
    const sendPayload = useNetworkStore((state) => state.sendPayload);
    const isOnline = useNetworkStore((state) =>
      state.onlinePlayers.includes(playerName),
    );

    const [accordions, setAccordions] = useState<Record<string, boolean>>({
      stats: false,
      effects: true,
      inventory: false,
      flaws: false,
    });

    const toggleAccordion = (key: string) => {
      setAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleRemoveEffectRemote = (effectId: number) => {
      sendPayload(playerName, "REMOVE_EFFECT", { id: effectId });
    };

    return (
      <div
        className={`border-2 border-[var(--theme-border)] bg-[var(--theme-background)] flex flex-col transition-opacity ${!isOnline ? "opacity-70 grayscale" : ""}`}
      >
        <div
          className={`border-b-2 p-2 flex justify-between items-center shrink-0 ${isOnline ? "bg-[var(--theme-danger)]/10 border-[var(--theme-danger)]" : "bg-[var(--theme-border)]/50 border-[var(--theme-border)]"}`}
        >
          <span
            className={`font-black tracking-widest uppercase ${isOnline ? "text-[var(--theme-danger)]" : "text-[var(--theme-text)]/50"}`}
          >
            UNIT: {playerName}
          </span>
          <span
            className={`text-[10px] text-black px-2 py-0.5 font-bold ${isOnline ? "bg-[var(--theme-success)] animate-pulse" : "bg-[var(--theme-text)]/50"}`}
          >
            {isOnline ? "ON-LINK" : "OFFLINE"}
          </span>
        </div>

        {!data ? (
          <div className="p-4 text-xs font-mono text-[var(--theme-text)]/40 italic uppercase">
            [ AGUARDANDO SINCRONIZAÇÃO DE TELEMETRIA... ]
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="p-2 grid grid-cols-2 gap-2 text-[10px] font-mono border-b border-[var(--theme-border)] bg-[var(--theme-background)]/50">
              <div className="flex flex-col border border-[var(--theme-accent)]/30 p-1.5">
                <span className="text-[var(--theme-text)]/60 font-bold">
                  HP_CAPACITY
                </span>
                <span className="text-sm font-bold text-[var(--theme-accent)]">
                  {data.hp.current} / {data.hp.max}
                  {data.hp.temp > 0 && (
                    <span className="text-[var(--theme-success)] ml-1">
                      (+{data.hp.temp})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex flex-col border border-[var(--theme-warning)]/30 p-1.5">
                <span className="text-[var(--theme-warning)]/60 font-bold">
                  PSY_INSANITY
                </span>
                <span className="text-sm font-bold text-[var(--theme-warning)]">
                  {data.insanity.current} / {data.insanity.max}
                </span>
              </div>
              <div className="flex flex-col border border-[var(--theme-success)]/30 p-1.5">
                <span className="text-[var(--theme-success)]/60 font-bold flex justify-between">
                  PWR_ENERGY{" "}
                  <span className="text-[8px] opacity-70">
                    [{data.energy.state}]
                  </span>
                </span>
                <span className="text-sm font-bold text-[var(--theme-success)]">
                  {data.energy.current} / {data.energy.max}
                </span>
              </div>
              <div className="flex flex-col border border-[var(--theme-accent)]/30 p-1.5">
                <span className="text-[var(--theme-text)]/60 font-bold flex justify-between">
                  METABOLISM{" "}
                  <span className="text-[8px] opacity-70">
                    [{data.sustenance.state}]
                  </span>
                </span>
                <span className="text-sm font-bold text-[var(--theme-accent)]">
                  {data.sustenance.current} / {data.sustenance.max}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-0.5">
              <Accordion
                title="SISTEMAS ESTATÍSTICOS"
                isOpen={accordions.stats}
                onToggle={() => toggleAccordion("stats")}
              >
                <div className="grid grid-cols-2 gap-4 text-[9px] uppercase p-2 bg-black">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-[var(--theme-accent)] border-b border-[var(--theme-border)] pb-1 mb-1">
                      ATRIBUTOS BASE
                    </span>
                    {Object.entries(data.attributes).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex justify-between border-b border-dashed border-[var(--theme-border)] pb-0.5"
                      >
                        <span className="text-[var(--theme-text)]/70">
                          {key}
                        </span>
                        <span className="text-[var(--theme-warning)] font-bold">
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-[var(--theme-accent)] border-b border-[var(--theme-border)] pb-1 mb-1">
                      PERÍCIAS ATIVAS
                    </span>
                    {Object.entries(data.skills)
                      .filter(([, val]) => val > 0)
                      .map(([key, val]) => (
                        <div
                          key={key}
                          className="flex justify-between border-b border-dashed border-[var(--theme-border)] pb-0.5"
                        >
                          <span className="truncate text-[var(--theme-text)]/70 pr-2">
                            {key}
                          </span>
                          <span className="text-[var(--theme-success)] font-bold">
                            {val}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </Accordion>

              <Accordion
                title={`EFEITOS APLICADOS (${data.effects.length})`}
                isOpen={accordions.effects}
                onToggle={() => toggleAccordion("effects")}
              >
                <div className="flex flex-col gap-1 p-2 bg-[var(--theme-background)]/80 max-h-[180px] overflow-y-auto custom-scrollbar">
                  {data.effects.map((eff) => {
                    const isRemovable = data.customEffectIds.includes(eff.id);
                    const valColor =
                      eff.val > 0
                        ? "text-[var(--theme-success)]"
                        : eff.val < 0
                          ? "text-[var(--theme-danger)]"
                          : "text-[var(--theme-accent)]";

                    return (
                      <div
                        key={eff.id}
                        className="flex justify-between items-center border border-[var(--theme-border)] bg-[var(--theme-accent)]/5 p-1.5"
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-[10px] uppercase font-mono font-bold text-[var(--theme-accent)] truncate">
                            {eff.description}
                          </span>
                          <span className="text-[8px] uppercase font-mono text-[var(--theme-text)]/60">
                            TARGET: {eff.target} | MODO: {eff.mode}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`font-mono font-bold text-xs ${valColor}`}
                          >
                            {eff.val > 0 ? `+${eff.val}` : eff.val}
                          </span>
                          {isRemovable ? (
                            <Button
                              variant="danger"
                              size="sm"
                              className="h-6 w-6 p-0 flex items-center justify-center border-none text-[8px]"
                              onClick={() => handleRemoveEffectRemote(eff.id)}
                            >
                              X
                            </Button>
                          ) : (
                            <div
                              className="h-6 w-6 flex items-center justify-center opacity-30"
                              title="Efeito atrelado ao sistema/item"
                            >
                              <svg
                                className="w-3 h-3 fill-current"
                                viewBox="0 0 24 24"
                              >
                                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {data.effects.length === 0 && (
                    <span className="text-[9px] text-[var(--theme-text)]/40 italic uppercase text-center block py-2">
                      NENHUM EFEITO DETECTADO.
                    </span>
                  )}
                </div>
              </Accordion>

              <Accordion
                title={`CARGA LOGÍSTICA (${data.inventory.length} ITENS)`}
                isOpen={accordions.inventory}
                onToggle={() => toggleAccordion("inventory")}
              >
                <div className="flex flex-col gap-1 p-2 max-h-[180px] overflow-y-auto custom-scrollbar bg-black">
                  {data.inventory.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center border border-[var(--theme-border)] p-1 text-[9px] uppercase font-mono"
                    >
                      <span className="font-bold text-[var(--theme-accent)] truncate flex-1 pr-2">
                        <span className="opacity-50 font-normal mr-1">
                          [{item.type}]
                        </span>
                        {item.name}
                      </span>
                      <span className="text-[var(--theme-text)]/70 shrink-0">
                        QTD:{" "}
                        <span className="font-bold text-[var(--theme-accent)]">
                          {item.quantity}
                        </span>{" "}
                        | PESO: {item.slots}
                      </span>
                    </div>
                  ))}
                </div>
              </Accordion>

              <Accordion
                title={`ANOMALIAS E DESVANTAGENS (${data.disadvantages.length})`}
                isOpen={accordions.flaws}
                onToggle={() => toggleAccordion("flaws")}
              >
                <div className="flex flex-col gap-2 p-2 bg-[var(--theme-danger)]/5 max-h-[180px] overflow-y-auto custom-scrollbar">
                  {data.disadvantages.map((flaw) => (
                    <div
                      key={flaw.id}
                      className="flex flex-col border-l-2 border-[var(--theme-danger)] pl-2"
                    >
                      <span className="text-[10px] font-bold text-[var(--theme-danger)] uppercase">
                        {flaw.title}
                      </span>
                      <span className="text-[9px] text-[var(--theme-text)]/70 italic uppercase leading-tight">
                        {flaw.description}
                      </span>
                    </div>
                  ))}
                  {data.disadvantages.length === 0 && (
                    <span className="text-[9px] text-[var(--theme-text)]/40 italic uppercase text-center block py-2">
                      NENHUMA ANOMALIA DETECTADA.
                    </span>
                  )}
                </div>
              </Accordion>
            </div>
          </div>
        )}
      </div>
    );
  },
);
