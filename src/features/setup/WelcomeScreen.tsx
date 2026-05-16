import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useCharacterStore } from "../character/store";
import { useSystemStore } from "../../shared/store/useSystemStore";
import { Button, Input } from "../../shared/ui/Form";
import { RetroToast } from "../../shared/ui/RetroToast";
import { GlitchImage } from "../../shared/ui/GlitchImage";
import { useDisclosure } from "../../shared/hooks/useDisclosure";
import { useImportData } from "../../shared/hooks/useImportData";
import { ConfirmModal } from "../../shared/ui/Overlays";
import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY || "fallback_veil_grey_key";
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";
const isDev =
  import.meta.env.VITE_IN_DEVELOPMENT === "true" || import.meta.env.DEV;

const fadeVariants: Variants = {
  hidden: { opacity: 0, filter: "blur(4px)", scale: 0.95 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: { duration: 0.8, ease: "easeOut" } as const,
  },
  exit: {
    opacity: 0,
    filter: "blur(4px)",
    scale: 1.05,
    transition: { duration: 0.5, ease: "easeIn" } as const,
  },
};

export function WelcomeScreen() {
  const updateProgression = useCharacterStore(
    (state) => state.updateProgression,
  );
  const resetCharacterData = useCharacterStore(
    (state) => state.resetCharacterData,
  );
  const storedName = useCharacterStore((state) => state.name);
  const creationStatus = useCharacterStore((state) => state.creationStatus);
  const isOutdatedSave = useCharacterStore((state) => state.isOutdatedSave);
  const hasSeenPresentation = useSystemStore(
    (state) => state.hasSeenPresentation,
  );
  const setHasSeenPresentation = useSystemStore(
    (state) => state.setHasSeenPresentation,
  );
  const setSessionActive = useSystemStore((state) => state.setSessionActive);

  const hasValidSave = useMemo(() => {
    return storedName && creationStatus !== "NOT_STARTED";
  }, [storedName, creationStatus]);

  const [localName, setLocalName] = useState("");
  const [step, setStep] = useState<"presentation" | "identification">(
    hasSeenPresentation || hasValidSave ? "identification" : "presentation",
  );

  const errorModal = useDisclosure();
  const resetConfirmModal = useDisclosure();
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null!);

  const { handleImportJSON } = useImportData({
    fileInputRef,
    onClose: () => {},
    onError(error) {
      errorModal.onOpen();
      setConfirmModalMessage(
        `Erro durante o processamento do arquivo - ${(error as Error).message ?? "Desconhecido"}`,
      );
    },
  });

  useEffect(() => {
    if (step === "presentation") {
      const timer = setTimeout(() => {
        setHasSeenPresentation(true);
        setStep("identification");
      }, 4500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleStartNew = () => {
    if (!localName.trim()) {
      RetroToast.error("IDENTIFICAÇÃO OBRIGATÓRIA.");
      return;
    }

    if (localName.trim() === "hahaéoakula" && isDev) {
      updateProgression({
        name: "MESTRE",
        isMasterMode: true,
        creationStatus: "CLOSED",
      });
      setSessionActive(true);
      return;
    }

    updateProgression({ name: localName, creationStatus: "PRE_STARTED" });
    setSessionActive(true);
  };

  const handleResumeSession = () => {
    if (isOutdatedSave) return;
    setSessionActive(true);
  };

  const handleExportSave = () => {
    const {
      resetCharacterData,
      importCharacterData,
      isOutdatedSave,
      ...dataToSave
    } = useCharacterStore.getState();

    const noSave = [resetCharacterData, importCharacterData, isOutdatedSave];
    delete noSave[0];
    delete noSave[1];
    delete noSave[2];

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
    a.download = `VG_SAVE_${storedName}.json`;
    a.click();
    RetroToast.success("BACKUP EXPORTADO.");
  };

  const handleSandbox = () => {
    updateProgression({
      name: localName || "SANDBOX",
      sandboxMode: true,
      creationStatus: "CLOSED",
    });
    setSessionActive(true);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-lg mx-auto p-6 text-center">
      <AnimatePresence mode="wait">
        {step === "presentation" ? (
          <motion.div
            key="presentation"
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center gap-6 cursor-pointer w-full"
            onClick={() => {
              setHasSeenPresentation(true);
              setStep("identification");
            }}
            title="PULAR ABERTURA"
          >
            <p className="text-[var(--theme-text)] text-xs tracking-widest animate-pulse">
              SISTEMA CONTROLADO POR:
            </p>

            <GlitchImage
              src={
                new URL(
                  "../../assets/images/logos/omnimedia_logo.svg",
                  import.meta.url,
                ).href
              }
              alt="Omnimedia Logo"
              containerClassName="w-40 h-40 bg-transparent border-none"
              className="object-contain"
              glitchIntensity="high"
              noLoad
            />

            <div className="flex flex-col gap-1">
              <h1 className="text-4xl font-bold tracking-[0.2em] text-[var(--theme-accent)] glow-text">
                OMNIMEDIA
              </h1>
              <h1 className="text-4xl font-bold tracking-[0.2em] text-[var(--theme-accent)] glow-text">
                GROUP
              </h1>
            </div>

            <p className="text-[var(--theme-text)] text-sm tracking-widest italic mt-4 px-4">
              "Os olhos do Protetorado, a voz do povo."
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="identification"
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center w-full"
          >
            <GlitchImage
              src={
                new URL(
                  "../../assets/images/logos/omnimedia_logo.svg",
                  import.meta.url,
                ).href
              }
              alt="Omnimedia Logo"
              containerClassName="w-24 h-24 bg-transparent border-none opacity-80"
              className="object-contain"
              glitchIntensity="low"
            />

            <div className="w-full mt-8 mb-6 bg-[var(--theme-background)]/80 border border-[var(--theme-border)] shadow-[0_0_20px_rgba(0,0,0,0.5)] min-h-[320px] flex flex-col">
              <AnimatePresence mode="wait">
                {hasValidSave ? (
                  <motion.div
                    key="valid-save"
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)" }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-4 p-6 h-full justify-center w-full"
                  >
                    <div className="flex flex-col gap-2 text-center mb-4">
                      <label className="text-[10px] text-[var(--theme-accent)] font-bold tracking-widest">
                        DADOS RESIDUAIS ENCONTRADOS
                      </label>
                      <div
                        className={`text-xl font-mono font-bold tracking-widest uppercase p-2 border ${isOutdatedSave ? "border-[var(--theme-danger)] text-[var(--theme-danger)] bg-[var(--theme-danger)]/10" : "border-[var(--theme-accent)] text-[var(--theme-accent)] bg-[var(--theme-accent)]/10"}`}
                      >
                        UNIDADE: {storedName}
                      </div>
                    </div>

                    {isOutdatedSave && (
                      <div className="mb-2 p-3 bg-[var(--theme-danger)]/20 border border-[var(--theme-danger)]">
                        <span className="text-[14px] font-bold text-[var(--theme-danger)] uppercase">
                          INCOMPATIBILIDADE DE SISTEMA: A versão dos dados
                          difere da versão da plataforma. Operação bloqueada
                          para evitar corrupção. Exporte o backup ou destrua os
                          dados.
                        </span>
                      </div>
                    )}

                    <Button
                      className="w-full py-3"
                      onClick={handleResumeSession}
                      disabled={isOutdatedSave}
                    >
                      RETOMAR SESSÃO
                    </Button>

                    <Button
                      variant="warning"
                      className="w-full py-3 border-dashed"
                      onClick={handleExportSave}
                    >
                      [ EXPORTAR BACKUP .JSON ]
                    </Button>

                    <div className="border-t border-dashed border-[var(--theme-border)] pt-4 w-full mt-2">
                      <Button
                        variant="danger"
                        className="w-full py-3"
                        onClick={resetConfirmModal.onOpen}
                      >
                        DESTRUIR DADOS E INICIAR NOVO
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="new-save"
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)" }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-4 p-6 h-full justify-center w-full"
                  >
                    <div className="flex flex-col gap-2 text-center">
                      <label className="text-[10px] text-[var(--theme-accent)] font-bold tracking-widest">
                        IDENTIFIQUE-SE
                      </label>
                      <Input
                        type="text"
                        placeholder="NOME/ID"
                        value={localName}
                        onChange={(e) => setLocalName(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          localName.trim() &&
                          handleStartNew()
                        }
                        className="w-full text-center text-lg py-2 font-bold"
                        autoFocus
                      />
                    </div>
                    <Button className="w-full py-3" onClick={handleStartNew}>
                      INICIAR PROTOCOLO
                    </Button>
                    <Button
                      variant="warning"
                      className="w-full border-dashed"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      [ IMPORTAR .JSON ]
                    </Button>

                    <div className="border-t border-dashed border-[var(--theme-border)] pt-4 w-full">
                      <Button
                        variant="warning"
                        className="w-full opacity-60 hover:opacity-100 border-none"
                        onClick={handleSandbox}
                      >
                        [ ACESSAR MODO SANDBOX ]
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <input
                type="file"
                accept=".json"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImportJSON}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={resetConfirmModal.isOpen}
        onClose={resetConfirmModal.onClose}
        title="WIPE DE MEMÓRIA"
        message="Esta ação apagará permanentemente o save atual. Deseja prosseguir?"
        isDanger
        onConfirm={() => {
          resetConfirmModal.onClose();
          setTimeout(() => {
            resetCharacterData();
          }, 300);
        }}
      />

      <ConfirmModal
        isOpen={errorModal.isOpen}
        onClose={errorModal.onClose}
        title="IMPORT ERROR"
        message={confirmModalMessage}
        isDanger
        onConfirm={() => {
          errorModal.onClose();
          setTimeout(() => {
            setConfirmModalMessage("");
          }, 300);
        }}
      />
    </div>
  );
}
