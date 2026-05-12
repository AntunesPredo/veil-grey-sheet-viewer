import { useCharacterStore } from "../../features/character/store";
import { RetroToast } from "../ui/RetroToast";
import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY || "fallback_veil_grey_key";
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";

export const useImportData = ({
  onError,
  onClose,
  fileInputRef,
}: {
  onError: (error: Error) => void;
  onClose: () => void;
  fileInputRef: React.RefObject<HTMLInputElement> | null;
}) => {
  const importCharacterData = useCharacterStore(
    (state) => state.importCharacterData,
  );

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawContent = event.target?.result as string;
        const bytes = CryptoJS.AES.decrypt(rawContent, SECRET_KEY);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedStr)
          throw new Error(
            "Assinatura criptográfica inválida ou arquivo corrompido.",
          );

        const parsed = JSON.parse(decryptedStr);

        if (parsed.vg_version !== APP_VERSION)
          throw new Error("Versão incompativel.");

        const characterData = parsed.data;

        importCharacterData(characterData);
        RetroToast.success("SISTEMA RESTAURADO COM SUCESSO.");
        onClose();
      } catch (error) {
        onError(error as Error);
      }
    };
    reader.readAsText(file);
    if (fileInputRef?.current) fileInputRef.current.value = "";
  };

  return { handleImportJSON };
};
