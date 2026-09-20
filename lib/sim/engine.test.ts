import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { WOW_CLASSES, isLegalCombo, racesForClass } from "@/lib/data/combos";
import { RACIAL_AUDIT, scoredAuditRows } from "@/lib/data/racial-audit";
import { SPECS, dpsSpecs, specById, specsForClass } from "@/lib/data/specs";
import {
  hasSimRow,
  preferredWeapon,
  simMeta,
  simulateCombo,
} from "@/lib/sim/engine";
import { rankClass, rankSpec } from "@/lib/sim/rank";
import type { RaceId } from "@/lib/types";

describe("forever racial engine", () => {
  it("does not encode Classic traps", () => {
    const names = RACIAL_AUDIT.filter((row) => row.effect !== null).map(
      (row) => row.name,
    );
    for (const trap of [
      "Arcane Torrent",
      "Gift of the Naaru",
      "Gun Specialization",
      "Bow Specialization",
      "Command",
    ]) {
      assert.equal(
        names.some((name) => name.includes(trap)),
        false,
        `engine effects should not include ${trap}`,
      );
    }
  });

  it("marks patched ElliotWood racials as aligned and leaves Classic traps unencoded", () => {
    const bloodFury = RACIAL_AUDIT.find((row) => row.id === "orc-blood-fury");
    assert.equal(bloodFury?.wowsims, "aligned");
    const gun = RACIAL_AUDIT.find((row) => row.id === "dwarf-gun-spec");
    assert.equal(gun?.effect, null);
    assert.equal(gun?.wowsims, "misaligned");
    const torrent = RACIAL_AUDIT.find((row) => row.id === "blood-elf-trap");
    assert.equal(torrent?.effect, null);
    assert.equal(torrent?.wowsims, "misaligned");
  });

  it("locks settled racials and only flags ToG coeff and Starshards rank 60", () => {
    const scoredDisputed = scoredAuditRows()
      .filter((row) => row.disputed)
      .map((row) => row.id)
      .sort();
    assert.deepEqual(scoredDisputed, ["priest-starshards", "undead-grave"]);
    assert.equal(
      RACIAL_AUDIT.find((row) => row.id === "orc-blood-fury")?.disputed,
      false,
    );
    assert.equal(
      RACIAL_AUDIT.find((row) => row.id === "troll-berserking")?.disputed,
      false,
    );
    assert.equal(
      RACIAL_AUDIT.find((row) => row.id === "gnome-eureka")?.disputed,
      false,
    );
  });

  it("omits utility and rejected racials from the scored audit table", () => {
    const names = scoredAuditRows().map((row) => row.name);
    for (const hidden of [
      "Shatter Curse",
      "Hardiness",
      "Command",
      "Will of the Forsaken",
      "Stoneform",
      "Gun Specialization",
      "Arcane Torrent",
      "Gift of the Naaru",
    ]) {
      assert.equal(
        names.some((name) => name.includes(hidden)),
        false,
        hidden,
      );
    }
    assert.equal(names.includes("Blood Fury"), true);
    assert.equal(names.includes("The Human Spirit"), true);
    assert.equal(names.includes("Expansive Mind"), true);
    assert.equal(
      scoredAuditRows().every((row) => row.effect !== null),
      true,
    );
  });

  it("prefers racial weapons without inventing a closed-form overlay", () => {
    const fury = specById("warrior-fury");
    assert.equal(preferredWeapon(fury, "orc"), "axe");
    assert.equal(preferredWeapon(fury, "dwarf"), "mace");
    assert.equal(preferredWeapon(fury, "human"), "sword");
    const combat = specById("rogue-combat");
    assert.equal(preferredWeapon(combat, "human"), "sword");
    const mut = specById("rogue-assassination");
    assert.equal(preferredWeapon(mut, "human"), "dagger");
    assert.equal(isLegalCombo("priest", "orc"), false);
  });

  it("excludes illegal class/race combos from rankings", () => {
    const fury = specById("warrior-fury");
    const horde = rankSpec(fury, "horde");
    const alliance = rankSpec(fury, "alliance");
    assert.equal(
      horde.rows.some((row) => row.raceId === "human"),
      false,
    );
    assert.equal(
      alliance.rows.some((row) => row.raceId === "orc"),
      false,
    );
    assert.equal(racesForClass("paladin").includes("orc"), false);
    assert.equal(racesForClass("paladin").includes("undead"), true);
    assert.equal(racesForClass("shaman").includes("dwarf"), true);
    assert.equal(racesForClass("mage").includes("orc"), true);
  });

  it("includes Skyborne in default rankings", () => {
    const fury = specById("warrior-fury");
    const horde = rankSpec(fury, "horde");
    const alliance = rankSpec(fury, "alliance");
    assert.equal(
      horde.rows.some((row) => row.raceId === "windshaper"),
      true,
    );
    assert.equal(
      alliance.rows.some((row) => row.raceId === "highorder"),
      true,
    );
  });

  it("keeps heal specs out of the dps spec list used by the main board", () => {
    assert.equal(
      dpsSpecs().some((spec) => spec.role !== "dps"),
      false,
    );
    assert.equal(
      dpsSpecs().some((spec) => spec.id === "priest-disc"),
      false,
    );
  });

  it("skips specs without a guild 51-pt build", () => {
    const paladin = rankClass("paladin", ["heal"]);
    const rogue = rankClass("rogue", ["dps"]);
    const priest = rankClass("priest", ["heal"]);
    const shaman = rankClass("shaman", ["heal"]);
    const druid = rankClass("druid", ["heal"]);
    assert.equal(
      paladin.some((entry) => entry.spec.id === "paladin-holy"),
      false,
    );
    assert.equal(
      rogue.some((entry) => entry.spec.id === "rogue-subtlety"),
      false,
    );
    assert.equal(
      priest.some((entry) => entry.spec.id === "priest-holy"),
      false,
    );
    assert.equal(
      priest.some((entry) => entry.spec.id === "priest-disc"),
      false,
    );
    assert.equal(
      shaman.some((entry) => entry.spec.id === "shaman-resto"),
      false,
    );
    assert.equal(
      druid.some((entry) => entry.spec.id === "druid-resto"),
      false,
    );
  });

  it("guild talentsforever /60/ builds are 51 points", () => {
    const pinned = SPECS.filter((spec) => spec.talentUrl?.includes("/60/"));
    assert.ok(pinned.length >= 20);
    for (const spec of pinned) {
      assert.equal(spec.needsOverride, false, spec.id);
      assert.ok(spec.treeSplit, spec.id);
      const total = spec.treeSplit
        .split("/")
        .map(Number)
        .reduce((sum, value) => sum + value, 0);
      assert.equal(total, 51, spec.id);
    }
  });

  it("every ranked spec/race has a wowsims JSON row", () => {
    const meta = simMeta();
    assert.equal(meta.engine, "ElliotWood/Forever");
    assert.equal(meta.fightDurationSec, 180);
    assert.equal(meta.iterations, 300);
    assert.equal(meta.mobType, "Demon");
    const missing: string[] = [];
    for (const wowClass of WOW_CLASSES) {
      for (const spec of specsForClass(wowClass, ["dps", "heal", "tank"])) {
        for (const raceId of racesForClass(wowClass)) {
          if (!hasSimRow(spec.id, raceId as RaceId)) {
            missing.push(`${spec.id}:${raceId}`);
          }
        }
      }
    }
    assert.deepEqual(missing, []);
  });

  it("scored locked racials are aligned in the patched sim", () => {
    for (const row of scoredAuditRows()) {
      if (!row.disputed) {
        assert.equal(row.wowsims, "aligned", row.id);
      }
    }
  });

  it("reads combat means from JSON instead of an EV overlay", () => {
    const fury = specById("warrior-fury");
    const orc = simulateCombo(fury, "orc");
    const tauren = simulateCombo(fury, "tauren");
    const human = simulateCombo(fury, "human");
    assert.equal(orc.missing, false);
    assert.equal(tauren.missing, false);
    assert.equal(human.missing, false);
    assert.ok(orc.dps > 0);
    assert.notEqual(orc.dps, tauren.dps);
    assert.ok(
      !orc.contributions.some((row) => row.label.includes("Baseline kit")),
    );
  });
});

