import { kitForSpec, type PrebisKit } from "@/lib/data/prebis";
import type { SpecDef } from "@/lib/data/specs";
import type { RaceId, WeaponFamily } from "@/lib/types";
import simResults from "@/lib/data/sim-results.json";

export type Contribution = {
  label: string;
  dps: number;
};

export type SimResult = {
  raceId: RaceId;
  specId: string;
  weapon: WeaponFamily;
  kit: PrebisKit;
  baselineDps: number;
  dps: number;
  contributions: Contribution[];
  iterations: number;
  seed: number;
  talents: string;
  talentSource: string;
  missing: boolean;
};

type StoredRow = {
  specId: string;
  raceId: string;
  dps: number;
  hps: number;
  stdev: number;
  iterations: number;
  seed: number;
  talents: string;
  talentSource: string;
  weapon?: string;
  error?: string;
};

export type StoredResults = {
  engine: string;
  engineUrl: string;
  license: string;
  fightDurationSec: number;
  iterations: number;
  seed: number;
  mobType: string;
  generatedAt: string;
  rows: StoredRow[];
};

let stored = simResults as StoredResults;
let rowIndex = new Map<string, StoredRow>();

function rebuildIndex(): void {
  rowIndex = new Map();
  for (const row of stored.rows) {
    rowIndex.set(`${row.specId}:${row.raceId}`, row);
  }
}

rebuildIndex();

export function replaceSimResults(next: StoredResults): void {
  stored = next;
  rebuildIndex();
}

export function simMeta(): Omit<StoredResults, "rows"> {
  return {
    engine: stored.engine,
    engineUrl: stored.engineUrl,
    license: stored.license,
    fightDurationSec: stored.fightDurationSec,
    iterations: stored.iterations,
    seed: stored.seed,
    mobType: stored.mobType,
    generatedAt: stored.generatedAt,
  };
}

export function preferredWeapon(spec: SpecDef, raceId: RaceId): WeaponFamily {
  const options = spec.weaponOptions;
  if (raceId === "orc" && options.includes("axe")) {
    return "axe";
  }
  if (raceId === "human" && options.includes("sword")) {
    return "sword";
  }
  if (raceId === "dwarf" && options.includes("mace")) {
    return "mace";
  }
  return spec.defaultWeapon;
}

function storedWeapon(raw: string | undefined): WeaponFamily | null {
  switch (raw) {
    case "axe":
    case "mace":
    case "sword":
    case "dagger":
    case "staff":
    case "ranged":
    case "none":
      return raw;
    case undefined:
    case "":
      return null;
    default:
      return null;
  }
}

function throughput(row: StoredRow, roleHeal: boolean): number {
  if (roleHeal && row.hps > row.dps) {
    return row.hps;
  }
  return row.dps;
}

export function simulateCombo(spec: SpecDef, raceId: RaceId): SimResult {
  const kit = kitForSpec(spec.id, spec.role);
  const row = rowIndex.get(`${spec.id}:${raceId}`);
  const weapon = storedWeapon(row?.weapon) ?? preferredWeapon(spec, raceId);
  if (!row || row.error) {
    return {
      raceId,
      specId: spec.id,
      weapon,
      kit,
      baselineDps: 0,
      dps: 0,
      contributions: [],
      iterations: stored.iterations,
      seed: stored.seed,
      talents: row?.talents ?? spec.talentUrl ?? "",
      talentSource: row?.talentSource ?? "",
      missing: true,
    };
  }

  const dps = throughput(row, spec.role === "heal");
  const contributions: Contribution[] = [
    {
      label: `${stored.engine} ${stored.fightDurationSec}s Patchwerk (${stored.mobType})`,
      dps,
    },
  ];
  if (row.stdev > 0) {
    contributions.push({ label: "stdev", dps: row.stdev });
  }
  if (row.talentSource === "wowsims-default") {
    contributions.push({
      label: "talents: wowsims default tree (no guild /60/ map)",
      dps: 0,
    });
  }

  return {
    raceId,
    specId: spec.id,
    weapon,
    kit,
    baselineDps: dps,
    dps,
    contributions,
    iterations: row.iterations,
    seed: row.seed,
    talents: row.talents,
    talentSource: row.talentSource,
    missing: false,
  };
}

export function hasSimRow(specId: string, raceId: RaceId): boolean {
  const row = rowIndex.get(`${specId}:${raceId}`);
  return Boolean(row && !row.error);
}
