export type Faction = "horde" | "alliance";

export type RaceId =
  | "orc"
  | "undead"
  | "tauren"
  | "troll"
  | "windshaper"
  | "human"
  | "dwarf"
  | "nightelf"
  | "gnome"
  | "highorder";

export type WowClass =
  | "warrior"
  | "paladin"
  | "hunter"
  | "rogue"
  | "priest"
  | "shaman"
  | "mage"
  | "warlock"
  | "druid";

export type WeaponFamily =
  | "axe"
  | "mace"
  | "sword"
  | "dagger"
  | "staff"
  | "ranged"
  | "none";

export type Role = "dps" | "heal" | "tank";

export type DamageSchool = "physical" | "spell" | "hybrid";

export type SourceKey =
  | "talentsforever"
  | "wowhead"
  | "icyveins"
  | "wowsod"
  | "wowsims";

export type WowsimsAlignment = "aligned" | "misaligned" | "missing";

export type EngineEffect =
  | {
      kind: "apSpPercentWindow";
      percent: number;
      durationSec: number;
      cooldownSec: number;
    }
  | {
      kind: "hastePercentWindow";
      percent: number;
      durationSec: number;
      cooldownSec: number;
    }
  | {
      kind: "critPercentWindow";
      percent: number;
      durationSec: number;
      cooldownSec: number;
    }
  | {
      kind: "weaponCrit";
      weapon: WeaponFamily;
      critPct: number;
    }
  | {
      kind: "hastePassive";
      percent: number;
    }
  | {
      kind: "hitPassive";
      percent: number;
    }
  | {
      kind: "eureka";
      damageBonus: number;
      abilities: number;
      cooldownSec: number;
    }
  | {
      kind: "touchOfTheGrave";
      casterChance: number;
      meleeChance: number;
      maxHpFraction: number;
      icdSec: number;
    }
  | {
      kind: "starshards";
      extraDps: number;
    }
  | {
      kind: "spiritPercent";
      percent: number;
    }
  | {
      kind: "resourcePercent";
      percent: number;
    }
  | {
      kind: "beastDamage";
      percent: number;
    }
  | {
      kind: "elementalDamage";
      percent: number;
    };

export type SpecId = string;

export function assertNever(value: never, label: string): never {
  throw new Error(`unhandled ${label}: ${String(value)}`);
}
