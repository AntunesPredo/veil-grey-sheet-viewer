import { useState, useEffect } from "react";
import { Header } from "./Header";
import { useUIStore } from "../../shared/store/useUIStore";
import { AttributeDrawer } from "../../features/stats/AttributeDrawer";
import { SkillDrawer } from "../../features/stats/SkillDrawer";
import { CrisisOverlay } from "../../features/vitals/CrisisOverlay";
import { VitalsPanel } from "../../features/vitals/VitalsPanel";
import { LogisticsPanel } from "../../features/inventory/LogisticsPanel";
import { BioPanel } from "../../features/notes/BioPanel";
import { RollResolverModal } from "../../features/stats/RollResolverModal";
import { VitalsResolutionModal } from "../../features/vitals/VitalsResolutionModal";
import { InsanityTransactionModal } from "../../features/vitals/InsanityTransactionModal";
import { CombatDefenseModal } from "../../features/vitals/CombatDefenseModal";
import { SustenanceTransactionModal } from "../../features/vitals/SustenanceTransactionModal";
import { QuickRestModal } from "../../features/vitals/QuickRestModal";
import { FullRestModal } from "../../features/vitals/FullRestModal";

export function SystemHud() {
  const tabs = [
    { key: "front", label: "MAINFRAME" },
    { key: "inventory", label: "LOGÍSTICA" },
    { key: "bio", label: "BIO & NOTAS" },
  ];
  const [activeTab, setActiveTab] = useState<"front" | "inventory" | "bio">(
    "front",
  );

  const { enforceLayoutConstraints } = useUIStore();

  useEffect(() => {
    const handleResize = () => enforceLayoutConstraints(window.innerWidth);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [enforceLayoutConstraints]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--theme-background)] text-[var(--theme-accent)] font-mono md:p-4 gap-4">
      <CrisisOverlay />
      <RollResolverModal />
      <VitalsResolutionModal />
      <CombatDefenseModal />
      <InsanityTransactionModal />
      <SustenanceTransactionModal />
      <QuickRestModal />
      <FullRestModal />
      <Header />
      <div className="flex flex-1 overflow-hidden relative w-full border border-[var(--theme-accent)] ">
        <AttributeDrawer />

        <div className="flex-1 flex flex-col relative bg-[var(--theme-background)] z-10 shadow-[0_0_50px_rgba(0,0,0,0.8)_inset] min-w-[320px]">
          <div className="flex justify-center gap-2 p-2 border-b border-[var(--theme-accent)]/30 shrink-0">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                className={`px-4 py-2 font-bold tracking-widest text-[10px] md:text-xs uppercase transition-colors border border-transparent ${activeTab === key ? "bg-[var(--theme-accent)] text-[var(--theme-background)] border-[var(--theme-accent)]" : "text-[var(--theme-accent)] border-[var(--theme-accent)] hover:border-[var(--theme-accent)]"}`}
                onClick={() =>
                  setActiveTab(key as "front" | "inventory" | "bio")
                }
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {activeTab === "front" && <VitalsPanel />}
            {activeTab === "inventory" && <LogisticsPanel />}
            {activeTab === "bio" && <BioPanel />}
          </div>
        </div>

        <SkillDrawer />
      </div>
    </div>
  );
}
