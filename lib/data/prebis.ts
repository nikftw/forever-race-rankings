import type { Role } from "@/lib/types";

export type KitItem = {
  slot: string;
  name: string;
  source: "classic-filler" | "visible-forever";
  note?: string;
};

export type StatBlock = {
  attackPower: number;
  spellPower: number;
  weaponDps: number;
  hitPct: number;
  critPct: number;
  hastePct: number;
  stamina: number;
  health: number;
};

export type PrebisKit = {
  id: string;
  label: string;
  armor: "plate" | "mail" | "leather" | "cloth" | "none";
  stats: StatBlock;
  items: KitItem[];
};

const CLASSIC = "classic-filler" as const;

function kit(def: PrebisKit): PrebisKit {
  return def;
}

const plateMelee = kit({
  id: "plate-melee",
  label: "Level 60 plate melee pre-raid (Classic dungeon/crafted stand-in)",
  armor: "plate",
  stats: {
    attackPower: 980,
    spellPower: 0,
    weaponDps: 58,
    hitPct: 0.06,
    critPct: 0.11,
    hastePct: 0,
    stamina: 290,
    health: 4680,
  },
  items: [
    { slot: "Head", name: "Lionheart Helm", source: CLASSIC },
    { slot: "Neck", name: "Mark of Fordring", source: CLASSIC },
    { slot: "Shoulder", name: "Black Dragonscale Shoulders", source: CLASSIC },
    { slot: "Back", name: "Cape of the Black Baron", source: CLASSIC },
    { slot: "Chest", name: "Savage Gladiator Chain / Breastplate", source: CLASSIC },
    { slot: "Wrist", name: "Battleborn Armbraces", source: CLASSIC },
    { slot: "Hands", name: "Devilsaur Gauntlets", source: CLASSIC },
    { slot: "Waist", name: "Omokk's Girth Restrainer", source: CLASSIC },
    { slot: "Legs", name: "Devilsaur Leggings", source: CLASSIC },
    { slot: "Feet", name: "Battlechaser's Greaves", source: CLASSIC },
    { slot: "Ring", name: "Blackstone Ring", source: CLASSIC },
    { slot: "Ring", name: "Painweaver Band", source: CLASSIC },
    { slot: "Trinket", name: "Hand of Justice", source: CLASSIC },
    { slot: "Trinket", name: "Blackhand's Breadth", source: CLASSIC },
    {
      slot: "Weapon",
      name: "Spec weapon family (Felstriker / Assassination Blade / Ironfoe stand-in)",
      source: CLASSIC,
      note: "Weapon type follows the race's matching racial when the spec allows it.",
    },
  ],
});

const plateTwoHand = kit({
  ...plateMelee,
  id: "plate-2h",
  label: "Level 60 plate 2H pre-raid (Classic dungeon/crafted stand-in)",
  stats: { ...plateMelee.stats, weaponDps: 82, attackPower: 940 },
});

const mailMelee = kit({
  id: "mail-melee",
  label: "Level 60 mail melee pre-raid (Classic dungeon/crafted stand-in)",
  armor: "mail",
  stats: {
    attackPower: 860,
    spellPower: 120,
    weaponDps: 54,
    hitPct: 0.05,
    critPct: 0.1,
    hastePct: 0,
    stamina: 250,
    health: 4200,
  },
  items: [
    { slot: "Head", name: "Crown of Destruction", source: CLASSIC },
    { slot: "Chest", name: "Savage Gladiator Chain", source: CLASSIC },
    { slot: "Hands", name: "Devilsaur Gauntlets", source: CLASSIC },
    { slot: "Legs", name: "Devilsaur Leggings", source: CLASSIC },
    { slot: "Weapon", name: "DW axe/mace per racial", source: CLASSIC },
  ],
});

const mailRanged = kit({
  id: "mail-ranged",
  label: "Level 60 hunter pre-raid (Classic dungeon/crafted stand-in)",
  armor: "mail",
  stats: {
    attackPower: 1020,
    spellPower: 0,
    weaponDps: 62,
    hitPct: 0.06,
    critPct: 0.12,
    hastePct: 0,
    stamina: 240,
    health: 4100,
  },
  items: [
    { slot: "Ranged", name: "Blastershot Launcher / Blackcrow stand-in", source: CLASSIC },
    { slot: "Trinket", name: "Blackhand's Breadth", source: CLASSIC },
    { slot: "Set", name: "Devilsaur + Beaststalker mix", source: CLASSIC },
  ],
});

