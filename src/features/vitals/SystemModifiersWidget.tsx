import { CustomEffectModal } from "../stats/CustomEffectModal";
import { useDisclosure } from "../../shared/hooks/useDisclosure";
import { Button } from "../../shared/ui/Form";
import { useCharacterStore } from "../character/store";
import { EffectsList } from "../../shared/ui/EffectsList";
import { useActiveModifiers } from "../../shared/hooks/useActiveModifiers";
import { motion } from "framer-motion";
import {
  dispatchDiscordLog,
  type DiscordEmbed,
} from "../../shared/utils/discordWebhook";

const isDev =
  import.meta.env.VITE_IN_DEVELOPMENT === "true" || import.meta.env.DEV;

export function SystemModifiersWidget() {
  const name = useCharacterStore((state) => state.name);
  const removeCustomEffect = useCharacterStore(
    (state) => state.removeCustomEffect,
  );
  const { activeEffects, getTargetSum } = useActiveModifiers();

  const globalModal = useDisclosure();
  const tempModal = useDisclosure();

  const globalEffects = activeEffects.filter((e) => e.mode !== "TEMP");
  const tempEffects = activeEffects.filter((e) => e.mode === "TEMP");

  const renderMod = (val: number) => {
    const value = val || 0;
    return (
      <span
        className={`font-mono font-bold ${value > 0 ? "text-[var(--theme-success)]" : value < 0 ? "text-[var(--theme-danger)]" : "text-[var(--theme-text)]"}`}
      >
        {value === 0 ? value : value > 0 ? `+${value}` : value}
      </span>
    );
  };

  const handleRemove = (id: number, link: string | number | null) => {
    if (typeof link === "string" && link.startsWith("item_")) return;
    const effect = activeEffects.find((e) => e.id === id);
    if (!effect) return;

    const effectEmbed: DiscordEmbed = {
      title: `>>> [${name}] REMOVEU UM EFEITO`,
      color: 3447003,
      description: `**TYPE:** ${effect.mode}\n**TARGET:** ${effect.target}\n**MOD.:** ${effect.val > 0 ? `+${effect.val}` : effect.val}\n**DESC:** ${effect.description}`,
    };
    dispatchDiscordLog("PLAYER", name, "", [effectEmbed]);
    removeCustomEffect(id);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-6 bg-[var(--theme-background)]/80 p-2 border border-[var(--theme-border)]">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-[var(--theme-accent)] font-bold border-b border-[var(--theme-border)] mb-1 pb-1">
            ATRIBUTOS
          </span>
          <div className="flex justify-between items-center text-[10px]">
            <span>FÍSICO</span> {renderMod(getTargetSum("ATT_PHYSICAL"))}
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span>MENTAL</span> {renderMod(getTargetSum("ATT_MENTAL"))}
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span>SOCIAL</span> {renderMod(getTargetSum("ATT_SOCIAL"))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-[var(--theme-accent)] font-bold border-b border-[var(--theme-border)] mb-1 pb-1">
            PERÍCIAS
          </span>
          <div className="flex justify-between items-center text-[10px]">
            <span>FÍSICA</span> {renderMod(getTargetSum("SKILL_PHYSICAL"))}
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span>MENTAL</span> {renderMod(getTargetSum("SKILL_MENTAL"))}
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span>SOCIAL</span> {renderMod(getTargetSum("SKILL_SOCIAL"))}
          </div>
        </div>
      </div>

      <div className="border border-[var(--theme-warning)]/50 bg-[var(--theme-warning)]/5 p-2 flex flex-col">
        <div className="flex justify-between items-center mb-2 border-b border-[var(--theme-warning)]/30 pb-1">
          <span className="text-[10px] font-bold text-[var(--theme-warning)] tracking-widest uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--theme-warning)] animate-ping" />
            EFEITOS TEMPORÁRIOS
          </span>
          {isDev && (
            <Button
              size="sm"
              variant="warning"
              onClick={tempModal.onOpen}
              className="px-2 py-0.5 text-[9px] border-dashed"
            >
              + NOVO TEMP
            </Button>
          )}
        </div>
        <div className="max-h-[150px] overflow-y-auto custom-scrollbar">
          {tempEffects.length > 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <EffectsList
                effects={tempEffects}
                onRemove={(id) =>
                  handleRemove(
                    id,
                    tempEffects.find((e) => e.id === id)?.link || null,
                  )
                }
              />
            </motion.div>
          ) : (
            <span className="text-[9px] text-[var(--theme-text)]/40 uppercase tracking-widest font-mono">
              [ NENHUM EFEITO VOLÁTIL ATIVO ]
            </span>
          )}
        </div>
      </div>

      <div className="border border-[var(--theme-border)] bg-[var(--theme-background)]/80 p-2 flex flex-col">
        <div className="flex justify-between items-center mb-2 border-b border-[var(--theme-border)] pb-1">
          <span className="text-[10px] font-bold text-[var(--theme-text)]/70 tracking-widest uppercase">
            MODIFICADORES PASSIVOS / EQUIPAMENTOS
          </span>
          {isDev && (
            <Button
              size="sm"
              onClick={globalModal.onOpen}
              className="px-2 py-0.5 text-[9px] border-dashed"
            >
              + NOVO FIXO
            </Button>
          )}
        </div>
        <div className="max-h-[150px] overflow-y-auto custom-scrollbar">
          {globalEffects.length > 0 ? (
            <EffectsList
              effects={globalEffects}
              onRemove={(id) =>
                handleRemove(
                  id,
                  globalEffects.find((e) => e.id === id)?.link || null,
                )
              }
            />
          ) : (
            <span className="text-[9px] text-[var(--theme-text)]/40 uppercase tracking-widest font-mono">
              [ NENHUM MODIFICADOR PASSIVO ]
            </span>
          )}
        </div>
      </div>

      <CustomEffectModal
        isOpen={globalModal.isOpen}
        onClose={globalModal.onClose}
        allowedModes={["FIXED", "OPTIONAL"]}
      />

      <CustomEffectModal
        isOpen={tempModal.isOpen}
        onClose={tempModal.onClose}
        allowedModes={["TEMP"]}
      />
    </div>
  );
}
