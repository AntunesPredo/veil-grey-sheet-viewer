import { VG_CONFIG } from "../config/system.config";

export type AttributeCategory =
  | typeof VG_CONFIG.att_groups.physical.rollCategory
  | typeof VG_CONFIG.att_groups.mental.rollCategory
  | typeof VG_CONFIG.att_groups.social.rollCategory;

export type SkillCategory =
  | typeof VG_CONFIG.skill_groups.physical.rollCategory
  | typeof VG_CONFIG.skill_groups.mental.rollCategory
  | typeof VG_CONFIG.skill_groups.social.rollCategory;

export type RollCategory = AttributeCategory | SkillCategory;

// ATT
type PhysicalAtts = keyof typeof VG_CONFIG.att_groups.physical.atributes;
type MentalAtts = keyof typeof VG_CONFIG.att_groups.mental.atributes;
type SocialAtts = keyof typeof VG_CONFIG.att_groups.social.atributes;

export type Attribute = PhysicalAtts | MentalAtts | SocialAtts;

// SECONDARY ATT
export type SecondaryAttribute = keyof typeof VG_CONFIG.att_secondary;

// SKILLS
type PhysicalSkills = keyof typeof VG_CONFIG.skill_groups.physical.skills;
type MentalSkills = keyof typeof VG_CONFIG.skill_groups.mental.skills;
type SocialSkills = keyof typeof VG_CONFIG.skill_groups.social.skills;

export type Skill = PhysicalSkills | MentalSkills | SocialSkills;

// OTHER SYSTEM TYPES
export type CreationStatus =
  | "NOT_STARTED"
  | "PRE_STARTED"
  | "FLAWS_SELECTION"
  | "STARTED"
  | "LEVEL_UP"
  | "CLOSED";

export interface Disadvantage {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  effects: CustomEffect[];
}

export type EnergyState = "RESTED" | "TIRED" | "EXHAUSTED";
export type SustenanceState = "STARVING" | "HUNGRY" | "SATIATED" | "FULL";
export type InsanityState = "STABLE" | "UNSTABLE" | "INSANE";
export type CrisisState = "COLLAPSE" | "DEATH" | null;

export type CustomEffectTarget =
  | RollCategory
  | "FREE_ATTR"
  | "FREE_SKILL"
  | "HP"
  | "INSANITY"
  | "SUSTENANCE"
  | "MOVEMENT"
  | "ACTION_POINTS"
  | "REACTIONS"
  | Attribute
  | SecondaryAttribute
  | Skill;

export interface UniqueAbility {
  title: string;
  description: string;
}

export interface Role {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  photoUrl?: string | URL;
  uniqueAbility: UniqueAbility;
}

export type InstantActionTarget =
  | "HP_HEAL"
  | "HP_DRAIN"
  | "HP_TEMP"
  | "ENERGY_STAGE_RESTORE"
  | "ENERGY_STAGE_DRAIN"
  | "ENERGY_USES_RESTORE"
  | "ENERGY_USES_DRAIN"
  | "SUSTENANCE_ADD"
  | "SUSTENANCE_DRAIN"
  | "INSANITY_ADD"
  | "INSANITY_DRAIN"
  | "EVILNESS_ADD"
  | "EVILNESS_SUB";

export interface InstantAction {
  id: string;
  target: InstantActionTarget;
  val: number;
  description: string;
}

export type EffectMode = "FIXED" | "OPTIONAL" | "TEMP" | "BONUS";

export interface CustomEffect {
  id: number;
  target: CustomEffectTarget;
  description: string;
  mode: EffectMode;
  link: number | string | null;
  val: number;
  isAccounted?: boolean;
}

export type ItemType =
  | "MATERIAL"
  | "CONSUMABLE"
  | "RECHARGEABLE"
  | "ACTIVE"
  | "KIT"
  | "CONTAINER"
  | "EQUIPABLE";

export type WeaponRange =
  | "QUEIMA-ROUPA"
  | "CURTÍSSIMO"
  | "CURTO"
  | "MÉDIO"
  | "LONGO";

export type WeaponScaling = "S" | "A" | "B" | "C" | "D" | "NONE";

export interface CombatProps {
  weaponType: "MELEE" | "RANGED" | "NONE";
  baseDamage: number;
  range: WeaponRange;
  baseDifficulty: number;
  scalingAttr: Attribute | null;
  scalingTier: WeaponScaling;
}

export interface BaseItem {
  id: number;
  name: string;
  description: string;
  svgId: string;
  quantity: number;
  slots: number;
  isCarried: boolean;
  isEquipped: boolean;
  parentId: number | null;
  drawer: string | null;
  effects: CustomEffect[];
  type: ItemType;
}

export interface MaterialItem extends BaseItem {
  type: "MATERIAL";
}

export interface ConsumableItem extends BaseItem {
  type: "CONSUMABLE";
  uses: number;
  maxUses: number;
  commsType: string;
  instantActions: InstantAction[];
  bonusDamage?: number;
}

export interface RechargeableItem extends BaseItem {
  type: "RECHARGEABLE";
  uses: number;
  maxUses: number;
  commsType: string;
  perItemSlotReduction: number;
}

export interface ActiveItem extends BaseItem {
  type: "ACTIVE";
  uses: number;
  maxUses: number;
  quality: number;
  condition: number;
  commsType: string;
  requiresAmmo: boolean;
  skillId: Skill | null;
  combatProps?: CombatProps;
}

export interface KitItem extends BaseItem {
  type: "KIT";
  uses: number;
  maxUses: number;
  skillId: Skill | null;
  commsType: string;
}

export interface ContainerItem extends BaseItem {
  type: "CONTAINER";
  containerProps: {
    slotReduction: number;
    slotCapacity: number;
    drawers?: string[];
  };
}

export interface EquipableItem extends BaseItem {
  type: "EQUIPABLE";
  containerProps?: {
    slotReduction: number;
    slotCapacity: number;
    drawers?: string[];
  };
  armorProps?: {
    pe: number;
    maxPe: number;
    rd: number;
  };
}

export type Item =
  | MaterialItem
  | ConsumableItem
  | RechargeableItem
  | ActiveItem
  | KitItem
  | ContainerItem
  | EquipableItem;

export interface Note {
  id: number;
  title: string;
  content: string;
  isEditing: boolean;
  height: number;
}

export interface SnapshotStats {
  attributes: Record<Attribute, number>;
  skills: Record<Skill, number>;
}

export interface SkillData {
  label: string;
  bases: string[];
  id: string;
  groupLabel?: string;
  description: string;
}
