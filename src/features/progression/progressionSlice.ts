import type { StateCreator } from "zustand";
import type { CharacterStore } from "../character/store";
import type {
  CreationStatus,
  Role,
  SnapshotStats,
  Disadvantage,
} from "../../shared/types/veil-grey";
import { VG_CONFIG } from "../../shared/config/system.config";
import { buildSustenanceStages } from "../../shared/utils/mathUtils";

export interface ProgressionSlice {
  name: string;
  level: number;
  xp: { current: number; max: number; usedXpLogs: string[] };
  usedInjectIds: string[];
  creationStatus: CreationStatus;
  sandboxMode: boolean;
  freePoints: { attributes: number; skills: number; specializations: number };
  role: Role | null;
  settings: { lockPoints: boolean; showRollDetails: boolean };
  lockedSnapshot: SnapshotStats | null;
  disadvantages: Disadvantage[];

  updateProgression: (data: Partial<ProgressionSlice>) => void;
  addXp: (amount: number, log?: string) => void;
  registerInjectId: (id: string) => void;
  triggerLevelUp: () => void;
  confirmDistribution: () => void;
  updateCreationStatus: (status: CreationStatus) => void;
  confirmRoleSelection: (
    roleId: keyof typeof VG_CONFIG.roles,
    allocatedPoints: Record<string, number>,
  ) => void;
  confirmDisadvantages: (
    flaws: Disadvantage[],
    attrPoints: number,
    skillPoints: number,
  ) => void;
}

export const createProgressionSlice: StateCreator<
  CharacterStore,
  [],
  [],
  ProgressionSlice
> = (set, get) => ({
  name: "",
  level: 1,
  xp: { current: 0, max: 100, usedXpLogs: [] },
  usedInjectIds: [],
  creationStatus: "NOT_STARTED",
  sandboxMode: false,
  freePoints: { attributes: 0, skills: 0, specializations: 0 },
  role: null,
  settings: { lockPoints: true, showRollDetails: true },
  lockedSnapshot: null,
  disadvantages: [],

  updateCreationStatus: (status) => set({ creationStatus: status }),

  updateProgression: (data) => {
    set((state) => ({ ...state, ...data }));
  },

  addXp: (amount, log) =>
    set((state) => {
      const updates = state;
      updates.xp = {
        ...state.xp,
        current: state.xp.current + amount,
        usedXpLogs: [...state.xp.usedXpLogs, ...(log ? [log] : [])],
      };
      return updates;
    }),

  registerInjectId: (id) =>
    set((state) => ({ usedInjectIds: [...state.usedInjectIds, id] })),

  triggerLevelUp: () => {
    set((state) => {
      const nextLevel = state.level + 1;
      const rewards =
        VG_CONFIG.progression.rewardsPerLevel[
          nextLevel as keyof typeof VG_CONFIG.progression.rewardsPerLevel
        ];

      return {
        creationStatus: "LEVEL_UP",
        settings: { ...state.settings, lockPoints: false },
        lockedSnapshot: {
          attributes: { ...state.attributes },
          skills: { ...state.skills },
        },
        freePoints: {
          attributes: state.freePoints.attributes + (rewards?.attr || 0),
          skills: state.freePoints.skills + (rewards?.skill || 0),
          specializations:
            state.freePoints.specializations + (rewards?.spec || 0),
        },
      };
    });
  },

  confirmDistribution: () => {
    const { attributes } = get();

    set((state) => {
      const isFirstSetup = state.creationStatus === "STARTED";
      const updates: Partial<CharacterStore> = {
        creationStatus: "CLOSED",
        settings: { ...state.settings, lockPoints: true },
        lockedSnapshot: null,
      };

      if (isFirstSetup) {
        const startHp = 65 + attributes.constitution * 4;

        const mass = attributes.strength + attributes.constitution;
        const maxSustenance = VG_CONFIG.rules.baseSustenance + mass;
        const sustanceStages = buildSustenanceStages(maxSustenance);

        const satiatedMax =
          sustanceStages[0] + sustanceStages[1] + sustanceStages[2] - 1;

        const agi = Math.floor(
          ((attributes.dexterity || 0) + (attributes.instinct || 0)) / 2,
        );
        const ap = 1 + Math.floor(agi / 3);
        const maxEnergy = (4 + ap) * 3;

        updates.hp = {
          ...state.hp,
          current: startHp,
          baseMax: startHp,
        };
        updates.crisis = { ...state.crisis, ignore: false };
        updates.sustenance = { ...state.sustenance, current: satiatedMax };
        updates.energy = { current: maxEnergy };
        updates.insanity = { ...state.insanity, current: 0 };
      }

      if (state.creationStatus === "LEVEL_UP") {
        updates.level = state.level + 1;
        updates.xp = {
          ...state.xp,
          current: state.xp.current - state.xp.max,
          max: (state.level + 1) * VG_CONFIG.progression.xpMultiplier,
        };
      }

      return updates;
    });
  },

  confirmRoleSelection: (roleId, allocatedPoints) => {
    const roleData = VG_CONFIG.roles[roleId];
    if (!roleData) return;

    set((state) => {
      const updates = { ...state };

      updates.role = {
        id: roleData.id,
        title: roleData.title,
        subtitle: roleData.subtitle,
        description: roleData.description,
        photoUrl: roleData.photoUrl,
        uniqueAbility: roleData.uniqueAbility,
      };

      Object.entries(roleData.initialStats.attributes).forEach(
        ([attr, val]) => {
          updates.attributes[attr as keyof typeof updates.attributes] =
            val as number;
        },
      );

      roleData.initialStats.baseSkills.forEach((skill: string) => {
        updates.skills[skill as keyof typeof updates.skills] = 1;
      });

      Object.entries(allocatedPoints).forEach(([skill, val]) => {
        updates.skills[skill as keyof typeof updates.skills] += val;
      });

      updates.freePoints = {
        attributes: VG_CONFIG.rules.characterCreation.initialAttributePoints,
        skills: VG_CONFIG.rules.characterCreation.initialSkillPoints,
        specializations: 0,
      };

      updates.creationStatus = "FLAWS_SELECTION";
      updates.crisis.ignore = true;

      updates.settings = { ...state.settings, lockPoints: false };
      updates.lockedSnapshot = {
        attributes: { ...state.attributes },
        skills: { ...state.skills },
      };

      return updates;
    });
  },

  confirmDisadvantages: (flaws, attrPoints, skillPoints) => {
    set((state) => {
      const allEffects = flaws.flatMap((f) =>
        f.effects.map((e) => ({ ...e, id: Date.now() + Math.random() })),
      );

      const hasVolatilePsyche = flaws.some((f) => f.id === "psique_volatil");

      return {
        disadvantages: flaws,
        customEffects: [...state.customEffects, ...allEffects],
        freePoints: {
          ...state.freePoints,
          attributes: state.freePoints.attributes + attrPoints,
          skills: state.freePoints.skills + skillPoints,
        },
        insanity: {
          ...state.insanity,
          volatile: hasVolatilePsyche ? true : state.insanity.volatile,
        },
        creationStatus: "STARTED",
      };
    });
  },
});
