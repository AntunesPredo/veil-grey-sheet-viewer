import type { InstantActionTarget } from "../types/veil-grey";

export const INSTANT_ACTION_TARGETS: {
  value: InstantActionTarget;
  label: string;
}[] = [
  { value: "HP_HEAL", label: "PONTOS DE VIDA (+ CURA)" },
  { value: "HP_DRAIN", label: "PONTOS DE VIDA (- DANO)" },
  { value: "HP_TEMP", label: "VIDA TEMPORÁRIA (+ TEMP HP)" },
  { value: "ENERGY_STAGE_RESTORE", label: "ENERGIA (+1 ESTÁGIO)" },
  { value: "ENERGY_STAGE_DRAIN", label: "ENERGIA (-1 ESTÁGIO)" },
  { value: "ENERGY_USES_RESTORE", label: "ENERGIA (+ USOS DE BATERIA)" },
  { value: "ENERGY_USES_DRAIN", label: "ENERGIA (- USOS DE BATERIA)" },
  { value: "SUSTENANCE_ADD", label: "ALIMENTAÇÃO (+ SACIEDADE)" },
  { value: "SUSTENANCE_DRAIN", label: "ALIMENTAÇÃO (- SACIEDADE)" },
  { value: "INSANITY_ADD", label: "LOUCURA (+ SUCUMBIR)" },
  { value: "INSANITY_DRAIN", label: "LOUCURA (- RECENTRALIZAR)" },
  { value: "EVILNESS_ADD", label: "MALDADE (+ CORRUPÇÃO)" },
  { value: "EVILNESS_SUB", label: "MALDADE (- REDENÇÃO)" },
];
