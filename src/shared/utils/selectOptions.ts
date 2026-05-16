import type {
  EffectMode,
  WeaponRange,
  WeaponScaling,
  ItemType,
} from "../types/veil-grey";

export const EFFECT_MODES: { value: EffectMode; label: string }[] = [
  { value: "FIXED", label: "FIXO" },
  { value: "BONUS", label: "BÔNUS" },
  { value: "OPTIONAL", label: "OPCIONAL" },
  { value: "TEMP", label: "TEMPORÁRIO" },
];

export const GLOBAL_ATTR_TARGETS = [
  { value: "ATT_PHYSICAL", label: "FÍSICO (ATTR)" },
  { value: "ATT_MENTAL", label: "MENTAL (ATTR)" },
  { value: "ATT_SOCIAL", label: "SOCIAL (ATTR)" },
];

export const GLOBAL_SKILL_TARGETS = [
  { value: "SKILL_PHYSICAL", label: "FÍSICO (SKILL)" },
  { value: "SKILL_MENTAL", label: "MENTAL (SKILL)" },
  { value: "SKILL_SOCIAL", label: "SOCIAL (SKILL)" },
];

export const VITALS_TARGETS = [
  { value: "HP", label: "PONTOS DE VIDA (HP)" },
  { value: "INSANITY", label: "LOUCURA" },
  { value: "MOVEMENT", label: "MOVIMENTO (MOV)" },
  { value: "ACTION_POINTS", label: "PONTOS DE AÇÃO (AP)" },
  { value: "REACTIONS", label: "REAÇÕES (RCT)" },
];

export const PROGRESSION_TARGETS = [
  { value: "FREE_ATTR", label: "PONTOS LIVRES (ATTR)" },
  { value: "FREE_SKILL", label: "PONTOS LIVRES (SKILL)" },
];

export const WEAPON_TYPES = [
  { value: "MELEE", label: "CORPO-A-CORPO" },
  { value: "RANGED", label: "À DISTÂNCIA" },
];

export const WEAPON_RANGES: { value: WeaponRange; label: string }[] = [
  { value: "QUEIMA-ROUPA", label: "QUEIMA-ROUPA" },
  { value: "CURTÍSSIMO", label: "CURTÍSSIMO" },
  { value: "CURTO", label: "CURTO" },
  { value: "MÉDIO", label: "MÉDIO" },
  { value: "LONGO", label: "LONGO" },
];

export const WEAPON_SCALINGS: { value: WeaponScaling; label: string }[] = [
  { value: "NONE", label: "NENHUMA" },
  { value: "S", label: "S" },
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
];

export const ITEM_QUALITIES = [
  { value: 8, label: "ALTA" },
  { value: 4, label: "MÉDIA" },
  { value: 2.5, label: "BAIXA" },
];

export const REST_DIFFICULTIES = [
  { value: 10, label: "FÁCIL (Área Segura) - DC 10" },
  { value: 15, label: "MÉDIO (Área Selvagem) - DC 15" },
  { value: 20, label: "DIFÍCIL (Zona de Perigo) - DC 20" },
];

export const ITEM_TYPES: { id: ItemType; label: string; desc: string }[] = [
  {
    id: "MATERIAL",
    label: "MATERIAL",
    desc: "Peças, componentes ou cosméticos.",
  },
  {
    id: "CONSUMABLE",
    label: "CONSUMÍVEL",
    desc: "Itens de uso (munição, remédio).",
  },
  {
    id: "RECHARGEABLE",
    label: "RECARREGÁVEL",
    desc: "Carrega consumíveis (pente, cantil).",
  },
  {
    id: "ACTIVE",
    label: "ATIVO",
    desc: "Ferramentas ou Armas com limiar de uso.",
  },
  { id: "KIT", label: "KIT", desc: "Atrelado a perícias. Usa consumíveis." },
  { id: "CONTAINER", label: "CONTÊINER", desc: "Guarda itens e reduz peso." },
  {
    id: "EQUIPABLE",
    label: "EQUIPÁVEL",
    desc: "Pode ser vestido (colete, mochila).",
  },
];
