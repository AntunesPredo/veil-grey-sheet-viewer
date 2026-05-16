import { useState } from "react";
import { VG_CONFIG } from "../../shared/config/system.config";
import type {
  CustomEffectTarget,
  EffectMode,
  CustomEffect,
} from "../../shared/types/veil-grey";
import { useCharacterStore } from "../character/store";
import { Modal } from "../../shared/ui/Overlays";
import { Button, Checkbox, Input } from "../../shared/ui/Form";
import {
  EFFECT_MODES,
  GLOBAL_ATTR_TARGETS,
  GLOBAL_SKILL_TARGETS,
  PROGRESSION_TARGETS,
  VITALS_TARGETS,
} from "../../shared/utils/selectOptions";

interface CustomEffectModalProps {
  isOpen: boolean;
  onClose: () => void;
  link?: number | string | null;
  allowedModes?: EffectMode[];
  onSave?: (effect: CustomEffect) => void;
}

export function CustomEffectModal({
  isOpen,
  onClose,
  link = null,
  allowedModes = ["FIXED", "OPTIONAL", "TEMP", "BONUS"],
  onSave,
}: CustomEffectModalProps) {
  const addCustomEffect = useCharacterStore((state) => state.addCustomEffect);
  const [desc, setDesc] = useState("");
  const [val, setVal] = useState(0);
  const [category, setCategory] = useState<string>("");
  const [target, setTarget] = useState<CustomEffectTarget | "">("");
  const [mode, setMode] = useState<EffectMode | "">("");
  const [error, setError] = useState("");

  const [prevOpen, setPrevOpen] = useState(false);
  if (isOpen && !prevOpen) {
    setPrevOpen(true);
    setMode(allowedModes.length === 1 ? allowedModes[0] : "");
  } else if (!isOpen && prevOpen) {
    setPrevOpen(false);
  }

  const handleInject = () => {
    if (!desc || !target || !mode) {
      setError("DESCRIÇÃO, ALVO E MODO SÃO OBRIGATÓRIOS.");
      return;
    }
    const newEffect: CustomEffect = {
      id: Date.now() + Math.random(),
      link,
      target: target as CustomEffectTarget,
      val,
      mode: mode as EffectMode,
      description: desc,
    };

    if (onSave) {
      onSave(newEffect);
    } else {
      addCustomEffect(newEffect);
    }

    setDesc("");
    setVal(0);
    setCategory("");
    setTarget("");
    setMode("");
    setError("");
    onClose();
  };

  const renderTargetOptions = () => {
    if (category === "attr_prim")
      return Object.keys(VG_CONFIG.att_groups).flatMap((k) =>
        Object.entries(
          VG_CONFIG.att_groups[k as keyof typeof VG_CONFIG.att_groups]
            .atributes,
        ).map(([id, a]) => (
          <option key={id} value={id}>
            {a.label}
          </option>
        )),
      );
    if (category === "attr_sec")
      return Object.entries(VG_CONFIG.att_secondary).map(([id, s]) => (
        <option key={id} value={id}>
          {s.label}
        </option>
      ));
    if (category === "skill")
      return Object.keys(VG_CONFIG.skill_groups).flatMap((k) =>
        Object.entries(
          VG_CONFIG.skill_groups[k as keyof typeof VG_CONFIG.skill_groups]
            .skills,
        ).map(([id, s]) => (
          <option key={id} value={id}>
            {s.label}
          </option>
        )),
      );
    if (category === "glob_attr")
      return GLOBAL_ATTR_TARGETS.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ));
    if (category === "glob_skill")
      return GLOBAL_SKILL_TARGETS.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ));
    if (category === "vitals")
      return VITALS_TARGETS.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ));
    if (category === "progression")
      return PROGRESSION_TARGETS.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ));
    return (
      <option value="" disabled>
        -- SELECIONE A CATEGORIA PRIMEIRO --
      </option>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`INJETAR ANOMALIA / EFEITO`}
    >
      <div className="flex flex-col gap-3 text-left">
        <div>
          <span className="text-[10px] mb-1 block text-[var(--theme-accent)] tracking-widest font-bold">
            DESCRIÇÃO (Ex: MIRA LASER, ADRENALINA)
          </span>
          <Input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="border border-[var(--theme-border)] p-2 bg-[var(--theme-background)]/80">
          <span className="text-[10px] mb-2 block text-[var(--theme-accent)] tracking-widest font-bold">
            CATEGORIA DO ALVO
          </span>
          <div className="flex flex-wrap gap-2 mb-2">
            <Checkbox
              label="ATT PRIM"
              checked={category === "attr_prim"}
              onChange={() => {
                setCategory("attr_prim");
                setTarget("");
              }}
            />
            <Checkbox
              label="ATT SEC"
              checked={category === "attr_sec"}
              onChange={() => {
                setCategory("attr_sec");
                setTarget("");
              }}
            />
            <Checkbox
              label="PERÍCIA"
              checked={category === "skill"}
              onChange={() => {
                setCategory("skill");
                setTarget("");
              }}
            />
            <Checkbox
              label="GLOB: ATTR"
              checked={category === "glob_attr"}
              onChange={() => {
                setCategory("glob_attr");
                setTarget("");
              }}
            />
            <Checkbox
              label="GLOB: SKILL"
              checked={category === "glob_skill"}
              onChange={() => {
                setCategory("glob_skill");
                setTarget("");
              }}
            />
            <Checkbox
              label="VITAIS"
              checked={category === "vitals"}
              onChange={() => {
                setCategory("vitals");
                setTarget("");
              }}
            />
            <Checkbox
              label="PROGRESSÃO"
              checked={category === "progression"}
              onChange={() => {
                setCategory("progression");
                setTarget("");
              }}
            />
          </div>
          <span className="text-[10px] mb-1 mt-2 block text-[var(--theme-accent)] tracking-widest font-bold">
            ALVO ESPECÍFICO
          </span>
          <select
            value={target || ""}
            onChange={(e) => setTarget(e.target.value as CustomEffectTarget)}
            className="w-full bg-[var(--theme-background)] text-[var(--theme-accent)] border border-[var(--theme-border)] p-1.5 outline-none text-xs font-mono uppercase"
          >
            <option value="">-- SELECIONE --</option>
            {renderTargetOptions()}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] mb-1 block text-[var(--theme-accent)] tracking-widest font-bold">
              MODO DO EFEITO
            </span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as EffectMode)}
              className="w-full bg-[var(--theme-background)] text-[var(--theme-accent)] border border-[var(--theme-border)] p-1.5 outline-none text-xs font-mono uppercase disabled:opacity-50"
              disabled={allowedModes.length === 1}
            >
              <option value="">-- MODO --</option>
              {EFFECT_MODES.filter((m) => allowedModes.includes(m.value)).map(
                (m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <span className="text-[10px] mb-1 block text-[var(--theme-accent)] tracking-widest font-bold">
              VALOR (+/-)
            </span>
            <Input
              type="number"
              value={val}
              onChange={(e) => setVal(parseInt(e.target.value) || 0)}
              className="w-full"
            />
          </div>
        </div>

        {error && (
          <span className="text-[var(--theme-danger)] text-xs animate-pulse font-bold mt-1">
            {error}
          </span>
        )}

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="danger" onClick={onClose}>
            CANCELAR
          </Button>
          <Button variant="primary" onClick={handleInject}>
            CONFIRMAR
          </Button>
        </div>
      </div>
    </Modal>
  );
}