const siblingRoot = join(process.cwd(), "..", "wowsims-forever");
const hasSibling = existsSync(siblingRoot);
const describeSibling = hasSibling ? describe : describe.skip;

describeSibling("patched ElliotWood racials", () => {
  const racialsPath = join(siblingRoot, "sim", "core", "racials.go");

  it("exists beside this repo", () => {
    assert.equal(existsSync(racialsPath), true, racialsPath);
  });

  it("drops Classic traps and the fake Windshaper DPS CD", () => {
    const src = readFileSync(racialsPath, "utf8");
    assert.equal(src.includes("RaceBloodElf"), false);
    assert.equal(src.includes("RaceDraenei"), false);
    assert.equal(src.includes("registerWindshaper"), false);
    assert.equal(src.includes("4*level+2"), false);
    assert.match(
      src,
      /if forever \{\s*[\s\S]*GetStat\(stats\.AttackPower\) \* 0\.1/,
    );
    assert.match(src, /Forever tooltip has no rage\/mana\/energy cost/);
    assert.match(src, /func eurekaCostCut/);
    assert.match(src, /chance = 0\.10/);
    assert.match(src, /Duration:\s+time\.Second,/);
    assert.match(src, /Forever Blood Fury is off GCD/);
    assert.match(src, /AddMaxRage/);
  });
});

describeSibling("ranker weapon racials", () => {
  it("swaps racial weapons in the batch ranker", () => {
    const src = readFileSync(
      join(process.cwd(), "..", "wowsims-forever", "tools", "rank_races", "weapons.go"),
      "utf8",
    );
    assert.match(src, /func racializeGear/);
    assert.match(src, /WeaponTypeAxe/);
    assert.match(src, /WeaponTypeSword/);
    assert.match(src, /WeaponTypeMace/);
  });
});
