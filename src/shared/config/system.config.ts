import { SYSTEM_DISADVANTAGES } from "./disadvantages";
import { PLAYER_ROLES } from "./roles";
import { SKILLS } from "./skills";

export const VG_CONFIG = {
  rules: {
    mainDice: "1d20",
    attrMin: 0,
    attrMax: 10,
    skillMin: 0,
    skillMax: 5,
    evilnessMin: 0,
    evilnessMax: 10,
    baseHp: 65,
    hpPerCon: 0,
    baseLoad: 10,
    baseInsanity: 3,
    baseSustenance: 4,
    thresholdInjured: 50,
    thresholdCrit: 25,
    movementMin: 1,
    collapseBaseDC: 13,
    collapseFailPenalty: 2,
    deathBaseDC: 13,
    deathFailPenalty: 2,
    starvationHpDamagePerPoint: 12,
    minMeleeAttack: 5,
    constitutionTempHpMultiPerNutricion: 4,
    characterCreation: {
      skillPointsGranted: 1,
      skillPointsToDistribute: 2,
      initialAttributePoints: 6,
      initialSkillPoints: 5,
    },
  },
  progression: {
    xpMultiplier: 100, // current level * 100
    tiers: [
      { minLevel: 1, maxAttr: 5, maxSkill: 3 },
      { minLevel: 4, maxAttr: 7, maxSkill: 6 },
      { minLevel: 9, maxAttr: 10, maxSkill: 8 },
    ],
    rewardsPerLevel: {
      1: { attr: 1, skill: 2, spec: 0 },
      2: { attr: 1, skill: 2, spec: 0 },
      3: { attr: 1, skill: 2, spec: 1 },
      4: { attr: 1, skill: 2, spec: 0 },
      5: { attr: 1, skill: 2, spec: 0 },
      6: { attr: 1, skill: 2, spec: 1 },
      7: { attr: 1, skill: 2, spec: 0 },
      8: { attr: 1, skill: 2, spec: 0 },
      9: { attr: 1, skill: 2, spec: 0 },
      10: { attr: 1, skill: 2, spec: 1 },
      11: { attr: 1, skill: 2, spec: 0 },
      12: { attr: 1, skill: 2, spec: 0 },
      13: { attr: 1, skill: 2, spec: 0 },
      14: { attr: 1, skill: 2, spec: 0 },
      15: { attr: 1, skill: 2, spec: 1 },
      16: { attr: 1, skill: 2, spec: 0 },
    },
  },
  roles: PLAYER_ROLES,
  disadvantages: SYSTEM_DISADVANTAGES,
  labels: {
    evilness: "MALDADE",
    evilnessLabel: "(0-10)",
    btnRoll: "ROLL",
  },
  att_groups: {
    physical: {
      label: "FÍSICOS",
      rollCategory: "ATT_PHYSICAL",
      atributes: {
        strength: {
          id: "strength",
          label: "FORÇA",
          short: "FOR",
        },
        constitution: {
          id: "constitution",
          label: "CONSTITUIÇÃO",
          short: "CON",
        },
        dexterity: {
          id: "dexterity",
          label: "DESTREZA",
          short: "DES",
        },
      },
    },
    mental: {
      label: "MENTAIS",
      rollCategory: "ATT_MENTAL",
      atributes: {
        wisdom: {
          id: "wisdom",
          label: "SABEDORIA",
          short: "SAB",
        },
        intelligence: {
          id: "intelligence",
          label: "INTELIGÊNCIA",
          short: "INT",
        },
        instinct: {
          id: "instinct",
          label: "INSTINTO",
          short: "INS",
        },
      },
    },
    social: {
      label: "SOCIAIS",
      rollCategory: "ATT_SOCIAL",
      atributes: {
        charisma: {
          id: "charisma",
          label: "CARISMA",
          short: "CAR",
        },
        manipulation: {
          id: "manipulation",
          label: "MANIPULAÇÃO",
          short: "MAN",
        },
      },
    },
  },
  att_secondary: {
    agility: {
      id: "agility",
      label: "AGILIDADE",
      rollCategory: "ATT_PHYSICAL",
    },
    mass: {
      id: "mass",
      label: "MASSA CORPÓREA",
      rollCategory: "ATT_PHYSICAL",
    },
    perception: {
      id: "perception",
      label: "PERCEPÇÃO",
      rollCategory: "ATT_MENTAL",
    },
    mental_health: {
      id: "mental_healt",
      label: "SAÚDE MENTAL",
      rollCategory: "ATT_MENTAL",
    },
  },
  skill_groups: {
    physical: {
      label: "FÍSICO",
      rollCategory: "SKILL_PHYSICAL",
      skills: SKILLS.PHYSICAL,
    },
    mental: {
      label: "MENTAL",
      rollCategory: "SKILL_MENTAL",
      skills: SKILLS.MENTAL,
    },
    social: {
      label: "SOCIAL",
      rollCategory: "SKILL_SOCIAL",
      skills: SKILLS.SOCIAL,
    },
  },
} as const;
