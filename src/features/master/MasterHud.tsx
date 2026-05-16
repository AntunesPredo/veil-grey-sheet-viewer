import { useState } from "react";
import { useSystemStore } from "../../shared/store/useSystemStore";
import { Button } from "../../shared/ui/Form";
import { HashGeneratorModal } from "../progression/HashGeneratorModal";
import { PlayerTrackerTab } from "./PlayerTrackerTab";
import { MasterArsenalTab } from "./MasterArsenalTab";

export function MasterHud() {
  const [activeTab, setActiveTab] = useState<"TRACKER" | "ARSENAL">("TRACKER");
  const setPowerState = useSystemStore((state) => state.setPowerState);
  const [isHashModalOpen, setHashModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen bg-[var(--theme-background)] text-[var(--theme-accent)] font-mono p-4 gap-4 overflow-hidden">
      <header className="flex justify-between items-center border-b-2 border-[var(--theme-danger)] pb-2 shrink-0 bg-[var(--theme-background)] z-10">
        <div className="flex flex-col">
          <span className="text-3xl font-black tracking-widest uppercase text-[var(--theme-danger)] glow-danger">
            SYS.OVERSEER
          </span>
          <span className="text-[10px] text-[var(--theme-text)]/70 uppercase tracking-widest">
            ACESSO CONCEDIDO.
          </span>
        </div>

        <div className="flex gap-4 items-center">
          <Button
            variant="warning"
            className="border-dashed h-10"
            onClick={() => setHashModalOpen(true)}
          >
            [ GERADOR DE HASH ]
          </Button>
          <Button
            variant="danger"
            className="h-10"
            onClick={() => setPowerState("SHUTTING_DOWN")}
          >
            POWER OFF
          </Button>
        </div>
      </header>

      <div className="flex gap-2 shrink-0">
        <Button
          variant={activeTab === "TRACKER" ? "danger" : "primary"}
          className="flex-1"
          onClick={() => setActiveTab("TRACKER")}
        >
          TELEMETRIA DE UNIDADES
        </Button>
        <Button
          variant={activeTab === "ARSENAL" ? "danger" : "primary"}
          className="flex-1"
          onClick={() => setActiveTab("ARSENAL")}
        >
          ARSENAL GLOBAL
        </Button>
      </div>

      <div className="flex-1 overflow-hidden border-2 border-[var(--theme-border)] bg-[#030303] shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] p-4 flex flex-col">
        {activeTab === "TRACKER" && <PlayerTrackerTab />}
        {activeTab === "ARSENAL" && <MasterArsenalTab />}
      </div>

      <HashGeneratorModal
        isOpen={isHashModalOpen}
        onClose={() => setHashModalOpen(false)}
      />
    </div>
  );
}
