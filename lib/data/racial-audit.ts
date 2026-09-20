import type {
  EngineEffect,
  RaceId,
  SourceKey,
  WowsimsAlignment,
} from "@/lib/types";

export type RacialAuditRow = {
  id: string;
  raceId: RaceId | "priest";
  name: string;
  slot: "active" | "passive" | "class";
  sources: Record<SourceKey, string>;
  chosen: string;
  disputed: boolean;
  disputeNote?: string;
  wowsims: WowsimsAlignment;
  wowsimsNote: string;
  simUses: string;
  effect: EngineEffect | null;
};

export const AUDIT_META = {
  talentsforever:
    "talentsforever.com / wowforevertalent.com racials from Forever beta client 1.60.1.69876 (17–18 Sep 2026 export). Preferred source.",
  wowhead:
    "Wowhead Forever spell pages. Corroboration only — several pages still Classic.",
  icyveins:
    "Icy Veins racial rework article (BlizzCon 2026 demo). Corroboration only.",
  wowsod:
    "wowsod.pro Forever racials dump (BlizzCon demo + talentsforever CC BY 4.0). Corroboration only.",
  wowsims:
    "Combat is patched ElliotWood/Forever. wowsims/forever Classic leftovers are not used.",
};

function row(
  partial: RacialAuditRow,
): RacialAuditRow {
  return partial;
}

