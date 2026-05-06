import { DisadvantagesWidget } from "./DisadvantagesWidget";
import { EnergyWidget } from "./EnergyWidget";
import { HealthWidget } from "./HealthWidget";
import { MadnessGaugeWidget } from "./MadnessGaugeWidget";
import { SustenanceWidget } from "./SustenanceWidget";
import { SystemModifiersWidget } from "./SystemModifiersWidget";

function WidgetBlade({
  title,
  number,
  children,
  classContainer,
  isDanger,
}: {
  title: string;
  number: string;
  children: React.ReactElement;
  classContainer?: string;
  isDanger?: boolean;
}) {
  const titleClass = isDanger
    ? "bg-[var(--theme-danger)] text-white border-[var(--theme-danger)]"
    : "bg-[var(--theme-accent)] text-[var(--theme-background)] border-[var(--theme-border)]";
  const borderColor = isDanger ? "var(--theme-danger)" : "var(--theme-border)";

  return (
    <div
      className={`border-2 border-[${borderColor}] bg-[var(--theme-background)] flex flex-col relative group`}
    >
      <div
        className={`border-b-2 px-3 py-1.5 font-bold tracking-[0.2em] uppercase text-xs flex justify-between ${titleClass}`}
      >
        <span>{title.toUpperCase()}</span>
        <span className="opacity-70">BLADE_{number.padStart(2, "0")}</span>
      </div>
      <div className={`flex flex-col gap-6 flex-1 ${classContainer}`}>
        {children}
      </div>
    </div>
  );
}

export function VitalsPanel() {
  return (
    <div className="flex flex-col gap-6 p-4 bg-[var(--theme-background)] border-4 border-double border-[var(--theme-border)] relative">
      <div className="flex justify-center items-center gap-4 mb-2 border-b-2 border-[var(--theme-border)] pb-2">
        <div className="w-3 h-3 bg-[var(--theme-accent)] animate-pulse" />
        <h2 className="font-mono font-black text-[var(--theme-accent)] tracking-[0.3em] uppercase text-xl">
          SYS.VITALS
        </h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <WidgetBlade
          title="Sistema de Suporte à vida"
          number="1"
          classContainer="p-5"
        >
          <HealthWidget />
        </WidgetBlade>
        <WidgetBlade title="Medidor de Sanidade" number="2">
          <MadnessGaugeWidget />
        </WidgetBlade>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <WidgetBlade title="NUTRIÇÃO" number="3">
          <SustenanceWidget />
        </WidgetBlade>
        <WidgetBlade title="ENERGIA" number="4">
          <EnergyWidget />
        </WidgetBlade>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <WidgetBlade
          title="Sistema de modificadores"
          number="5"
          classContainer="p-5"
        >
          <SystemModifiersWidget />
        </WidgetBlade>
        <WidgetBlade title="ANOMALIAS REGISTRADAS" number="6" isDanger>
          <DisadvantagesWidget />
        </WidgetBlade>
      </div>
    </div>
  );
}