const leatherMelee = kit({
  id: "leather-melee",
  label: "Level 60 leather melee pre-raid (Classic dungeon/crafted stand-in)",
  armor: "leather",
  stats: {
    attackPower: 900,
    spellPower: 0,
    weaponDps: 52,
    hitPct: 0.06,
    critPct: 0.13,
    hastePct: 0,
    stamina: 220,
    health: 3900,
  },
  items: [
    { slot: "Head", name: "Mask of the Unforgiven", source: CLASSIC },
    { slot: "Hands", name: "Devilsaur Gauntlets", source: CLASSIC },
    { slot: "Legs", name: "Devilsaur Leggings", source: CLASSIC },
    { slot: "Trinket", name: "Hand of Justice", source: CLASSIC },
    { slot: "Weapon", name: "Combat swords / Assassination daggers", source: CLASSIC },
  ],
});

const clothCaster = kit({
  id: "cloth-caster",
  label: "Level 60 cloth DPS pre-raid (Classic dungeon/crafted stand-in)",
  armor: "cloth",
  stats: {
    attackPower: 0,
    spellPower: 520,
    weaponDps: 41,
    hitPct: 0.06,
    critPct: 0.08,
    hastePct: 0,
    stamina: 180,
    health: 3400,
  },
  items: [
    { slot: "Head", name: "Green Lens / Twilight Cultist stand-in", source: CLASSIC },
    { slot: "Chest", name: "Robe of the Void / Truefaith", source: CLASSIC },
    { slot: "Weapon", name: "Staff of Dominance / Sageblade stand-in", source: CLASSIC },
    { slot: "Trinket", name: "Briarwood Reed", source: CLASSIC },
  ],
});

const clothHeal = kit({
  id: "cloth-heal",
  label: "Level 60 cloth healer pre-raid (Classic dungeon/crafted stand-in)",
  armor: "cloth",
  stats: {
    attackPower: 0,
    spellPower: 480,
    weaponDps: 38,
    hitPct: 0.03,
    critPct: 0.07,
    hastePct: 0,
    stamina: 200,
    health: 3600,
  },
  items: [
    { slot: "Chest", name: "Truefaith Vestments / Vestments of the Virtuous", source: CLASSIC },
    { slot: "Weapon", name: "Benediction / staff stand-in", source: CLASSIC },
  ],
});

const leatherCaster = kit({
  id: "leather-caster",
  label: "Level 60 leather caster pre-raid (Classic dungeon/crafted stand-in)",
  armor: "leather",
  stats: {
    attackPower: 0,
    spellPower: 430,
    weaponDps: 40,
    hitPct: 0.05,
    critPct: 0.08,
    hastePct: 0,
    stamina: 200,
    health: 3700,
  },
  items: [
    { slot: "Chest", name: "Cenarion / Wildheart mix", source: CLASSIC },
    { slot: "Weapon", name: "Staff of Dominance stand-in", source: CLASSIC },
  ],
});

const feralKit = kit({
  id: "feral",
  label: "Level 60 feral pre-raid (Classic dungeon/crafted stand-in)",
  armor: "leather",
  stats: {
    attackPower: 1100,
    spellPower: 0,
    weaponDps: 0,
    hitPct: 0.06,
    critPct: 0.12,
    hastePct: 0,
    stamina: 260,
    health: 4400,
  },
  items: [
    { slot: "Idol", name: "Idol of Brutality stand-in", source: CLASSIC },
    { slot: "Set", name: "Devilsaur + Wolfshead Helm", source: CLASSIC },
  ],
});

export const KITS = {
  plateMelee,
  plateTwoHand,
  mailMelee,
  mailRanged,
  leatherMelee,
  clothCaster,
  clothHeal,
  leatherCaster,
  feralKit,
};

export function kitForSpec(specId: string, role: Role): PrebisKit {
  if (specId === "warrior-arms" || specId === "paladin-ret") {
    return plateTwoHand;
  }
  if (
    specId === "warrior-fury" ||
    specId === "warrior-prot" ||
    specId === "paladin-prot"
  ) {
    return plateMelee;
  }
  if (specId.startsWith("hunter-")) {
    return mailRanged;
  }
  if (specId === "shaman-enhance") {
    return mailMelee;
  }
  if (specId.startsWith("rogue-")) {
    return leatherMelee;
  }
  if (specId === "druid-feral" || specId === "druid-bear") {
    return feralKit;
  }
  if (specId === "druid-balance" || specId === "shaman-ele") {
    return leatherCaster;
  }
  if (role === "heal") {
    return clothHeal;
  }
  return clothCaster;
}
