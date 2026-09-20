import { isLegalCombo } from "@/lib/data/combos";
import { RACES } from "@/lib/data/races";
import { utilityNamesForRace } from "@/lib/data/racial-audit";
import { specsForClass, type SpecDef } from "@/lib/data/specs";
import { simulateCombo, type SimResult } from "@/lib/sim/engine";
import type { Faction, RaceId, Role, WowClass } from "@/lib/types";

export type RankedRace = SimResult & {
  pctOfBest: number;
  utility: string[];
};

export type SpecRanking = {
  spec: SpecDef;
  faction: Faction;
  rows: RankedRace[];
};

export function rankSpec(spec: SpecDef, faction: Faction): SpecRanking {
  const results = RACES.filter(
    (race) =>
      race.faction === faction && isLegalCombo(spec.wowClass, race.id),
  ).map((race) => simulateCombo(spec, race.id));

  const best = Math.max(...results.map((row) => row.dps), 0);
  const rows: RankedRace[] = results
    .map((row) => ({
      ...row,
      pctOfBest: best <= 0 ? 0 : row.dps / best,
      utility: utilityNamesForRace(row.raceId),
    }))
    .sort((a, b) => b.dps - a.dps);

  return { spec, faction, rows };
}

export function rankClass(
  wowClass: WowClass,
  roles: Role[],
): { spec: SpecDef; horde: SpecRanking; alliance: SpecRanking }[] {
  return specsForClass(wowClass, roles).map((spec) => ({
    spec,
    horde: rankSpec(spec, "horde"),
    alliance: rankSpec(spec, "alliance"),
  }));
}

export function allRaceIdsInRankings(
  rankings: SpecRanking[],
): RaceId[] {
  return [...new Set(rankings.flatMap((rank) => rank.rows.map((row) => row.raceId)))];
}
