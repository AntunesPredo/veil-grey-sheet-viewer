import { useState } from "react";
import { useNetworkStore } from "../store/useNetworkStore";
import { Modal } from "./Overlays";
import { Button } from "./Form";
import { useCharacterStore } from "../../features/character/store";

interface TargetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (targets: string[]) => void;
  title?: string;
  allowAll?: boolean;
}

export function TargetSelectionModal({
  isOpen,
  onClose,
  onSelect,
  title = "SELECIONAR ALVOS",
  allowAll = false,
}: TargetSelectionModalProps) {
  const onlinePlayers = useNetworkStore((state) => state.onlinePlayers);
  const [selected, setSelected] = useState<string[]>([]);
  const name = useCharacterStore((state) => state.name);
  const filteredPlayers = onlinePlayers.filter((player) => player !== name);

  if (!isOpen) return null;

  const toggleSelect = (target: string) => {
    if (target === "ALL") {
      setSelected(selected.includes("ALL") ? [] : ["ALL"]);
      return;
    }
    setSelected((prev) =>
      prev.includes(target)
        ? prev.filter((t) => t !== target)
        : [...prev.filter((t) => t !== "ALL"), target],
    );
  };

  const handleConfirm = () => {
    if (selected.length > 0) {
      onSelect(selected);
      onClose();
      setSelected([]);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar p-2 bg-[var(--theme-background)] border border-[var(--theme-border)]">
          <Button
            variant={selected.includes("SELF") ? "success" : "primary"}
            onClick={() => toggleSelect("SELF")}
          >
            [ MIM MESMO ]
          </Button>
          <Button
            variant={selected.includes("ENEMY") ? "success" : "primary"}
            onClick={() => toggleSelect("ENEMY")}
          >
            [ INIMIGO (M.D) ]
          </Button>
          {allowAll && (
            <Button
              variant={selected.includes("ALL") ? "success" : "primary"}
              onClick={() => toggleSelect("ALL")}
            >
              [ TODOS (BROADCAST) ]
            </Button>
          )}
          <div className="col-span-full border-t border-[var(--theme-border)] my-2"></div>
          {filteredPlayers.map((player) => (
            <Button
              key={player}
              variant={selected.includes(player) ? "warning" : "primary"}
              onClick={() => toggleSelect(player)}
            >
              UNIDADE: {player}
            </Button>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="danger" onClick={onClose} className="flex-1">
            CANCELAR
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={selected.length === 0}
            className="flex-1"
          >
            ENGAJAR
          </Button>
        </div>
      </div>
    </Modal>
  );
}
