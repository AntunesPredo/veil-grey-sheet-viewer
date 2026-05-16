import { Modal } from "../../../shared/ui/Overlays";
import { Input, Checkbox } from "../../../shared/ui/Form";
import type { Item, CustomEffect } from "../../../shared/types/veil-grey";

interface ArsenalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  globalItems: Item[];
  globalEffects: CustomEffect[];
  selectedPayloads: {
    id: string | number;
    type: "ITEM" | "EFFECT";
    data: Item | CustomEffect;
  }[];
  toggleSelection: (
    id: string | number,
    type: "ITEM" | "EFFECT",
    data: Item | CustomEffect,
  ) => void;
}

export function ArsenalSearchModal({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  globalItems,
  globalEffects,
  selectedPayloads,
  toggleSelection,
}: ArsenalSearchModalProps) {
  const filteredItems = globalItems.filter((i: Item) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredEffects = globalEffects.filter((e: CustomEffect) =>
    e.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PESQUISA GLOBAL DO ARSENAL"
      maxWidth="max-w-4xl"
    >
      <div className="flex flex-col gap-4 h-[60vh]">
        <Input
          type="text"
          placeholder="Digite o termo de busca..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-lg py-3 w-full"
          autoFocus
        />

        <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
          <div className="flex flex-col border border-[var(--theme-border)] bg-[#050505]">
            <span className="bg-[var(--theme-accent)]/10 text-[10px] font-bold p-2 uppercase tracking-widest text-[var(--theme-accent)] border-b border-[var(--theme-accent)]/30">
              MATÉRIAS ENCONTRADAS ({filteredItems.length})
            </span>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
              {filteredItems.map((item: Item) => {
                const isSelected = !!selectedPayloads.find(
                  (p) => p.id === item.id,
                );
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 p-2 border ${isSelected ? "border-[var(--theme-accent)] bg-[var(--theme-accent)]/10" : "border-[var(--theme-border)]"}`}
                  >
                    <Checkbox
                      label=""
                      checked={isSelected}
                      onChange={() => toggleSelection(item.id, "ITEM", item)}
                    />
                    <span className="text-[10px] font-bold uppercase truncate">
                      {item.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col border border-[var(--theme-border)] bg-[#050505]">
            <span className="bg-[var(--theme-danger)]/10 text-[10px] font-bold p-2 uppercase tracking-widest text-[var(--theme-danger)] border-b border-[var(--theme-danger)]/30">
              EFEITOS ENCONTRADOS ({filteredEffects.length})
            </span>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
              {filteredEffects.map((eff: CustomEffect) => {
                const isSelected = !!selectedPayloads.find(
                  (p) => p.id === eff.id,
                );
                return (
                  <div
                    key={eff.id}
                    className={`flex items-center gap-2 p-2 border ${isSelected ? "border-[var(--theme-danger)] bg-[var(--theme-danger)]/10" : "border-[var(--theme-border)]"}`}
                  >
                    <Checkbox
                      label=""
                      checked={isSelected}
                      onChange={() => toggleSelection(eff.id, "EFFECT", eff)}
                    />
                    <span className="text-[10px] font-bold uppercase truncate">
                      [{eff.mode}] {eff.description} (
                      {eff.val > 0 ? `+${eff.val}` : eff.val})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
