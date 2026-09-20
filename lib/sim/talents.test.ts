import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calcUrlFor,
  dashedFromForeverFlat,
  foreverFlatFromDashed,
  parsePastedBuild,
  simTalentsFromUrl,
  stripTalentExtras,
  treeSplitFromTalents,
} from "@/lib/sim/talents";

const furyDashed = "30305013002-050530035150010051";
const furyFlat = "30305013002000000050530035150010051";
const furyCalc = `https://nikftw.github.io/forevertalent/warrior/#${furyFlat}`;

describe("forever talent calc links", () => {
  it("strips talentsforever extras after the three trees", () => {
    assert.equal(
      stripTalentExtras("35300003-05-532001233001210531-BSjklopqruvwyz0A2CHA-3"),
      "35300003-05-532001233001210531",
    );
    assert.equal(
      stripTalentExtras("30305013002-050530035150010051--3"),
      furyDashed,
    );
  });

  it("builds a nikftw GitHub Pages calc hash", () => {
    assert.equal(treeSplitFromTalents(furyDashed), "17/34/0");
    assert.equal(foreverFlatFromDashed(furyDashed, "warrior"), furyFlat);
    assert.equal(dashedFromForeverFlat(furyFlat, "warrior"), furyDashed);
    assert.equal(calcUrlFor("warrior", furyDashed), furyCalc);
  });

  it("keeps empty first-tree frostfire alignment", () => {
    const dashed = "-0055103013013304-00550003310003002";
    const flat = foreverFlatFromDashed(dashed, "mage");
    assert.equal(dashedFromForeverFlat(flat, "mage"), dashed);
    assert.equal(treeSplitFromTalents(dashed), "0/29/22");
  });

  it("reads talentsforever /60/ URLs and nikftw calc links", () => {
    assert.equal(
      simTalentsFromUrl(
        "https://talentsforever.com/warrior/60/30305013002-050530035150010051--3",
        "warrior",
      ),
      furyDashed,
    );
    assert.equal(simTalentsFromUrl(furyCalc, "warrior"), furyDashed);
  });

  it("parses a pasted calc link, dashed hash, and flattened hash", () => {
    const fromLink = parsePastedBuild(furyCalc, "warrior");
    const fromPath = parsePastedBuild(
      `https://nikftw.github.io/forevertalent/warrior/${furyFlat}/`,
      "warrior",
    );
    const fromDashed = parsePastedBuild(furyDashed, "warrior");
    const fromFlat = parsePastedBuild(furyFlat, "warrior");
    assert.equal(fromLink.ok, true);
    assert.equal(fromPath.ok, true);
    assert.equal(fromDashed.ok, true);
    assert.equal(fromFlat.ok, true);
    if (fromLink.ok && fromPath.ok && fromDashed.ok && fromFlat.ok) {
      assert.equal(fromLink.talents, furyDashed);
      assert.equal(fromPath.talents, furyDashed);
      assert.equal(fromDashed.talents, furyDashed);
      assert.equal(fromFlat.talents, furyDashed);
      assert.equal(fromLink.treeSplit, "17/34/0");
    }
  });

  it("rejects a point split and a class mismatch", () => {
    const split = parsePastedBuild("17/34/0", "warrior");
    assert.equal(split.ok, false);
    const mismatch = parsePastedBuild(
      "https://nikftw.github.io/forevertalent/mage/#25522522312231153113",
      "warrior",
    );
    assert.equal(mismatch.ok, false);
  });
});
