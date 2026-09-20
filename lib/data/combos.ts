import { RACES } from "@/lib/data/races";
import { assertNever, type RaceId, type WowClass } from "@/lib/types";

const CLASS_RACES: Record<WowClass, RaceId[]> = {
  warrior: [
    "orc",
    "undead",
    "tauren",
    "troll",
    "windshaper",
    "human",
    "dwarf",
    "nightelf",
    "gnome",
    "highorder",
  ],
  paladin: ["undead", "human", "dwarf"],
  hunter: [
    "orc",
    "tauren",
    "troll",
    "windshaper",
    "human",
    "dwarf",
    "nightelf",
    "highorder",
  ],
  rogue: [
    "orc",
    "undead",
    "troll",
    "windshaper",
    "human",
    "dwarf",
    "nightelf",
    "gnome",
    "highorder",
  ],
  priest: ["undead", "troll", "human", "dwarf", "nightelf", "gnome"],
  shaman: ["orc", "tauren", "troll", "windshaper", "dwarf"],
  mage: ["orc", "undead", "troll", "human", "gnome", "highorder"],
  warlock: ["orc", "undead", "troll", "human", "gnome"],
  druid: ["tauren", "windshaper", "nightelf", "highorder"],
};

export const WOW_CLASSES: WowClass[] = [
  "warrior",
  "paladin",
  "hunter",
  "rogue",
  "shaman",
  "druid",
  "mage",
  "warlock",
  "priest",
];

export function classLabel(wowClass: WowClass): string {
  switch (wowClass) {
    case "warrior":
      return "Warrior";
    case "paladin":
      return "Paladin";
    case "hunter":
      return "Hunter";
    case "rogue":
      return "Rogue";
    case "priest":
      return "Priest";
    case "shaman":
      return "Shaman";
    case "mage":
      return "Mage";
    case "warlock":
      return "Warlock";
    case "druid":
      return "Druid";
    default:
      return assertNever(wowClass, "class");
  }
}

export function racesForClass(wowClass: WowClass): RaceId[] {
  return CLASS_RACES[wowClass];
}

export function isLegalCombo(wowClass: WowClass, raceId: RaceId): boolean {
  return CLASS_RACES[wowClass].includes(raceId);
}

export function legalRaceDefs(wowClass: WowClass) {
  return RACES.filter((race) => isLegalCombo(wowClass, race.id));
}
