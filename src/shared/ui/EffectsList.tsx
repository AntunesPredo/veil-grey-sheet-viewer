import type { CustomEffect } from "../types/veil-grey";
import { Button } from "./Form";
import { generateInjectionHash } from "../utils/hashIntegration";

export type EffectsListProps = {
  effects: CustomEffect[];
  onRemove?: (id: number) => void;
  title?: string;
};

const isDev =
  import.meta.env.VITE_IN_DEVELOPMENT === "true" || import.meta.env.DEV;

export function EffectsList({ effects, onRemove, title }: EffectsListProps) {
  if (!effects || effects.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-[var(--theme-border)] border-dashed w-full">
      {title && (
        <span className="text-[8px] text-[var(--theme-warning)] uppercase font-bold tracking-widest mb-1 mt-1">
          {title}
        </span>
      )}
      {effects.map((eff) => (
        <div
          key={eff.id}
          className={`flex justify-between items-center px-2 py-1 border w-full ${title ? "bg-[var(--theme-warning)]/10 border-[var(--theme-warning)]/30" : "bg-[var(--theme-accent)]/5 border-[var(--theme-accent)]/20"}`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`text-[10px] font-bold font-mono ${eff.val === 0 ? "text-[var(--theme-accent)]" : eff.val > 0 ? "text-[var(--theme-success)]" : "text-[var(--theme-danger)]"}`}
            >
              [{eff.val > 0 ? "+" : ""}
              {eff.val}]
            </span>
            <span
              className={`text-[9px] uppercase font-mono tracking-wider ${title ? "text-[var(--theme-warning)]" : "text-[var(--theme-accent)]"}`}
            >
              [{eff.target.replace("_", ":")}]
            </span>
            <span className="text-[9px] text-[var(--theme-text)] uppercase tracking-wider truncate">
              {eff.description}
            </span>
            <span className="text-[8px] text-[var(--theme-text)]/50 italic shrink-0">
              ({eff.mode})
            </span>
          </div>

          <div className="flex gap-1 items-center shrink-0">
            {isDev && (
              <Button
                size="sm"
                variant="warning"
                className="border-none py-0 px-1.5 h-6 ml-2 text-[8px]"
                onClick={() =>
                  generateInjectionHash({
                    type: "EFFECT",
                    singleUse: false,
                    data: { ...eff, link: null },
                  })
                }
                title="Copiar Hash de Injeção"
              >
                [COPY]
              </Button>
            )}
            {onRemove &&
              !eff.isAccounted &&
              !(eff.link === "FLAW" || eff.link === "SYS") && (
                <Button
                  size="sm"
                  variant="danger"
                  className="border-none py-0 px-1.5 h-6 text-[8px]"
                  onClick={() => onRemove(eff.id)}
                >
                  <svg
                    viewBox="0 0 16 16"
                    className="w-4 h-4"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.1716 8.00003L1.08582 3.91424L3.91424 1.08582L8.00003 5.1716L12.0858 1.08582L14.9142 3.91424L10.8285 8.00003L14.9142 12.0858L12.0858 14.9142L8.00003 10.8285L3.91424 14.9142L1.08582 12.0858L5.1716 8.00003Z"
                      fill="currentColor"
                    />
                  </svg>
                </Button>
              )}
          </div>
        </div>
      ))}
    </div>
  );
}
