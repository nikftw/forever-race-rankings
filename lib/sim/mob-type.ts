export const MOB_TYPES = [
  "Unknown",
  "Beast",
  "Demon",
  "Dragonkin",
  "Elemental",
  "Giant",
  "Humanoid",
  "Mechanical",
  "Undead",
] as const;

export type MobTypeName = (typeof MOB_TYPES)[number];

export function isMobType(value: string): value is MobTypeName {
  return (MOB_TYPES as readonly string[]).includes(value);
}

export function asMobType(value: string): MobTypeName {
  return isMobType(value) ? value : "Demon";
}

export function mobTypeLabel(mob: MobTypeName): string {
  switch (mob) {
    case "Unknown":
      return "None";
    case "Beast":
    case "Demon":
    case "Dragonkin":
    case "Elemental":
    case "Giant":
    case "Humanoid":
    case "Mechanical":
    case "Undead":
      return mob;
    default: {
      const exhaustive: never = mob;
      return exhaustive;
    }
  }
}

export function dummyRacialNote(mob: MobTypeName): string {
  switch (mob) {
    case "Beast":
      return "Troll Beast Slaying and Dwarf Big Game Hunter are scoring (+5% vs Beasts).";
    case "Elemental":
      return "Skyborne Elemental Insight is scoring (+5% vs Elementals).";
    case "Demon":
    case "Unknown":
    case "Dragonkin":
    case "Giant":
    case "Humanoid":
    case "Mechanical":
    case "Undead":
      return `Beast Slaying, Big Game Hunter, and Elemental Insight are off on this ${mobTypeLabel(mob)} dummy.`;
    default: {
      const exhaustive: never = mob;
      return exhaustive;
    }
  }
}