export const RACIAL_AUDIT: RacialAuditRow[] = [
  row({
    id: "orc-blood-fury",
    raceId: "orc",
    name: "Blood Fury",
    slot: "active",
    sources: {
      talentsforever:
        "Instant, 2 min. Increases Attack Power and Spell Power by 10% for 15 sec. Classic was 25% base melee AP with 50% healing taken penalty.",
      wowhead:
        "Forever spell 20572 tooltip: Increases Attack Power and Spell Power by 10% for 15 sec. Spell effects list 11% AP/RAP/SP (display quirk vs tooltip).",
      icyveins:
        "Increases Attack Power and Spell Power by 10% for 15 seconds. 2-minute cooldown.",
      wowsod:
        "Instant, 2 min cooldown. Increases Attack Power and Spell Power by 10% for 15 sec.",
      wowsims:
        "Classic: level-scaled flat AP (+4*level+2) and class-gated SP. Healing penalty era, not 10% AP+SP.",
    },
    chosen:
      "10% Attack Power and Spell Power for 15 sec / 2 min (tooltip text, not Wowhead's 11% effect bytes).",
    disputed: false,
    wowsims: "aligned",
    wowsimsNote:
      "ElliotWood: 10% current AP+SP for 15s / 2 min, off-GCD.",
    simUses: "apSpPercentWindow 10% / 15s / 120s",
    effect: {
      kind: "apSpPercentWindow",
      percent: 0.1,
      durationSec: 15,
      cooldownSec: 120,
    },
  }),
  row({
    id: "orc-shatter-curse",
    raceId: "orc",
    name: "Shatter Curse",
    slot: "active",
    sources: {
      talentsforever:
        "Instant, 3 min. Removes and grants immunity to all Curses and Banes, and reduces all Magical damage taken by 15% for 8 sec. Not in Classic.",
      wowhead: "Not in Wowhead Forever database at audit time (guide text only).",
      icyveins:
        "Become immune to Curses and Banes, and reduce Magic damage taken for 8 seconds. 3-minute cooldown.",
      wowsod:
        "Instant, 3 min. Removes and grants immunity to all Curses and Banes, and reduces all Magical damage taken by 15% for 8 sec.",
      wowsims: "Absent (Classic Orc has Command pet +5% instead).",
    },
    chosen: "Utility only. No Patchwerk DPS.",
    disputed: false,
    wowsims: "missing",
    wowsimsNote: "Not implemented; Classic Command is still in the sim.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "orc-axe-spec",
    raceId: "orc",
    name: "Axe Specialization",
    slot: "passive",
    sources: {
      talentsforever:
        "Increases your critical strike chance with all spells and abilities by 1% while an axe or two-handed axe is equipped. Classic was +5 weapon skill.",
      wowhead: "Guide: Axes increase spell and ability Critical Chance.",
      icyveins:
        "While wielding an Axe or Two-Handed Axe, increases spell and ability critical strike chance by 1%.",
      wowsod:
        "+1% critical strike chance with all spells and abilities while an axe or two-handed axe is equipped.",
      wowsims: "Classic expertise-on-axe, not 1% unified crit.",
    },
    chosen: "+1% crit while axe equipped.",
    disputed: false,
    wowsims: "aligned",
    wowsimsNote: "ElliotWood: +1% spell and ability crit while an axe is equipped.",
    simUses: "weaponCrit axe 1%",
    effect: { kind: "weaponCrit", weapon: "axe", critPct: 0.01 },
  }),
  row({
    id: "orc-hardiness",
    raceId: "orc",
    name: "Hardiness",
    slot: "passive",
    sources: {
      talentsforever:
        "Reduces the duration of Stun effects on you by 20%. Classic was 25% chance to resist stuns.",
      wowhead: "Guide: Stun durations decreased by 20%.",
      icyveins: "Stun duration reduced by 20%.",
      wowsod: "Stun duration reduced by 20%.",
      wowsims: "Not this effect; Classic Orc package instead.",
    },
    chosen: "Utility only.",
    disputed: false,
    wowsims: "misaligned",
    wowsimsNote: "Classic racial package, not 20% stun duration.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "orc-command",
    raceId: "orc",
    name: "Command (Classic trap)",
    slot: "passive",
    sources: {
      talentsforever: "Not in the four Forever racials.",
      wowhead: "Not listed on Forever Orc racials.",
      icyveins: "Removed.",
      wowsod: "Not listed.",
      wowsims: "Still applies +5% pet damage.",
    },
    chosen: "Rejected. Forever Orc does not have Command.",
    disputed: false,
    wowsims: "misaligned",
    wowsimsNote: "Classic Command still in racials.go.",
    simUses: "not encoded",
    effect: null,
  }),
  row({
    id: "undead-wotf",
    raceId: "undead",
    name: "Will of the Forsaken",
    slot: "active",
    sources: {
      talentsforever:
        "Instant, 2 min. Removes all Charm, Fear and Sleep effects. Classic also granted immunity while it lasted.",
      wowhead: "Guide: break Charm/Fear/Sleep, no longer an immunity.",
      icyveins: "Instantly break all Charm, Fear, and Sleep effects.",
      wowsod:
        "Instant, 2 min. Removes Charm, Fear and Sleep. No longer an immunity (Deep Dive slide).",
      wowsims: "Classic Undead: shadow resist only in the snippet we read.",
    },
    chosen: "Utility only.",
    disputed: false,
    wowsims: "misaligned",
    wowsimsNote: "Forever break-not-immunity not modeled.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "undead-cannibalize",
    raceId: "undead",
    name: "Cannibalize",
    slot: "active",
    sources: {
      talentsforever:
        "5 yd, 2 min. Regenerates 7% Health and 7% Mana every 2 sec for 10 sec from a Humanoid or Undead corpse; moving, acting or taking damage cancels.",
      wowhead: "Not fully documented on Forever spell page at audit.",
      icyveins: "Consume a nearby corpse to gain 35% Health and Mana over time.",
      wowsod: "7% Health and 7% Mana every 2 sec for 10 sec (35% total).",
      wowsims: "Not in the Classic Undead case we read.",
    },
    chosen: "Utility / out of combat. No Patchwerk DPS.",
    disputed: false,
    wowsims: "missing",
    wowsimsNote: "Not implemented.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "undead-underwater",
    raceId: "undead",
    name: "Underwater Breathing",
    slot: "passive",
    sources: {
      talentsforever: "Underwater breath lasts 300% longer.",
      wowhead: "Classic-style underwater breathing.",
      icyveins: "Underwater breathing is increased by 300%.",
      wowsod: "Breathe underwater 300% longer.",
      wowsims: "Not a DPS effect.",
    },
    chosen: "Utility only.",
    disputed: false,
    wowsims: "missing",
    wowsimsNote: "Irrelevant to PVE dummy.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "undead-grave",
    raceId: "undead",
    name: "Touch of the Grave",
    slot: "passive",
    sources: {
      talentsforever:
        "Spells and attacks drain Health up to 5% of your maximum Health: 5% chance for casters, 10% for melee, 1 sec internal cooldown. Not in Classic.",
      wowhead: "Not in Wowhead Forever database yet.",
      icyveins: "Chance on hit to drain health from your target. No numbers.",
      wowsod:
        "5% chance to drain Health from the target, up to 5% of your maximum Health (no melee/caster split in the demo line).",
      wowsims: "Absent.",
    },
    chosen:
      "Beta client: 5% caster / 10% melee chance, 1s ICD, drain up to 5% max HP. Per-hit coefficient unknown — combat sim uses a small placeholder, not the cap as typical.",
    disputed: true,
    disputeNote:
      "Proc rates locked from the beta export. Drain formula is still unknown; ElliotWood rolls 2.5–5% max HP with no ICD, which would dominate. We keep the 5/10 split and 1s ICD and do not treat the cap as average damage.",
    wowsims: "aligned",
    wowsimsNote:
      "ElliotWood: 5% caster / 10% melee, 1s ICD, placeholder coeff 36 capped at 5% max HP.",
    simUses: "touchOfTheGrave 5/10/5%/1s",
    effect: {
      kind: "touchOfTheGrave",
      casterChance: 0.05,
      meleeChance: 0.1,
      maxHpFraction: 0.05,
      icdSec: 1,
    },
  }),
  row({
    id: "tauren-warstomp",
    raceId: "tauren",
    name: "War Stomp",
    slot: "active",
    sources: {
      talentsforever: "0.5 sec cast, 2 min. Stuns up to 5 enemies within 8 yds for 2 sec.",
      wowhead: "Classic War Stomp still listed.",
      icyveins: "Stuns all nearby targets for 2 seconds.",
      wowsod: "0.5 sec cast, 2 min. Stuns up to 5 enemies within 8 yds for 2 sec.",
      wowsims: "Not a dummy DPS cooldown.",
    },
    chosen: "Utility only.",
    disputed: false,
    wowsims: "missing",
    wowsimsNote: "Not used as DPS.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "tauren-cultivation",
    raceId: "tauren",
    name: "Cultivation",
    slot: "active",
    sources: {
      talentsforever:
        "Cultivate a nearby herb, growing a duplicate you can harvest without Herbalism. Each herb may only be cultivated once. Classic was +15 Herbalism.",
      wowhead: "Profession bonus in Classic data.",
      icyveins: "Grow bonus herbalism nodes. Do not require Herbalism.",
      wowsod: "Grow bonus herbs without Herbalism (listed as passive on that page).",
      wowsims: "Absent.",
    },
    chosen: "Utility only.",
    disputed: false,
    wowsims: "missing",
    wowsimsNote: "Not implemented.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "tauren-plainsrunning",
    raceId: "tauren",
    name: "Plainsrunning",
    slot: "passive",
    sources: {
      talentsforever:
        "Gain 1% movement speed every 5 sec spent moving, up to 30%. Taking damage or standing still reduces this effect. Not in Classic.",
      wowhead: "Not in Forever database yet.",
      icyveins: "Gain increased Movement Speed the longer you spend running.",
      wowsod: "Gain increased movement speed the longer you keep moving.",
      wowsims: "Absent.",
    },
    chosen: "Utility only.",
    disputed: false,
    wowsims: "missing",
    wowsimsNote: "Not implemented.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "tauren-endurance",
    raceId: "tauren",
    name: "Endurance",
    slot: "passive",
    sources: {
      talentsforever:
        "Increases total Health by 5% and Hit Chance by 1%. Classic was 5% base Health only.",
      wowhead: "Classic 5% health; Forever hit not always on the spell page.",
      icyveins: "Total Health is increased by 5%. Hit chance is increased by 1%.",
      wowsod: "+5% total Health, +1% Hit Chance.",
      wowsims: "Classic: MultiplyStat Health 1.05 only. No hit.",
    },
    chosen: "+5% health (Touch of the Grave scaling only) and +1% hit.",
    disputed: false,
    wowsims: "aligned",
    wowsimsNote: "ElliotWood: +1% hit scored; +5% HP only for ToG cap, not as stamina DPS.",
    simUses: "hitPassive 1%",
    effect: { kind: "hitPassive", percent: 0.01 },
  }),
  row({
    id: "troll-berserking",
    raceId: "troll",
    name: "Berserking",
    slot: "active",
    sources: {
      talentsforever:
        "Instant, 3 min. Increases spellcasting and attack speed by 10%. The recorded tooltip does not publish the duration.",
      wowhead: "Often still Classic missing-HP 10–30% Berserking.",
      icyveins:
        "Increases Melee, Ranged, and Spell Haste by 10% for 12 seconds.",
      wowsod:
        "Instant, 3 min. Increases spellcasting and attack speed by 10% for 10 sec.",
      wowsims:
        "Classic: 10–30% haste from missing health, resource costs, 10s duration.",
    },
    chosen: "Flat 10% haste, 10 sec / 3 min. Not missing-HP scaling. No resource cost.",
    disputed: false,
    wowsims: "aligned",
    wowsimsNote:
      "ElliotWood: flat 10% haste for 10s / 3 min, no resource cost.",
    simUses: "hastePercentWindow 10% / 10s / 180s",
    effect: {
      kind: "hastePercentWindow",
      percent: 0.1,
      durationSec: 10,
      cooldownSec: 180,
    },
  }),
  row({
    id: "troll-rapid-regen",
    raceId: "troll",
    name: "Rapid Regeneration",
    slot: "active",
    sources: {
      talentsforever:
        "Channeled, 3 min. Regenerates 50% of maximum Health over 6 sec; movement, action or damage taken cancels.",
      wowhead: "Not in Forever database yet.",
      icyveins: "Regenerate 50% of your Maximum Health over time.",
      wowsod: "Channeled, 3 min. 50% max Health over 6 sec.",
      wowsims: "Absent.",
    },
    chosen: "Utility only. Channel would cost dummy DPS.",
    disputed: false,
    wowsims: "missing",
    wowsimsNote: "Not implemented.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "troll-beast-slaying",
    raceId: "troll",
    name: "Beast Slaying",
    slot: "passive",
    sources: {
      talentsforever: "Increases damage dealt to Beasts by 5%.",
      wowhead: "Classic +5% vs Beasts still listed.",
      icyveins: "Damage to Beasts increased by 5%.",
      wowsod: "+5% damage vs Beasts.",
      wowsims: "Classic +5% vs beasts is in racials.go.",
    },
    chosen: "Encoded but OFF on the generic dummy.",
    disputed: false,
    wowsims: "aligned",
    wowsimsNote: "Same 5% vs beasts; our generic fight does not apply it.",
    simUses: "beastDamage 5% (off on generic dummy)",
    effect: { kind: "beastDamage", percent: 0.05 },
  }),
  row({
    id: "troll-bow-spec",
    raceId: "troll",
    name: "Bow Specialization (Classic trap)",
    slot: "passive",
    sources: {
      talentsforever: "Not in the four Forever racials. Beast Slaying stayed.",
      wowhead: "Classic bow crit still on old spell pages.",
      icyveins: "Not listed.",
      wowsod: "Not listed.",
      wowsims: "Still grants +1% ranged crit with bows/thrown.",
    },
    chosen: "Rejected.",
    disputed: false,
    wowsims: "misaligned",
    wowsimsNote: "Classic bow/thrown spec still in the sim.",
    simUses: "not encoded",
    effect: null,
  }),
  row({
    id: "troll-regen",
    raceId: "troll",
    name: "Regeneration",
    slot: "passive",
    sources: {
      talentsforever:
        "Increases Health regeneration rate by 10%. 10% of Health regeneration continues during combat.",
      wowhead: "Classic in-combat regen.",
      icyveins: "10% of your total Health regeneration continues during combat.",
      wowsod: "10% of Health regen continues in combat.",
      wowsims: "Not a dummy DPS effect.",
    },
    chosen: "Utility / sustain only.",
    disputed: false,
    wowsims: "missing",
    wowsimsNote: "Not a DPS aura in the sim.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "windshaper-walk",
    raceId: "windshaper",
    name: "Walk on Air",
    slot: "active",
    sources: {
      talentsforever:
        "Instant, 2 min. Glide downward through the air for 10 sec.",
      wowhead: "Not in Forever database yet.",
      icyveins: "Glide downward through the air for 10 seconds.",
      wowsod: "Instant, 2 min. Glide 10 sec.",
      wowsims: "Skyborne race not in Classic racials.go.",
    },
    chosen: "Utility only.",
    disputed: false,
    wowsims: "missing",
    wowsimsNote: "No Skyborne.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "windshaper-skysight",
    raceId: "windshaper",
    name: "Skysight",
    slot: "active",
    sources: {
      talentsforever:
        "0.5 sec, 2 min. +10% movement and mounted speed for 30 sec, or 15 min if a convergence is nearby.",
      wowhead: "Not in Forever database yet.",
      icyveins: "Skyborne card uses Read Ley Line (High Order version) in the article table.",
      wowsod:
        "0.5 sec, 2 min. +10% movement and mounted speed for 30 sec, or 15 min if a convergence is nearby.",
      wowsims: "Absent.",
    },
    chosen: "Utility only. High Order gets Read Ley Line instead.",
    disputed: false,
    wowsims: "missing",
    wowsimsNote: "No Skyborne.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "windshaper-wind",
    raceId: "windshaper",
    name: "Wind Blessed",
    slot: "passive",
    sources: {
      talentsforever:
        "Increases melee, ranged and spellcasting Haste by 1%.",
      wowhead: "Not in Forever database yet.",
      icyveins: "Spell, Ranged, and Melee Haste increased by 1%.",
      wowsod: "1% increased melee, ranged, and spellcasting Haste.",
      wowsims: "Absent.",
    },
    chosen: "+1% haste passive.",
    disputed: false,
    wowsims: "aligned",
    wowsimsNote: "ElliotWood: +1% haste on Skyborne Windshaper.",
    simUses: "hastePassive 1%",
    effect: { kind: "hastePassive", percent: 0.01 },
  }),
  row({
    id: "windshaper-elemental",
    raceId: "windshaper",
    name: "Elemental Insight",
    slot: "passive",
    sources: {
      talentsforever: "Increases damage dealt to Elementals by 5%.",
      wowhead: "Not in Forever database yet.",
      icyveins: "Damage done to Elementals is increased by 5%.",
      wowsod: "Damage to Elementals increased by 5%.",
      wowsims: "Absent.",
    },
    chosen: "Encoded but OFF on the generic dummy.",
    disputed: false,
    wowsims: "aligned",
    wowsimsNote: "ElliotWood: +5% vs elementals; off on the Demon dummy.",
    simUses: "elementalDamage 5% (off on generic dummy)",
    effect: { kind: "elementalDamage", percent: 0.05 },
  }),
  row({
    id: "human-will",
    raceId: "human",
    name: "Will to Survive",
    slot: "active",
    sources: {
      talentsforever: "Instant, 3 min. Removes all Stun effects. Not in Classic.",
      wowhead: "Not in Forever database yet.",
      icyveins: "Instantly remove all Stuns.",
      wowsod: "Instant, 3 min. Instantly removes all Stun effects.",
      wowsims: "Absent. Classic Human is Spirit + weapon skill.",
    },
    chosen: "Utility only.",
    disputed: false,
    wowsims: "missing",
    wowsimsNote: "Classic Human package.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "human-perception",
    raceId: "human",
    name: "Perception",
    slot: "active",
    sources: {
      talentsforever:
        "Instant, 3 min. Dramatically increases stealth detection for 20 sec.",
      wowhead: "Classic Perception.",
      icyveins: "Automatically detect stealthed enemies for 20 seconds.",
      wowsod: "Instant, 3 min. Dramatically increases stealth detection for 20 sec.",
      wowsims: "Not a dummy DPS cooldown.",
    },
    chosen: "Utility only.",
    disputed: false,
    wowsims: "missing",
    wowsimsNote: "Not DPS.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "human-sword",
    raceId: "human",
    name: "Sword Specialization",
    slot: "passive",
    sources: {
      talentsforever:
        "Increases critical strike chance with all spells and attacks by 2% while a sword or two-handed sword is equipped. Classic was +5 weapon skill.",
      wowhead: "Guide: Swords increase spell and ability crit (amount not always shown).",
      icyveins:
        "Swords increase Spell and Ability Critical Strike chance by 2%.",
      wowsod: "While wielding a sword, +2% spell and ability critical strike chance.",
      wowsims: "Classic mace+sword expertise, not 2% crit.",
    },
    chosen: "+2% crit while sword equipped.",
    disputed: false,
    wowsims: "aligned",
    wowsimsNote: "ElliotWood: +2% spell and ability crit while a sword is equipped.",
    simUses: "weaponCrit sword 2%",
    effect: { kind: "weaponCrit", weapon: "sword", critPct: 0.02 },
  }),
  row({
    id: "human-spirit",
    raceId: "human",
    name: "The Human Spirit",
    slot: "passive",
    sources: {
      talentsforever: "Increases your Spirit by 5%. Classic was 10% (wowsims still has 10%).",
      wowhead: "Classic 10% Spirit still common on old pages.",
      icyveins: "Total Spirit is increased by 5%.",
      wowsod: "+5% Spirit.",
      wowsims: "MultiplyStat Spirit 1.10 (Classic 10%).",
    },
    chosen: "+5% Spirit. Scored as mana regen in the combat sim.",
    disputed: false,
    wowsims: "aligned",
    wowsimsNote: "ElliotWood: +5% Spirit (not Classic 10%).",
    simUses: "spiritPercent 5%",
    effect: { kind: "spiritPercent", percent: 0.05 },
  }),
  row({
    id: "dwarf-stoneform",
    raceId: "dwarf",
    name: "Stoneform",
    slot: "active",
    sources: {
      talentsforever:
        "Instant, 3 min. Removes and grants immunity to Bleed, Poison and Disease, and reduces all Physical damage taken by 10% for 8 sec. Classic increased armor 10%.",
      wowhead: "Often still Classic armor Stoneform.",
      icyveins:
        "Immunity to Poisons, Bleeds, Diseases, and reduce Physical damage taken for 8 seconds.",
      wowsod:
        "Instant, 3 min. Bleed/Poison/Disease immunity, 10% less Physical damage for 8 sec.",
      wowsims: "Classic: 10% armor multiplier for 8s, not physical damage taken.",
    },
    chosen: "Utility / survivability. No dummy DPS.",
    disputed: false,
    wowsims: "misaligned",
    wowsimsNote: "Armor multiplier, not 10% physical DR.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "dwarf-treasure",
    raceId: "dwarf",
    name: "Find Treasure",
    slot: "active",
    sources: {
      talentsforever: "Senses nearby treasure on the minimap. Lasts until cancelled.",
      wowhead: "Classic Find Treasure.",
      icyveins: "Track nearby treasure chests. Stacks with other tracking.",
      wowsod: "Sense nearby treasure on the minimap.",
      wowsims: "Absent.",
    },
    chosen: "Utility only.",
    disputed: false,
    wowsims: "missing",
    wowsimsNote: "Not DPS.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "dwarf-mace",
    raceId: "dwarf",
    name: "Mace Specialization",
    slot: "passive",
    sources: {
      talentsforever:
        "Increases critical strike chance with all spells and attacks by 1% while a mace or two-handed mace is equipped. Classic was +5 weapon skill.",
      wowhead: "Guide: Maces increase spell and ability crit.",
      icyveins:
        "Maces increase Spell and Ability Critical Strike chance by 1%.",
      wowsod:
        "+1% critical strike chance with all spells and attacks while a mace or two-handed mace is equipped.",
      wowsims: "Classic mace expertise on Human, not Dwarf crit. Dwarf has Gun Spec.",
    },
    chosen: "+1% crit while mace equipped.",
    disputed: false,
    wowsims: "aligned",
    wowsimsNote: "ElliotWood: +1% spell and ability crit while a mace is equipped.",
    simUses: "weaponCrit mace 1%",
    effect: { kind: "weaponCrit", weapon: "mace", critPct: 0.01 },
  }),
  row({
    id: "dwarf-gun-spec",
    raceId: "dwarf",
    name: "Gun Specialization (Classic trap)",
    slot: "passive",
    sources: {
      talentsforever: "Replaced by Big Game Hunter. Not in the four Forever racials.",
      wowhead: "Classic gun crit still on old spell pages.",
      icyveins: "Not listed. Big Game Hunter is the beast racial.",
      wowsod: "Not listed.",
      wowsims: "Still +1% ranged crit with guns.",
    },
    chosen: "Rejected.",
    disputed: false,
    wowsims: "misaligned",
    wowsimsNote: "Classic Gun Spec still in racials.go.",
    simUses: "not encoded",
    effect: null,
  }),
  row({
    id: "dwarf-bgh",
    raceId: "dwarf",
    name: "Big Game Hunter",
    slot: "passive",
    sources: {
      talentsforever:
        "Increases damage dealt to Beasts by 5%. Classic was +1% gun crit.",
      wowhead: "Not in Forever database yet.",
      icyveins: "Damage done to Beasts is increased by 5%.",
      wowsod: "+5% damage vs Beasts.",
      wowsims: "Absent (Gun Spec instead).",
    },
    chosen: "Encoded but OFF on the generic dummy.",
    disputed: false,
    wowsims: "aligned",
    wowsimsNote: "ElliotWood: +5% vs beasts; off on the Demon dummy. Gun Spec is not encoded.",
    simUses: "beastDamage 5% (off on generic dummy)",
    effect: { kind: "beastDamage", percent: 0.05 },
  }),
  row({
    id: "nightelf-elune",
    raceId: "nightelf",
    name: "Elune's Light",
    slot: "active",
    sources: {
      talentsforever:
        "Instant, 3 min. Increases critical strike chance with all spells and attacks by 10% for 15 sec. Not in Classic.",
      wowhead: "Not in Forever database yet (Light of Elune pages may be Classic).",
      icyveins: "Increases Critical Strike chance by 10% for 15 seconds.",
      wowsod:
        "Instant, 3 min. +10% crit with all spells and attacks for 15 sec.",
      wowsims: "Absent. Classic Night Elf is Nature resist + 1% dodge.",
    },
    chosen: "+10% crit for 15 sec / 3 min.",
    disputed: false,
    wowsims: "aligned",
    wowsimsNote: "ElliotWood: +10% crit for 15s / 3 min.",
    simUses: "critPercentWindow 10% / 15s / 180s",
    effect: {
      kind: "critPercentWindow",
      percent: 0.1,
      durationSec: 15,
      cooldownSec: 180,
    },
  }),
  row({
    id: "nightelf-shadowmeld",
    raceId: "nightelf",
    name: "Shadowmeld",
    slot: "active",
    sources: {
      talentsforever:
        "Instant, 10 sec. Slip into shadows until you move. Usable in combat (2 min CD in combat). Classic could not be used in combat.",
      wowhead: "Classic out-of-combat Shadowmeld.",
      icyveins: "Gain Stealth. Cancels out when moving.",
      wowsod: "Usable in combat: enemies discouraged from attacking; CD becomes 2 min.",
      wowsims: "Not a dummy DPS cooldown.",
    },
    chosen: "Utility only. Dropping combat on a dummy is not modeled.",
    disputed: false,
    wowsims: "missing",
    wowsimsNote: "Not DPS.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "nightelf-quickness",
    raceId: "nightelf",
    name: "Quickness",
    slot: "passive",
    sources: {
      talentsforever:
        "Increases Dodge chance by 1% and movement speed by 2%. Night Elf Rogues and Druids stealth as if 1 level higher. Classic was 1% Dodge only.",
      wowhead: "Classic 1% Dodge.",
      icyveins: "Dodge chance and Movement Speed increased by 2% (dodge number disagrees).",
      wowsod: "+1% Dodge, +2% run speed.",
      wowsims: "Classic +1% dodge only.",
    },
    chosen: "+1% Dodge, +2% move. Not dummy DPS.",
    disputed: false,
    wowsims: "aligned",
    wowsimsNote: "Dodge 1% matches Classic; move speed / stealth level are extra.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "nightelf-wisp",
    raceId: "nightelf",
    name: "Wisp Spirit",
    slot: "passive",
    sources: {
      talentsforever: "Increases movement speed by 75% while dead. Classic was 50%.",
      wowhead: "Classic 50% or Forever 75% depending on page.",
      icyveins: "Movement Speed while a ghost is increased by 75%.",
      wowsod: "+75% speed while dead.",
      wowsims: "Absent.",
    },
    chosen: "Utility only.",
    disputed: false,
    wowsims: "missing",
    wowsimsNote: "Not DPS.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "gnome-escape",
    raceId: "gnome",
    name: "Escape Artist",
    slot: "active",
    sources: {
      talentsforever:
        "Instant, 2 min. Escapes any movement impairing effect and grants immunity to them for 3 sec. Classic had no immunity window.",
      wowhead: "Classic Escape Artist, no immunity.",
      icyveins: "Break roots and snares, immune for 5 seconds.",
      wowsod: "Instant, 2 min. Escape movement impairing, immunity for 3 sec.",
      wowsims: "Not a dummy DPS cooldown.",
    },
    chosen: "Utility only. Immunity window 3 sec (beta), not Icy Veins 5 sec.",
    disputed: false,
    wowsims: "missing",
    wowsimsNote: "Not DPS.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "gnome-eureka",
    raceId: "gnome",
    name: "Eureka!",
    slot: "active",
    sources: {
      talentsforever:
        "Instant, 2 min. Next 3 damaging abilities cost less (50% Mana, 40% Rage, 20% Energy) and deal 10% more damage. Healers: 15% less Mana and 10% more healing. Not in Classic.",
      wowhead: "Not in Forever database yet.",
      icyveins:
        "Reduce the cost and increase the damage/healing of your next 3 spells or abilities by 10%.",
      wowsod:
        "Next 3 damaging or healing abilities cost 50% less Mana and do 10% more damage or healing (Warlock tooltip listed damage half).",
      wowsims: "Absent. Classic Gnome is 5% Intellect.",
    },
    chosen:
      "Next 3 damaging abilities deal 10% more damage / 2 min. Cost cuts 50% Mana / 40% Rage / 20% Energy; healers +10% healing.",
    disputed: false,
    wowsims: "aligned",
    wowsimsNote:
      "ElliotWood: next 3 damaging abilities +10% damage / 2 min, with Forever cost cuts.",
    simUses: "eureka 10% x 3 / 120s",
    effect: {
      kind: "eureka",
      damageBonus: 0.1,
      abilities: 3,
      cooldownSec: 120,
    },
  }),
  row({
    id: "gnome-mind",
    raceId: "gnome",
    name: "Expansive Mind",
    slot: "passive",
    sources: {
      talentsforever:
        "Increases Mana, Rage and Energy by 5%. Classic increased Intellect by 5%.",
      wowhead: "Classic 5% Intellect pages still common.",
      icyveins: "Maximum Mana, Rage, and Energy is increased by 5%.",
      wowsod: "+5% Mana, Rage and Energy.",
      wowsims: "MultiplyStat Intellect 1.05.",
    },
    chosen:
      "+5% Mana, Rage and Energy. Forever replaced Classic 5% Intellect; scored as the resource pool, not spell crit.",
    disputed: false,
    wowsims: "aligned",
    wowsimsNote: "ElliotWood: +5% mana / rage / energy, not Classic 5% Intellect.",
    simUses: "resourcePercent 5%",
    effect: { kind: "resourcePercent", percent: 0.05 },
  }),
  row({
    id: "gnome-eng",
    raceId: "gnome",
    name: "Engineering Specialization",
    slot: "passive",
    sources: {
      talentsforever:
        "Reduces the chance that engineering devices fail or backfire by 20%. Classic was +15 Engineering skill.",
      wowhead: "Classic +15 Engineering.",
      icyveins: "Engineering profession skill increased by 10.",
      wowsod: "More reliable engineering devices.",
      wowsims: "Absent.",
    },
    chosen: "Utility / profession. Not dummy DPS. 20% fail reduction (beta), not Icy Veins +10 skill.",
    disputed: false,
    wowsims: "missing",
    wowsimsNote: "Not implemented.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "highorder-walk",
    raceId: "highorder",
    name: "Walk on Air",
    slot: "active",
    sources: {
      talentsforever: "Same as Windshaper: glide 10 sec / 2 min.",
      wowhead: "Not in Forever database yet.",
      icyveins: "Glide downward through the air for 10 seconds.",
      wowsod: "Instant, 2 min. Glide 10 sec.",
      wowsims: "No Skyborne.",
    },
    chosen: "Utility only.",
    disputed: false,
    wowsims: "missing",
    wowsimsNote: "No Skyborne.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "highorder-ley",
    raceId: "highorder",
    name: "Read Ley Line",
    slot: "active",
    sources: {
      talentsforever:
        "2 sec, 2 min. +100% Health and Mana regeneration: 15 sec if no ley line nearby, 15 min if one is found.",
      wowhead: "Not in Forever database yet.",
      icyveins: "Gain 100% increased Health and Mana regeneration for 15 seconds.",
      wowsod:
        "2 sec, 2 min. Tap a nearby ley line for +100% Health and Mana regeneration.",
      wowsims: "Absent.",
    },
    chosen: "Utility / regen. No dummy DPS.",
    disputed: false,
    wowsims: "missing",
    wowsimsNote: "No Skyborne.",
    simUses: "utility badge",
    effect: null,
  }),
  row({
    id: "highorder-wind",
    raceId: "highorder",
    name: "Wind Blessed",
    slot: "passive",
    sources: {
      talentsforever: "1% melee, ranged and spellcasting Haste.",
      wowhead: "Not in Forever database yet.",
      icyveins: "Spell, Ranged, and Melee Haste increased by 1%.",
      wowsod: "1% increased melee, ranged, and spellcasting Haste.",
      wowsims: "Absent.",
    },
    chosen: "+1% haste passive.",
    disputed: false,
    wowsims: "aligned",
    wowsimsNote: "ElliotWood: +1% haste on Skyborne High Order.",
    simUses: "hastePassive 1%",
    effect: { kind: "hastePassive", percent: 0.01 },
  }),
  row({
    id: "highorder-elemental",
    raceId: "highorder",
    name: "Elemental Insight",
    slot: "passive",
    sources: {
      talentsforever: "Increases damage dealt to Elementals by 5%.",
      wowhead: "Not in Forever database yet.",
      icyveins: "Damage done to Elementals is increased by 5%.",
      wowsod: "Damage to Elementals increased by 5%.",
      wowsims: "Absent.",
    },
    chosen: "Encoded but OFF on the generic dummy.",
    disputed: false,
    wowsims: "aligned",
    wowsimsNote: "ElliotWood: +5% vs elementals; off on the Demon dummy.",
    simUses: "elementalDamage 5% (off on generic dummy)",
    effect: { kind: "elementalDamage", percent: 0.05 },
  }),
  row({
    id: "priest-starshards",
    raceId: "priest",
    name: "Starshards (Night Elf Priest)",
    slot: "class",
    sources: {
      talentsforever:
        "Class racial still listed on demo dumps. Rank 4 at 38: 816 Arcane over 6 sec, 30 sec cooldown (wowsod). Fear Ward is baseline for every Priest.",
      wowhead: "Classic Starshards pages; Forever rank 60 not confirmed.",
      icyveins: "Not in the race racial table (class spell).",
      wowsod:
        "Rank 4 at 38: 190 mana, channeled, 30 sec CD, 816 Arcane over 6 sec. Classic had no CD and far less damage.",
      wowsims: "Classic Starshards if priest racials exist; not verified here.",
    },
    chosen:
      "Channeled rank-4 tooltip only (level 38): 816 Arcane over 6 sec / 30 sec CD on Night Elf Shadow. Rank 60 not in the beta export — not extrapolated.",
    disputed: true,
    disputeNote: "Level 38 demo tooltip only. Do not invent a 60 rank.",
    wowsims: "aligned",
    wowsimsNote: "Placeholder extraDps 40 until a rank-60 tooltip exists.",
    simUses: "starshards extraDps 40 on Night Elf Priest specs",
    effect: { kind: "starshards", extraDps: 40 },
  }),
  row({
    id: "blood-elf-trap",
    raceId: "orc",
    name: "Arcane Torrent (Classic trap)",
    slot: "passive",
    sources: {
      talentsforever: "Blood Elf is not a Forever race.",
      wowhead: "TBC Classic data.",
      icyveins: "Not a Forever race.",
      wowsod: "Not listed.",
      wowsims: "RaceBloodElf still in racials.go (Arcane Torrent energy/mana).",
    },
    chosen: "Rejected. Not a Forever race.",
    disputed: false,
    wowsims: "misaligned",
    wowsimsNote: "TBC race leftover in wowsims/forever.",
    simUses: "not encoded",
    effect: null,
  }),
  row({
    id: "draenei-trap",
    raceId: "orc",
    name: "Gift of the Naaru (Classic trap)",
    slot: "active",
    sources: {
      talentsforever: "Draenei is not a Forever race.",
      wowhead: "TBC Classic data.",
      icyveins: "Not a Forever race.",
      wowsod: "Not listed.",
      wowsims: "RaceDraenei Gift of the Naaru still in racials.go.",
    },
    chosen: "Rejected. Not a Forever race.",
    disputed: false,
    wowsims: "misaligned",
    wowsimsNote: "TBC race leftover in wowsims/forever.",
    simUses: "not encoded",
    effect: null,
  }),
];

export function scoredAuditRows(): RacialAuditRow[] {
  return RACIAL_AUDIT.filter((entry) => entry.effect !== null);
}

export function effectsForRace(raceId: RaceId): EngineEffect[] {
  return RACIAL_AUDIT.filter((entry) => entry.raceId === raceId)
    .map((entry) => entry.effect)
    .filter((effect): effect is EngineEffect => effect !== null);
}

export function priestClassEffects(): EngineEffect[] {
  return RACIAL_AUDIT.filter((entry) => entry.raceId === "priest")
    .map((entry) => entry.effect)
    .filter((effect): effect is EngineEffect => effect !== null);
}

export function utilityNamesForRace(raceId: RaceId): string[] {
  return RACIAL_AUDIT.filter(
    (entry) =>
      entry.raceId === raceId &&
      entry.effect === null &&
      !entry.name.includes("Classic trap"),
  ).map((entry) => entry.name);
}

export function disputedRows(): RacialAuditRow[] {
  return RACIAL_AUDIT.filter((entry) => entry.disputed);
}
