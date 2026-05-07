import { useState } from "react";
import { useNetworkStore } from "../store/useNetworkStore";
import { Modal } from "./Overlays";
import { Button } from "./Form";

interface TargetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (target: string) => void;
  title?: string;
  allowAll?: boolean;
}

export function TargetSelectionModal({
  isOpen,
  onClose,
  onSelect,
  title = "SELECIONAR ALVO TÁTICO",
  allowAll = false,
}: TargetSelectionModalProps) {
  const onlinePlayers = useNetworkStore((state) => state.onlinePlayers);
  const [selected, setSelected] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
      onClose();
      setSelected(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar p-2 bg-[var(--theme-background)] border border-[var(--theme-border)]">
          <Button
            variant={selected === "SELF" ? "success" : "primary"}
            className="text-[10px] py-3"
            onClick={() => setSelected("SELF")}
          >
            [ MIM MESMO ]
          </Button>
          <Button
            variant={selected === "ENEMY" ? "success" : "primary"}
            className="text-[10px] py-3"
            onClick={() => setSelected("ENEMY")}
          >
            [ INIMIGO (M.D) ]
          </Button>

          {allowAll && (
            <Button
              variant={selected === "ALL" ? "success" : "primary"}
              className="text-[10px] py-3"
              onClick={() => setSelected("ALL")}
            >
              [ TODOS (BROADCAST) ]
            </Button>
          )}

          <div className="col-span-full border-t border-[var(--theme-border)] my-2"></div>

          {onlinePlayers.map((player) => (
            <Button
              key={player}
              variant={selected === player ? "warning" : "primary"}
              className="text-[10px] py-3 border-dashed"
              onClick={() => setSelected(player)}
            >
              UNIDADE: {player}
            </Button>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button
            variant="danger"
            onClick={onClose}
            className="flex-1 border-dashed"
          >
            CANCELAR
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!selected}
            className="flex-1"
          >
            ENGAJAR
          </Button>
        </div>
      </div>
    </Modal>
  );
}
