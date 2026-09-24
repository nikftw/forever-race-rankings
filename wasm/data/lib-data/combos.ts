import { RACES } from "@/lib/data/races";
import { SPECS } from "@/lib/data/specs";
import { assertNever, type RaceId, type SpecId, type WowClass } from "@/lib/types";

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

export const BOARD_ROWS: SpecId[][] = [
  ["warrior-fury", "warrior-arms"],
  ["rogue-combat", "rogue-assassination"],
  ["shaman-enhance", "druid-feral", "paladin-ret"],
  ["hunter-survival", "hunter-mm", "hunter-bm"],
  ["shaman-ele", "druid-balance", "priest-shadow"],
  ["mage-fire", "mage-frostfire", "mage-arcane"],
  ["warlock-affliction", "warlock-demo", "warlock-destro"],
  ["warrior-prot", "paladin-prot"],
  ["druid-bear"],
];

export const WOW_CLASSES: WowClass[] = flattenWowClasses();

assertBoardRows(BOARD_ROWS);

function flattenWowClasses(): WowClass[] {
  const leftover: Record<WowClass, boolean> = {
    warrior: true,
    paladin: true,
    hunter: true,
    rogue: true,
    shaman: true,
    priest: true,
    mage: true,
    warlock: true,
    druid: true,
  };
  const flat: WowClass[] = [];
  for (const wowClass of Object.keys(leftover) as WowClass[]) {
    leftover[wowClass] = false;
    flat.push(wowClass);
  }
  return flat;
}

function assertBoardRows(rows: SpecId[][]): void {
  const leftover = new Map<string, boolean>();
  for (const spec of SPECS) {
    if (spec.needsOverride) {
      continue;
    }
    leftover.set(spec.id, true);
  }
  for (const row of rows) {
    for (const specId of row) {
      if (!leftover.get(specId)) {
        throw new Error(`duplicate or unknown board spec ${specId}`);
      }
      leftover.set(specId, false);
    }
  }
  for (const [specId, pending] of leftover) {
    if (pending) {
      throw new Error(`board rows missing ${specId}`);
    }
  }
}

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
