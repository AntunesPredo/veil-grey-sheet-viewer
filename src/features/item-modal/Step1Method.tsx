import { useState } from "react";
import { motion } from "framer-motion";
import { useCharacterStore } from "../character/store";
import type { Item } from "../../shared/types/veil-grey";
import { RetroToast } from "../../shared/ui/RetroToast";
import { Button, Input } from "../../shared/ui/Form";
import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY || "fallback_veil_grey_key";

interface Step1MethodProps {
  onNext: () => void;
  onClose: () => void;
  onError: (msg: string) => void;
}

export function Step1Method({ onNext, onClose, onError }: Step1MethodProps) {
  const [hash, setHash] = useState("");
  const addInventoryItem = useCharacterStore((state) => state.addInventoryItem);

  const handleImport = () => {
    if (!hash.trim()) return;
    try {
      let cleanHash = decodeURIComponent(hash.trim());
      cleanHash = cleanHash.replace(/\s/g, "+");

      const bytes = CryptoJS.AES.decrypt(cleanHash, SECRET_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedString)
        throw new Error("Payload criptográfico corrompido ou incorreto.");

      const parsedData = JSON.parse(decryptedString);
      const payloads = Array.isArray(parsedData) ? parsedData : [parsedData];
      const itemPayload = payloads[0];

      if (itemPayload.type !== "ITEM")
        throw new Error(
          "O Hash fornecido não contém a assinatura de um item válido.",
        );

      const newItem: Item = {
        ...(itemPayload.data as Item),
        id: Date.now(),
        isCarried: true,
        parentId: null,
      };

      addInventoryItem(newItem);
      RetroToast.success(`[${newItem.name}] SINTETIZADO COM SUCESSO.`);
      onClose();
    } catch (error) {
      onError(
        `Erro de decodificação no Módulo - ${(error as Error).message ?? "Falha de Leitura"}`,
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-6 pt-4"
    >
      <div className="flex flex-col gap-2 p-4 border border-[var(--theme-accent)] bg-[var(--theme-accent)]/5">
        <span className="text-[10px] font-bold text-[var(--theme-accent)] tracking-widest uppercase">
          RECONSTRUÇÃO VIA HASH
        </span>
        <Input
          placeholder="Insira o código de injeção..."
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          className="w-full font-mono text-xs"
        />
        <Button
          variant="primary"
          onClick={handleImport}
          className="w-full mt-2"
        >
          EXECUTAR DECODIFICAÇÃO
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-[var(--theme-border)]" />
        <span className="text-xs text-[var(--theme-text)]/50 font-bold">
          OU
        </span>
        <div className="flex-1 h-px bg-[var(--theme-border)]" />
      </div>

      <Button
        variant="primary"
        onClick={onNext}
        className="w-full py-4 border-dashed"
      >
        + INICIAR CRIAÇÃO MANUAL
      </Button>
    </motion.div>
  );
}
