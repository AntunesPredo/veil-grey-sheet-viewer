import { useRef, useState } from "react";
import { useCharacterStore } from "../character/store";
import { Modal, ConfirmModal } from "../../shared/ui/Overlays";
import { Button, Checkbox, Input } from "../../shared/ui/Form";
import { useDisclosure } from "../../shared/hooks/useDisclosure";
import { useImportData } from "../../shared/hooks/useImportData";
import { RetroToast } from "../../shared/ui/RetroToast";
import CryptoJS from "crypto-js";
import { useSystemStore } from "../../shared/store/useSystemStore";
import { Power } from "lucide-react";

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY || "fallback_veil_grey_key";
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";

export function SettingsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const setPowerState = useSystemStore((state) => state.setPowerState);
  const settings = useCharacterStore((state) => state.settings);
  const sandboxMode = useCharacterStore((state) => state.sandboxMode);
  const name = useCharacterStore((state) => state.name);
  const updateProgression = useCharacterStore(
    (state) => state.updateProgression,
  );
  const resetCharacterData = useCharacterStore(
    (state) => state.resetCharacterData,
  );
  const fileInputRef = useRef<HTMLInputElement>(null!);

  const { handleImportJSON } = useImportData({
    fileInputRef,
    onClose,
    onError(error) {
      errorModal.onOpen();
      setConfirmModalMessage(
        `Erro durante o processamento do arquivo - ${(error as Error).message ?? "Desconhecido"}`,
      );
    },
  });

  const wipeModal = useDisclosure();
  const errorModal = useDisclosure();
  const [confirmModalMessage, setConfirmModalMessage] = useState("");

  const isDev =
    import.meta.env.VITE_IN_DEVELOPMENT === "true" || import.meta.env.DEV;

  const handleExportJSON = () => {
    const { resetCharacterData, importCharacterData, ...dataToSave } =
      useCharacterStore.getState();

    const noSave = [resetCharacterData, importCharacterData];
    delete noSave[0];
    delete noSave[1];

    const payload = {
      vg_version: APP_VERSION,
      timestamp: new Date().toISOString(),
      data: dataToSave,
    };

    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(payload),
      SECRET_KEY,
    ).toString();
    const dataStr =
      "data:text/plain;charset=utf-8," + encodeURIComponent(encrypted);

    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `VG_SAVE_${name || "UNNAMED"}.json`;
    a.click();
  };

  const processJsonMigration = (
    e: React.ChangeEvent<HTMLInputElement>,
    action: "ENCRYPT" | "DECRYPT",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let outputStr = "";
        let fileName = "";

        if (action === "ENCRYPT") {
          const rawData = JSON.parse(content);
          const payload = {
            vg_version: APP_VERSION,
            timestamp: new Date().toISOString(),
            data: rawData,
          };
          outputStr = CryptoJS.AES.encrypt(
            JSON.stringify(payload),
            SECRET_KEY,
          ).toString();
          fileName = "VG_MIGRATED_SAVE.json";
        } else {
          const bytes = CryptoJS.AES.decrypt(content, SECRET_KEY);
          const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
          if (!decryptedStr)
            throw new Error("Assinatura invalida ou chaves divergentes.");
          const parsed = JSON.parse(decryptedStr);
          outputStr = JSON.stringify(parsed, null, 2);
          fileName = "VG_DECRYPTED_SAVE.json";
        }

        const dataUri =
          "data:text/plain;charset=utf-8," + encodeURIComponent(outputStr);
        const link = document.createElement("a");
        link.href = dataUri;
        link.download = fileName;
        link.click();
      } catch (err) {
        RetroToast.error(
          "Falha no parseamento do arquivo: " + (err as Error).message,
        );
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="CONFIGURAÇÕES">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4 p-3 bg-[var(--theme-background)] group border-l-4 border-l-[var(--theme-accent)]">
            <svg
              className="w-12 h-12 fill-[var(--theme-accent)] opacity-30 group-hover:opacity-60 transition-opacity shrink-0"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8 0C4.13401 0 1 3.13401 1 7V10L4 13L3 15V16H13V15L12 13L15 10V7C15 3.13401 11.866 0 8 0ZM6.5 7.5C6.5 8.32843 5.82843 9 5 9C4.17157 9 3.5 8.32843 3.5 7.5C3.5 6.67157 4.17157 6 5 6C5.82843 6 6.5 6.67157 6.5 7.5ZM11 9C11.8284 9 12.5 8.32843 12.5 7.5C12.5 6.67157 11.8284 6 11 6C10.1716 6 9.5 6.67157 9.5 7.5C9.5 8.32843 10.1716 9 11 9Z"
              />
            </svg>
            <div className="flex flex-col flex-1 gap-1">
              <span className="text-[9px] font-bold text-[var(--theme-text)]/50 tracking-widest uppercase">
                IDENTIFICADOR:
              </span>
              <Input
                value={name}
                onChange={(e) => updateProgression({ name: e.target.value })}
                className="w-full text-sm font-bold text-[var(--theme-accent)] bg-[var(--theme-background)]/50"
                placeholder="Identificador de Unidade"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 p-3 bg-[var(--theme-background)] border-l-4 border-l-[var(--theme-accent)]">
            <div className="flex flex-col gap-2">
              <Checkbox
                label="DETALHAR LOG DE ROLAGENS"
                checked={settings.showRollDetails}
                onChange={() =>
                  updateProgression({
                    settings: {
                      ...settings,
                      showRollDetails: !settings.showRollDetails,
                    },
                  })
                }
              />
              {sandboxMode && (
                <Checkbox
                  label="FORÇAR TRAVAMENTO DE PONTOS"
                  checked={settings.lockPoints}
                  onChange={() =>
                    updateProgression({
                      settings: {
                        ...settings,
                        lockPoints: !settings.lockPoints,
                      },
                    })
                  }
                />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 p-3 bg-[var(--theme-danger)]/10 border-l-4 border-l-[var(--theme-danger)]">
            <span className="text-[10px] font-bold text-[var(--theme-accent)] tracking-widest">
              AREA DE RISCO
            </span>

            {!sandboxMode ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  onClick={handleExportJSON}
                  className="border-dashed text-[var(--theme-accent)]"
                >
                  EXPORTAR (.JSON)
                </Button>
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-dashed text-[var(--theme-accent)]"
                >
                  IMPORTAR (.JSON)
                </Button>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImportJSON}
                />
              </div>
            ) : null}

            {isDev && (
              <>
                <div className="flex flex-row gap-4">
                  <input
                    type="file"
                    accept=".json"
                    id="decrypt-file"
                    className="hidden"
                    onChange={(e) => processJsonMigration(e, "DECRYPT")}
                  />
                  <Button
                    size="sm"
                    variant="warning"
                    className="w-full"
                    onClick={() =>
                      document.getElementById("decrypt-file")?.click()
                    }
                  >
                    DESCRIPTOGRAFAR JSON
                  </Button>
                  <input
                    type="file"
                    accept=".json"
                    id="encrypt-file"
                    className="hidden"
                    onChange={(e) => processJsonMigration(e, "ENCRYPT")}
                  />
                  <Button
                    size="sm"
                    variant="warning"
                    className="w-full"
                    onClick={() =>
                      document.getElementById("encrypt-file")?.click()
                    }
                  >
                    CRIPTOGRAFAR JSON
                  </Button>
                </div>
              </>
            )}

            <Button
              size="sm"
              variant="danger"
              className="flex justify-center gap-2"
              onClick={wipeModal.onOpen}
            >
              WIPE - DELETAR INFORMAÇÕES
            </Button>
          </div>
          <div className="py-4 flex items-center w-full justify-center">
            <Button
              className="w-full flex justify-center gap-2 items-center text-[15px]"
              onClick={() => {
                onClose();
                setPowerState("SHUTTING_DOWN");
              }}
            >
              <Power style={{ strokeWidth: "3px" }} />
              POWER OFF
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={wipeModal.isOpen}
        onClose={wipeModal.onClose}
        title="WIPE"
        message="Atenção: Esta ação apagará permanentemente todos os dados da unidade atual da memória local. Deseja prosseguir?"
        isDanger
        onConfirm={() => {
          resetCharacterData();
          onClose();
        }}
      />

      <ConfirmModal
        isOpen={errorModal.isOpen}
        onClose={errorModal.onClose}
        title="XP ERROR"
        message={confirmModalMessage}
        isDanger
        onConfirm={() => {
          setConfirmModalMessage("");
          errorModal.onClose();
        }}
      />
    </>
  );
}
