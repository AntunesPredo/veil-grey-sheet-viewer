import { Modal } from "../../shared/ui/Overlays";
import { Button } from "../../shared/ui/Form";
import { useRoller } from "../../shared/hooks/useRoller";
import { useCharacterStore } from "../character/store";
import { useRollStore } from "./useRollStore";

export function RollRequestModal() {
  const incomingRequest = useRollStore((state) => state.incomingRequest);
  const setIncomingRequest = useRollStore((state) => state.setIncomingRequest);
  const { initiateRoll } = useRoller();
  const attributes = useCharacterStore((s) => s.attributes);
  const skills = useCharacterStore((s) => s.skills);

  if (!incomingRequest) return null;

  const handleAccept = () => {
    let baseVal = 0;
    if (incomingRequest.rollKey in attributes)
      baseVal = attributes[incomingRequest.rollKey as keyof typeof attributes];
    if (incomingRequest.rollKey in skills)
      baseVal = skills[incomingRequest.rollKey as keyof typeof skills];

    initiateRoll(
      incomingRequest.title,
      `1d20+${baseVal}`,
      [incomingRequest.rollKey, incomingRequest.rollCategory],
      incomingRequest.dc,
    );
    setIncomingRequest(null);
  };

  return (
    <Modal
      isOpen={!!incomingRequest}
      onClose={() => setIncomingRequest(null)}
      title="SOLICITAÇÃO DE TESTE"
      maxWidth="max-w-md"
    >
      <div className="flex flex-col gap-4 text-center">
        <div className="bg-[var(--theme-warning)]/10 border border-[var(--theme-warning)] p-4">
          <span className="text-[10px] tracking-widest text-[var(--theme-warning)] font-bold block uppercase mb-2">
            SOLICITADO POR: {incomingRequest.requester}
          </span>
          <span className="text-xl font-mono text-[var(--theme-accent)] font-bold block glow-text uppercase">
            {incomingRequest.title}
          </span>
          {incomingRequest.dc !== undefined && (
            <span className="text-xs font-mono text-[var(--theme-warning)] mt-2 block font-bold">
              DIFICULDADE ALVO: DC {incomingRequest.dc}
            </span>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <Button
            variant="danger"
            onClick={() => setIncomingRequest(null)}
            className="flex-1 border-dashed"
          >
            RECUSAR
          </Button>
          <Button
            variant="primary"
            onClick={handleAccept}
            className="flex-[2] animate-pulse"
          >
            ACEITAR E ROLAR
          </Button>
        </div>
      </div>
    </Modal>
  );
}
